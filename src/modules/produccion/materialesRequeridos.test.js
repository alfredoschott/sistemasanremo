import { describe, expect, it } from 'vitest'
import { calcularMaterialesRequeridos } from './materialesRequeridos'

const listas = [
  {
    modelo: 'TR-100',
    materiales: [
      { materialId: 'aceite', cantidad: 2 },
      { materialId: 'tornillo', cantidad: 10 },
    ],
  },
  {
    modelo: 'TR-200',
    materiales: [{ materialId: 'aceite', cantidad: 5 }],
  },
]

describe('calcularMaterialesRequeridos', () => {
  it('multiplica la cantidad por línea de la LDM por la cantidad de items pedidos', () => {
    const resultado = calcularMaterialesRequeridos([{ modelo: 'TR-100', cantidad: 3 }], listas)
    expect(resultado).toEqual([
      { materialId: 'aceite', cantidadPlan: 6, cantidadConsumida: 0 },
      { materialId: 'tornillo', cantidadPlan: 30, cantidadConsumida: 0 },
    ])
  })

  it('acumula el mismo material cuando aparece en varios modelos del pedido', () => {
    const resultado = calcularMaterialesRequeridos(
      [
        { modelo: 'TR-100', cantidad: 1 },
        { modelo: 'TR-200', cantidad: 2 },
      ],
      listas,
    )
    const aceite = resultado.find((r) => r.materialId === 'aceite')
    // TR-100: 2 * 1 = 2, TR-200: 5 * 2 = 10 -> 12
    expect(aceite.cantidadPlan).toBe(12)
  })

  it('ignora modelos sin LDM capturada en vez de fallar', () => {
    const resultado = calcularMaterialesRequeridos([{ modelo: 'DESCONOCIDO', cantidad: 1 }], listas)
    expect(resultado).toEqual([])
  })

  it('regresa lista vacía si no hay items', () => {
    expect(calcularMaterialesRequeridos([], listas)).toEqual([])
    expect(calcularMaterialesRequeridos(undefined, listas)).toEqual([])
  })

  it('usa cantidad 1 por defecto si el item no trae cantidad', () => {
    const resultado = calcularMaterialesRequeridos([{ modelo: 'TR-100' }], listas)
    expect(resultado.find((r) => r.materialId === 'aceite').cantidadPlan).toBe(2)
  })
})
