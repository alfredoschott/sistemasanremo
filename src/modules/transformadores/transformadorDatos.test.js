import { describe, expect, it } from 'vitest'
import { datosFaltantes, sugerirCapacidadKva } from './transformadorDatos'

describe('datosFaltantes', () => {
  it('lista los datos logísticos vacíos', () => {
    expect(datosFaltantes({ capacidadKva: null, voltaje: '', ubicacion: '  ' })).toEqual([
      'capacidad',
      'voltaje',
      'ubicación',
    ])
  })

  it('no marca nada cuando está completo (0 kVA cuenta como capturado)', () => {
    expect(datosFaltantes({ capacidadKva: 75, voltaje: '13200/220-127', ubicacion: 'Patio A' })).toEqual([])
  })
})

describe('sugerirCapacidadKva', () => {
  it('toma los kVA del patrón TIPO-kVA-kV', () => {
    expect(sugerirCapacidadKva('TDD-500-13.2')).toBe(500)
    expect(sugerirCapacidadKva('TDD-75-13.2')).toBe(75)
    expect(sugerirCapacidadKva(' tdd-112.5-33 ')).toBe(112.5)
  })

  it('no sugiere nada si el modelo no sigue el patrón', () => {
    expect(sugerirCapacidadKva('Especial cliente X')).toBeNull()
    expect(sugerirCapacidadKva('TDD-500')).toBeNull()
    expect(sugerirCapacidadKva('')).toBeNull()
    expect(sugerirCapacidadKva(undefined)).toBeNull()
  })
})
