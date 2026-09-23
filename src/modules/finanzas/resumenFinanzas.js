// Cálculo compartido de cuentas por cobrar/pagar: lo usan tanto la página
// de Finanzas como la tarjeta de Finanzas del Inicio. Antes cada una hacía
// su propia cuenta y el Inicio mostraba "Saldo (30d)" restando TODO lo
// pendiente sin fijarse en fechas, mientras Finanzas sí proyectaba a 30
// días — la misma etiqueta daba números distintos en cada pantalla.

const DIA_MS = 24 * 60 * 60 * 1000
const DIAS_CREDITO_DEFAULT = 60

export function fechaVencimientoPago(base, dias) {
  const ms = base?.toMillis?.()
  // dias puede ser 0 (pago/cobro de contado) — es un valor válido, no "sin dato".
  if (!ms || dias == null) return null
  return ms + dias * DIA_MS
}

// Cotizaciones facturadas a crédito Fudeco que todavía no se cobran,
// ordenadas de la que vence primero a la que vence al último.
export function calcularPorCobrar(cotizaciones) {
  return cotizaciones
    .filter((c) => c.estado === 'Facturado' && c.condicionPago === 'fudeco' && !c.cobrado)
    .map((c) => ({
      ...c,
      vencimiento: fechaVencimientoPago(c.fechaFacturado ?? c.fecha, c.diasCredito ?? DIAS_CREDITO_DEFAULT),
    }))
    .sort((a, b) => (a.vencimiento ?? 0) - (b.vencimiento ?? 0))
}

// O.C. ya recibidas (con monto capturado) que todavía no se pagan. El
// plazo de pago es por proveedor (plazoPagoDe devuelve los días).
export function calcularPorPagar(ordenes, plazoPagoDe) {
  return ordenes
    .filter((o) => o.estado === 'recibida' && !o.pagado && o.montoTotal)
    .map((o) => ({
      ...o,
      vencimiento: fechaVencimientoPago(o.fechaRecibida ?? o.fecha, plazoPagoDe(o.proveedorId)),
    }))
    .sort((a, b) => (a.vencimiento ?? 0) - (b.vencimiento ?? 0))
}

// Totales y saldo proyectado: lo que entra menos lo que sale en los
// próximos 30 días (incluye lo ya vencido, que también hay que cubrir ya).
export function calcularResumenFinanzas(porCobrar, porPagar, ahora) {
  const totalCobrar = porCobrar.reduce((sum, c) => sum + (c.monto ?? 0), 0)
  const totalPagar = porPagar.reduce((sum, o) => sum + (o.montoTotal ?? 0), 0)
  const limite = ahora + 30 * DIA_MS
  const cobrarPronto = porCobrar
    .filter((c) => c.vencimiento && c.vencimiento <= limite)
    .reduce((sum, c) => sum + (c.monto ?? 0), 0)
  const pagarPronto = porPagar
    .filter((o) => o.vencimiento && o.vencimiento <= limite)
    .reduce((sum, o) => sum + (o.montoTotal ?? 0), 0)
  return { totalCobrar, totalPagar, saldoProyectado30: cobrarPronto - pagarPronto }
}
