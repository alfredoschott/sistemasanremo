import { describe, expect, it } from 'vitest'
import { calcularRendimientoProveedores } from './proveedorRendimiento'

function ts(ms) {
  return { toMillis: () => ms }
}

const DIA_MS = 24 * 60 * 60 * 1000

describe('calcularRendimientoProveedores', () => {
  it('ignora las O.C. que no están recibidas', () => {
    const resultado = calcularRendimientoProveedores([
      { estado: 'pendiente', proveedorId: 'p1', fecha: ts(1), plazoEntregaDias: 10 },
    ])
    expect(resultado).toEqual([])
  })

  it('cuenta una entrega puntual como "a tiempo"', () => {
    const resultado = calcularRendimientoProveedores([
      {
        estado: 'recibida',
        proveedorId: 'p1',
        fecha: ts(1),
        plazoEntregaDias: 10,
        fechaRecibida: ts(9 * DIA_MS),
      },
    ])
    expect(resultado).toEqual([
      { proveedorId: 'p1', total: 1, aTiempo: 1, tarde: 0, pctATiempo: 100, promedioDiasAtraso: null },
    ])
  })

  it('cuenta una entrega después del límite como "tarde" y calcula los días de atraso', () => {
    const resultado = calcularRendimientoProveedores([
      {
        estado: 'recibida',
        proveedorId: 'p1',
        fecha: ts(1),
        plazoEntregaDias: 10,
        fechaRecibida: ts(13 * DIA_MS),
      },
    ])
    expect(resultado).toEqual([
      { proveedorId: 'p1', total: 1, aTiempo: 0, tarde: 1, pctATiempo: 0, promedioDiasAtraso: 3 },
    ])
  })

  it('promedia el porcentaje y los días de atraso entre varias O.C. del mismo proveedor', () => {
    const resultado = calcularRendimientoProveedores([
      { estado: 'recibida', proveedorId: 'p1', fecha: ts(1), plazoEntregaDias: 10, fechaRecibida: ts(9 * DIA_MS) },
      { estado: 'recibida', proveedorId: 'p1', fecha: ts(1), plazoEntregaDias: 10, fechaRecibida: ts(12 * DIA_MS) },
      { estado: 'recibida', proveedorId: 'p1', fecha: ts(1), plazoEntregaDias: 10, fechaRecibida: ts(14 * DIA_MS) },
    ])
    expect(resultado).toEqual([
      { proveedorId: 'p1', total: 3, aTiempo: 1, tarde: 2, pctATiempo: 33, promedioDiasAtraso: 3 },
    ])
  })

  it('separa proveedores distintos y ordena de mejor a peor porcentaje a tiempo', () => {
    const resultado = calcularRendimientoProveedores([
      { estado: 'recibida', proveedorId: 'lento', fecha: ts(1), plazoEntregaDias: 5, fechaRecibida: ts(10 * DIA_MS) },
      { estado: 'recibida', proveedorId: 'puntual', fecha: ts(1), plazoEntregaDias: 5, fechaRecibida: ts(2 * DIA_MS) },
    ])
    expect(resultado.map((r) => r.proveedorId)).toEqual(['puntual', 'lento'])
  })

  it('no cuenta ni a tiempo ni tarde una O.C. sin fecha límite calculable, pero sí en el total', () => {
    const resultado = calcularRendimientoProveedores([
      { estado: 'recibida', proveedorId: 'p1', fecha: ts(1), plazoEntregaDias: null, fechaRecibida: ts(5 * DIA_MS) },
    ])
    expect(resultado).toEqual([
      { proveedorId: 'p1', total: 1, aTiempo: 0, tarde: 0, pctATiempo: null, promedioDiasAtraso: null },
    ])
  })
})
