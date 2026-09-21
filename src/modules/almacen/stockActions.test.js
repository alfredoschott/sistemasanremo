import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeFirestore } from '../../testUtils/fakeFirestore'

// stockActions.js hace todas sus operaciones dentro de runTransaction
// precisamente para blindar el stock contra condiciones de carrera (ver su
// propio comentario). Estas pruebas verifican que las guardas de negocio
// escritas ahí — no dejar stock negativo, avisar cuando cruza el mínimo —
// de verdad se cumplen, usando un Firestore falso en vez del emulador real
// (que requiere Java, no disponible en este entorno).

let fake
let crearNotificacion

beforeEach(async () => {
  vi.resetModules()
  fake = createFakeFirestore({
    materiales: {
      m1: { nombre: 'Tornillo 1/2', stock: 10, minimo: 5 },
    },
  })
  vi.doMock('firebase/firestore', () => fake.module)
  vi.doMock('../../lib/firebase', () => ({ db: fake.db }))
  crearNotificacion = vi.fn()
  vi.doMock('../../lib/notify', () => ({ crearNotificacion }))
})

async function importStockActions() {
  return import('./stockActions')
}

describe('registrarMovimientoManual', () => {
  it('descuenta el stock en una salida', async () => {
    const { registrarMovimientoManual } = await importStockActions()
    await registrarMovimientoManual({ materialId: 'm1', tipo: 'salida', cantidad: 4 })
    expect(fake.getAll('materiales').m1.stock).toBe(6)
  })

  it('suma el stock en una entrada', async () => {
    const { registrarMovimientoManual } = await importStockActions()
    await registrarMovimientoManual({ materialId: 'm1', tipo: 'entrada', cantidad: 4 })
    expect(fake.getAll('materiales').m1.stock).toBe(14)
  })

  it('rechaza una salida que dejaría el stock negativo', async () => {
    const { registrarMovimientoManual } = await importStockActions()
    await expect(
      registrarMovimientoManual({ materialId: 'm1', tipo: 'salida', cantidad: 999 }),
    ).rejects.toThrow('stock-insuficiente')
    // El stock no debe haber cambiado: la transacción completa se descarta.
    expect(fake.getAll('materiales').m1.stock).toBe(10)
  })

  it('no registra el movimiento cuando la salida se rechaza', async () => {
    const { registrarMovimientoManual } = await importStockActions()
    await expect(
      registrarMovimientoManual({ materialId: 'm1', tipo: 'salida', cantidad: 999 }),
    ).rejects.toThrow()
    expect(Object.keys(fake.getAll('movimientosAlmacen'))).toHaveLength(0)
  })

  it('avisa cuando el stock cruza por debajo del mínimo', async () => {
    const { registrarMovimientoManual } = await importStockActions()
    // stock 10, mínimo 5 -> sacar 7 deja stock en 3, por debajo del mínimo.
    await registrarMovimientoManual({ materialId: 'm1', tipo: 'salida', cantidad: 7 })
    expect(crearNotificacion).toHaveBeenCalledTimes(1)
    expect(crearNotificacion.mock.calls[0][0].mensaje).toContain('quedó bajo el mínimo')
  })

  it('no avisa cuando el stock se mantiene sobre el mínimo', async () => {
    const { registrarMovimientoManual } = await importStockActions()
    await registrarMovimientoManual({ materialId: 'm1', tipo: 'salida', cantidad: 2 })
    expect(crearNotificacion).not.toHaveBeenCalled()
  })
})

describe('revertirMovimientoManual', () => {
  it('deshace exactamente el efecto contrario al movimiento original', async () => {
    const { registrarMovimientoManual, revertirMovimientoManual } = await importStockActions()
    const { movimientoId } = await registrarMovimientoManual({
      materialId: 'm1',
      tipo: 'salida',
      cantidad: 4,
    })
    expect(fake.getAll('materiales').m1.stock).toBe(6)

    await revertirMovimientoManual({ movimientoId, materialId: 'm1', tipo: 'salida', cantidad: 4 })
    expect(fake.getAll('materiales').m1.stock).toBe(10)
    expect(fake.getAll('movimientosAlmacen')[movimientoId]).toBeUndefined()
  })
})

