import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeFirestore } from '../../testUtils/fakeFirestore'

let fake

beforeEach(() => {
  vi.resetModules()
  fake = createFakeFirestore({
    ordenesFabricacion: {
      of1: {
        numeroSerie: 'OF-1',
        materialesRequeridos: [{ materialId: 'm1', cantidadPlan: 10, cantidadConsumida: 0 }],
      },
    },
  })
  vi.doMock('firebase/firestore', () => fake.module)
  vi.doMock('../../lib/firebase', () => ({ db: fake.db }))
  vi.doMock('../../lib/audit', () => ({ registrarAuditoria: vi.fn() }))
  vi.doMock('../../lib/notify', () => ({ crearNotificacion: vi.fn() }))
  vi.doMock('../../lib/seguimientoPublico', () => ({ actualizarSeguimiento: vi.fn() }))
})

describe('agregarMaterialAOF', () => {
  it('rechaza agregar un material que ya está en la lista de la OF', async () => {
    const { agregarMaterialAOF } = await import('./ofActions')
    await expect(agregarMaterialAOF({ materialesRequeridos: fake.getAll('ordenesFabricacion').of1.materialesRequeridos, id: 'of1' }, 'm1', 5)).rejects.toThrow('material-ya-agregado')
  })

  it('agrega un material nuevo que no estaba en la lista', async () => {
    const { agregarMaterialAOF } = await import('./ofActions')
    const of = { id: 'of1', materialesRequeridos: fake.getAll('ordenesFabricacion').of1.materialesRequeridos }
    await agregarMaterialAOF(of, 'm2', 8)
    const requeridos = fake.getAll('ordenesFabricacion').of1.materialesRequeridos
    expect(requeridos).toContainEqual({ materialId: 'm2', cantidadPlan: 8, cantidadConsumida: 0 })
  })
})

describe('quitarMaterialDeOF', () => {
  it('rechaza quitar un material que ya tiene consumo registrado', async () => {
    fake = createFakeFirestore({
      ordenesFabricacion: {
        of1: {
          materialesRequeridos: [{ materialId: 'm1', cantidadPlan: 10, cantidadConsumida: 3 }],
        },
      },
    })
    vi.doMock('firebase/firestore', () => fake.module)
    vi.doMock('../../lib/firebase', () => ({ db: fake.db }))
    const { quitarMaterialDeOF } = await import('./ofActions')
    const of = { id: 'of1', materialesRequeridos: fake.getAll('ordenesFabricacion').of1.materialesRequeridos }
    await expect(quitarMaterialDeOF(of, 'm1')).rejects.toThrow('material-con-consumo')
  })

  it('permite quitar un material sin consumo registrado', async () => {
    const { quitarMaterialDeOF } = await import('./ofActions')
    const of = { id: 'of1', materialesRequeridos: fake.getAll('ordenesFabricacion').of1.materialesRequeridos }
    await quitarMaterialDeOF(of, 'm1')
    expect(fake.getAll('ordenesFabricacion').of1.materialesRequeridos).toEqual([])
  })
})
