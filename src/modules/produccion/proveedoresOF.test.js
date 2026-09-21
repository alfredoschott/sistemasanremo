import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ofVencida, proveedoresDe } from './proveedoresOF'

function timestamp(ms) {
  return { toMillis: () => ms }
}

describe('proveedoresDe', () => {
  it('regresa la lista `proveedores` (formato nuevo) cuando existe', () => {
    const of = { proveedores: [{ proveedorId: 'p1', plazoEntregaDias: 10 }] }
    expect(proveedoresDe(of)).toEqual(of.proveedores)
  })

  it('normaliza el formato antiguo (proveedorId plano) a una lista de uno', () => {
    const of = { proveedorId: 'p1', plazoEntregaDias: 15 }
    expect(proveedoresDe(of)).toEqual([{ proveedorId: 'p1', plazoEntregaDias: 15 }])
  })

  it('regresa lista vacía si no hay proveedor asignado', () => {
    expect(proveedoresDe({})).toEqual([])
  })
})

describe('ofVencida', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-10T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('vencida si cualquiera de varios proveedores ya pasó su fecha', () => {
    const of = {
      fecha: timestamp(0),
      proveedores: [
        { proveedorId: 'a', fechaCompromiso: '2026-02-01' },
        { proveedorId: 'b', fechaCompromiso: '2026-01-01' },
      ],
    }
    expect(ofVencida(of)).toBe(true)
  })

  it('no vencida si ningún proveedor pasó su fecha', () => {
    const of = {
      fecha: timestamp(0),
      proveedores: [{ proveedorId: 'a', fechaCompromiso: '2026-02-01' }],
    }
    expect(ofVencida(of)).toBe(false)
  })

  it('no vencida (no truena) si la OF no tiene proveedor asignado', () => {
    expect(ofVencida({ fecha: timestamp(0) })).toBe(false)
  })
})
