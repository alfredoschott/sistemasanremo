import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeFirestore } from '../../testUtils/fakeFirestore'

let fake

function montar(seed) {
  vi.resetModules()
  fake = createFakeFirestore(seed)
  vi.doMock('firebase/firestore', () => fake.module)
  vi.doMock('../../lib/firebase', () => ({ db: fake.db }))
  vi.doMock('../../lib/audit', () => ({ registrarAuditoria: vi.fn() }))
  vi.doMock('../../lib/notify', () => ({ crearNotificacion: vi.fn() }))
  vi.doMock('../../lib/seguimientoPublico', () => ({
    actualizarSeguimiento: vi.fn(),
    eliminarSeguimiento: vi.fn(),
  }))
  vi.doMock('../../lib/adjuntos', () => ({ borrarAdjuntos: vi.fn() }))
}

const cotizacion = {
  id: 'cot1',
  cliente: 'Cliente A',
  estado: 'Producción',
  ofId: 'of1',
  numeroSerie: 'OF-2026-001',
}

describe('puedeEliminarCotizacion', () => {
  beforeEach(() => montar({}))

  it('permite eliminar una cotizada o una cancelada sin OF', async () => {
    const { puedeEliminarCotizacion } = await import('./cotizacionActions')
    expect(puedeEliminarCotizacion({ estado: 'Cotizado' })).toBe(true)
    expect(puedeEliminarCotizacion({ estado: 'Cancelado' })).toBe(true)
  })

  it('no permite eliminar una cancelada que todavía tiene OF (la dejaría huérfana)', async () => {
    const { puedeEliminarCotizacion } = await import('./cotizacionActions')
    expect(puedeEliminarCotizacion({ estado: 'Cancelado', ofId: 'of1' })).toBe(false)
  })

  it('no permite eliminar una en producción o facturada', async () => {
    const { puedeEliminarCotizacion } = await import('./cotizacionActions')
    expect(puedeEliminarCotizacion({ estado: 'Producción' })).toBe(false)
    expect(puedeEliminarCotizacion({ estado: 'Facturado' })).toBe(false)
  })
})

describe('cancelarCotizacionYOF', () => {
  it('cancela la cotización, elimina la OF y solo sus O.C. pendientes', async () => {
    montar({
      cotizaciones: { cot1: { ...cotizacion, fechaEntregaEstimada: '2026-10-21' } },
      ordenesFabricacion: {
        of1: { materialesRequeridos: [{ materialId: 'm1', cantidadPlan: 5, cantidadConsumida: 0 }] },
      },
      ordenesCompra: {
        oc1: { ofId: 'of1', estado: 'pendiente' },
        oc2: { ofId: 'of1', estado: 'recibida' },
        oc3: { ofId: 'otra', estado: 'pendiente' },
      },
    })
    const { cancelarCotizacionYOF } = await import('./cotizacionActions')
    const { ocsEliminadas } = await cancelarCotizacionYOF(cotizacion)

    expect(ocsEliminadas).toBe(1)
    expect(fake.getAll('ordenesFabricacion').of1).toBeUndefined()
    expect(Object.keys(fake.getAll('ordenesCompra')).sort()).toEqual(['oc2', 'oc3'])
    const cot = fake.getAll('cotizaciones').cot1
    expect(cot.estado).toBe('Cancelado')
    expect(cot.ofId).toBeUndefined()
    expect(cot.numeroSerie).toBeUndefined()
    expect(cot.fechaEntregaEstimada).toBeUndefined()
  })

  it('rechaza si la OF ya tiene material consumido y no toca nada', async () => {
    montar({
      cotizaciones: { cot1: { ...cotizacion } },
      ordenesFabricacion: {
        of1: { materialesRequeridos: [{ materialId: 'm1', cantidadPlan: 5, cantidadConsumida: 2 }] },
      },
      ordenesCompra: { oc1: { ofId: 'of1', estado: 'pendiente' } },
    })
    const { cancelarCotizacionYOF } = await import('./cotizacionActions')
    await expect(cancelarCotizacionYOF(cotizacion)).rejects.toThrow('of-con-consumo')

    expect(fake.getAll('ordenesFabricacion').of1).toBeDefined()
    expect(fake.getAll('ordenesCompra').oc1).toBeDefined()
    expect(fake.getAll('cotizaciones').cot1.estado).toBe('Producción')
  })
})
