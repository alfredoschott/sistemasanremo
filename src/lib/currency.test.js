import { describe, expect, it } from 'vitest'
import { montoCorto } from './currency'

describe('montoCorto', () => {
  it('abrevia miles con k', () => {
    expect(montoCorto(618000)).toBe('618k')
    expect(montoCorto(27600)).toBe('28k')
  })

  it('abrevia millones con M y un decimal solo si hace falta', () => {
    expect(montoCorto(1_250_000)).toBe('1.3M')
    expect(montoCorto(2_000_000)).toBe('2M')
  })

  it('deja los montos chicos tal cual y respeta el signo', () => {
    expect(montoCorto(950)).toBe('950')
    expect(montoCorto(-27600)).toBe('-28k')
  })
})
