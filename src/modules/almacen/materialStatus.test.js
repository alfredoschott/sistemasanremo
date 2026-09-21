import { describe, expect, it } from 'vitest'
import { estadoMaterial } from './materialStatus'

describe('estadoMaterial', () => {
  it('sin capturar cuando nunca se configuró mínimo ni stock', () => {
    expect(estadoMaterial({ stock: 0, minimo: 0 })).toBe('sinCapturar')
    expect(estadoMaterial({})).toBe('sinCapturar')
  })

  it('crítico cuando el stock es cero o negativo pero sí hay mínimo configurado', () => {
    expect(estadoMaterial({ stock: 0, minimo: 5 })).toBe('critico')
    expect(estadoMaterial({ stock: -2, minimo: 5 })).toBe('critico')
  })

  it('bajo cuando el stock es positivo pero menor al mínimo', () => {
    expect(estadoMaterial({ stock: 3, minimo: 5 })).toBe('bajo')
  })

  it('ok cuando el stock alcanza o supera el mínimo', () => {
    expect(estadoMaterial({ stock: 5, minimo: 5 })).toBe('ok')
    expect(estadoMaterial({ stock: 10, minimo: 5 })).toBe('ok')
  })

  it('ok cuando no hay mínimo configurado y hay algo de stock', () => {
    expect(estadoMaterial({ stock: 10, minimo: 0 })).toBe('ok')
  })
})
