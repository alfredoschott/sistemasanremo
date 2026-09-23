import { describe, expect, it } from 'vitest'
import { calcularPorCobrar, calcularPorPagar, calcularResumenFinanzas } from './resumenFinanzas'

const DIA_MS = 24 * 60 * 60 * 1000
const AHORA = 1_000 * DIA_MS
const ts = (ms) => ({ toMillis: () => ms })

describe('calcularPorCobrar', () => {
  it('solo incluye facturadas a crédito Fudeco que no se han cobrado', () => {
    const lista = calcularPorCobrar([
      { id: 'a', estado: 'Facturado', condicionPago: 'fudeco', monto: 100, fechaFacturado: ts(AHORA) },
      { id: 'b', estado: 'Facturado', condicionPago: 'fudeco', monto: 100, cobrado: true },
      { id: 'c', estado: 'Facturado', condicionPago: 'anticipo', monto: 100 },
      { id: 'd', estado: 'Producción', condicionPago: 'fudeco', monto: 100 },
    ])
    expect(lista.map((c) => c.id)).toEqual(['a'])
  })

  it('usa 60 días de crédito si la cotización no trae diasCredito', () => {
    const [c] = calcularPorCobrar([
      { estado: 'Facturado', condicionPago: 'fudeco', monto: 1, fechaFacturado: ts(AHORA) },
    ])
    expect(c.vencimiento).toBe(AHORA + 60 * DIA_MS)
  })
})

describe('calcularPorPagar', () => {
  it('solo incluye O.C. recibidas, sin pagar y con monto, usando el plazo del proveedor', () => {
    const lista = calcularPorPagar(
      [
        { id: 'a', estado: 'recibida', montoTotal: 50, proveedorId: 'p1', fechaRecibida: ts(AHORA) },
        { id: 'b', estado: 'recibida', montoTotal: 50, pagado: true },
        { id: 'c', estado: 'recibida', montoTotal: null },
        { id: 'd', estado: 'pendiente', montoTotal: 50 },
      ],
      () => 15,
    )
    expect(lista.map((o) => o.id)).toEqual(['a'])
    expect(lista[0].vencimiento).toBe(AHORA + 15 * DIA_MS)
  })

  it('plazo 0 (contado) es válido y vence el mismo día', () => {
    const [o] = calcularPorPagar(
      [{ estado: 'recibida', montoTotal: 50, proveedorId: 'p1', fechaRecibida: ts(AHORA) }],
      () => 0,
    )
    expect(o.vencimiento).toBe(AHORA)
  })
})

describe('calcularResumenFinanzas', () => {
  it('el saldo proyectado solo cuenta lo que vence en los próximos 30 días (o ya venció)', () => {
    const porCobrar = [
      { monto: 1000, vencimiento: AHORA + 60 * DIA_MS }, // fuera de la ventana
      { monto: 300, vencimiento: AHORA - 5 * DIA_MS }, // ya vencida: sí cuenta
    ]
    const porPagar = [{ montoTotal: 200, vencimiento: AHORA + 10 * DIA_MS }]
    expect(calcularResumenFinanzas(porCobrar, porPagar, AHORA)).toEqual({
      totalCobrar: 1300,
      totalPagar: 200,
      saldoProyectado30: 100,
    })
  })

  it('no confunde el saldo total con el proyectado', () => {
    const porCobrar = [{ monto: 410000, vencimiento: AHORA + 45 * DIA_MS }]
    const porPagar = [{ montoTotal: 27600, vencimiento: AHORA + 15 * DIA_MS }]
    const r = calcularResumenFinanzas(porCobrar, porPagar, AHORA)
    expect(r.saldoProyectado30).toBe(-27600)
    expect(r.totalCobrar - r.totalPagar).toBe(382400)
  })
})
