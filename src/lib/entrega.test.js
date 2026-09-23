import { describe, expect, it } from 'vitest'
import { calcularFechaEntrega, formatoFechaEntrega } from './entrega'
import { formatoFolioOF } from './folios'

describe('calcularFechaEntrega', () => {
  it('suma las semanas comprometidas a la fecha de inicio', () => {
    const inicio = new Date('2026-09-23T10:00:00').getTime()
    expect(calcularFechaEntrega(inicio, 4)).toBe('2026-10-21')
  })

  it('cruza de mes y de año correctamente', () => {
    const inicio = new Date('2026-12-20T10:00:00').getTime()
    expect(calcularFechaEntrega(inicio, 2)).toBe('2027-01-03')
  })

  it('acepta semanas como texto (así vienen de los formularios)', () => {
    const inicio = new Date('2026-09-23T10:00:00').getTime()
    expect(calcularFechaEntrega(inicio, '1')).toBe('2026-09-30')
  })

  it('regresa null si no hay semanas válidas', () => {
    expect(calcularFechaEntrega(Date.now(), 0)).toBeNull()
    expect(calcularFechaEntrega(Date.now(), undefined)).toBeNull()
    expect(calcularFechaEntrega(null, 4)).toBeNull()
  })
})

describe('formatoFechaEntrega', () => {
  it('muestra la fecha en español sin correrse de día', () => {
    expect(formatoFechaEntrega('2026-10-21')).toMatch(/21 oct/)
  })

  it('regresa null si no hay fecha o es inválida', () => {
    expect(formatoFechaEntrega(null)).toBeNull()
    expect(formatoFechaEntrega('no-es-fecha')).toBeNull()
  })
})

describe('formatoFolioOF', () => {
  it('rellena con ceros a 3 dígitos', () => {
    expect(formatoFolioOF(2026, 1)).toBe('OF-2026-001')
    expect(formatoFolioOF(2026, 42)).toBe('OF-2026-042')
  })

  it('no trunca números de más de 3 dígitos', () => {
    expect(formatoFolioOF(2026, 1234)).toBe('OF-2026-1234')
  })
})