describe('eliminarMaterial', () => {
  it('rechaza borrar un material con movimientos en su historial', async () => {
    fake = createFakeFirestore({
      materiales: { m1: { nombre: 'Tornillo 1/2', stock: 10, minimo: 5 } },
      movimientosAlmacen: { mv1: { materialId: 'm1', tipo: 'entrada', cantidad: 10 } },
      ordenesCompra: {},
    })
    vi.doMock('firebase/firestore', () => fake.module)
    vi.doMock('../../lib/firebase', () => ({ db: fake.db }))
    vi.resetModules()
    const { eliminarMaterial } = await importStockActions()
    await expect(eliminarMaterial({ id: 'm1', nombre: 'Tornillo 1/2' })).rejects.toThrow(
      'material-en-uso',
    )
  })

  it('permite borrar un material sin historial y lo puede restaurar', async () => {
    fake = createFakeFirestore({
      materiales: { m1: { nombre: 'Tornillo 1/2', stock: 10, minimo: 5 } },
      movimientosAlmacen: {},
      ordenesCompra: {},
    })
    vi.doMock('firebase/firestore', () => fake.module)
    vi.doMock('../../lib/firebase', () => ({ db: fake.db }))
    vi.resetModules()
    const { eliminarMaterial, restaurarMaterial } = await importStockActions()

    const borrado = await eliminarMaterial({ id: 'm1', nombre: 'Tornillo 1/2' })
    expect(fake.getAll('materiales').m1).toBeUndefined()

    await restaurarMaterial('m1', borrado)
    expect(fake.getAll('materiales').m1).toEqual({ nombre: 'Tornillo 1/2', stock: 10, minimo: 5 })
  })
})

describe('registrarConsumoMaterial / revertirConsumoMaterial', () => {
  beforeEach(() => {
    fake = createFakeFirestore({
      materiales: { m1: { nombre: 'Tornillo 1/2', stock: 10, minimo: 5 } },
      ordenesFabricacion: {
        of1: {
          numeroSerie: 'OF-1',
          materialesRequeridos: [{ materialId: 'm1', cantidadPlan: 20, cantidadConsumida: 0 }],
        },
      },
    })
    vi.doMock('firebase/firestore', () => fake.module)
    vi.doMock('../../lib/firebase', () => ({ db: fake.db }))
  })

  it('descuenta stock y acumula cantidadConsumida en la OF', async () => {
    const { registrarConsumoMaterial } = await importStockActions()
    await registrarConsumoMaterial({ of: { id: 'of1' }, materialId: 'm1', cantidad: 6 })
    expect(fake.getAll('materiales').m1.stock).toBe(4)
    expect(fake.getAll('ordenesFabricacion').of1.materialesRequeridos[0].cantidadConsumida).toBe(6)
  })

  it('rechaza consumir más de lo que hay en stock, aunque sea menos de lo planeado', async () => {
    const { registrarConsumoMaterial } = await importStockActions()
    await expect(
      registrarConsumoMaterial({ of: { id: 'of1' }, materialId: 'm1', cantidad: 999 }),
    ).rejects.toThrow('stock-insuficiente')
    expect(fake.getAll('materiales').m1.stock).toBe(10)
  })

  it('permite consumir más de lo planeado (con motivoExceso) sin bloquear, solo lo registra', async () => {
    const { registrarConsumoMaterial } = await importStockActions()
    await registrarConsumoMaterial({
      of: { id: 'of1' },
      materialId: 'm1',
      cantidad: 9,
      motivoExceso: 'se dañaron piezas en el corte',
    })
    expect(fake.getAll('materiales').m1.stock).toBe(1)
    expect(fake.getAll('ordenesFabricacion').of1.materialesRequeridos[0].cantidadConsumida).toBe(9)
  })

  it('revertir regresa el stock y resta lo consumido de la OF', async () => {
    const { registrarConsumoMaterial, revertirConsumoMaterial } = await importStockActions()
    const { movimientoId } = await registrarConsumoMaterial({
      of: { id: 'of1' },
      materialId: 'm1',
      cantidad: 6,
    })
    await revertirConsumoMaterial({ movimientoId, of: { id: 'of1' }, materialId: 'm1', cantidad: 6 })
    expect(fake.getAll('materiales').m1.stock).toBe(10)
    expect(fake.getAll('ordenesFabricacion').of1.materialesRequeridos[0].cantidadConsumida).toBe(0)
  })
})
