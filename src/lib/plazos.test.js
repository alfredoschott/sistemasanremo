import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { estaVencido, fechaVencimiento } from './plazos'

function timestamp(ms) {
  return { toMillis: () => ms }
}

describe('fechaVencimiento', () => {
  it('usa fechaCompromiso (fin de día, hora local) cuando el proveedor dio una fecha exacta', () => {
    const ms = fechaVencimiento(timestamp(1), 30, '2026-01-15')
    const fecha = new Date(ms)
    expect([fecha.getFullYear(), fecha.getMonth(), fecha.getDate()]).toEqual([2026, 0, 15])
    expect([fecha.getHours(), fecha.getMinutes(), fecha.getSeconds()]).toEqual([23, 59, 59])
  })

  it('ignora el plazo en días si hay fechaCompromiso', () => {
    const conCompromiso = fechaVencimiento(timestamp(1), 999, '2026-01-15')
    const sinPlazo = fechaVencimiento(timestamp(1), null, '2026-01-15')
    expect(conCompromiso).toBe(sinPlazo)
  })

  it('calcula la fecha límite a partir del plazo en días cuando no hay fechaCompromiso', () => {
    const unDiaMs = 24 * 60 * 60 * 1000
    expect(fechaVencimiento(timestamp(unDiaMs), 5, null)).toBe(unDiaMs + 5 * unDiaMs)
  })

  it('regresa null si no hay ni fechaCompromiso ni plazoDias', () => {
    expect(fechaVencimiento(timestamp(1), null, null)).toBeNull()
  })

  it('regresa null si fechaCompromiso es inválida', () => {
    expect(fechaVencimiento(timestamp(1), null, 'no-es-fecha')).toBeNull()
  })
})

describe('estaVencido', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-10T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('true cuando ya pasó la fecha compromiso', () => {
    expect(estaVencido(timestamp(0), null, '2026-01-01')).toBe(true)
  })

  it('false cuando la fecha compromiso todavía no llega', () => {
    expect(estaVencido(timestamp(0), null, '2026-02-01')).toBe(false)
  })

  it('false cuando no hay ninguna fecha límite calculable', () => {
    expect(estaVencido(timestamp(0), null, null)).toBe(false)
  })
})
