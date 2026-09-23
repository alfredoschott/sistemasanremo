// Fecha estimada de entrega = día en que se abre la OF (el pedido ya está
// confirmado) + las semanas comprometidas en la cotización. Se guarda como
// "AAAA-MM-DD" (no Timestamp) para que el día no se corra por zona horaria
// y para que el espejo público la pueda leer tal cual.
export function calcularFechaEntrega(desdeMs, semanas) {
  const n = Number(semanas)
  if (!desdeMs || !Number.isFinite(n) || n <= 0) return null
  const d = new Date(desdeMs)
  d.setDate(d.getDate() + n * 7)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

// "21 oct 2026" — mediodía para que ninguna zona horaria cambie el día.
export function formatoFechaEntrega(iso) {
  if (!iso) return null
  const ms = new Date(`${iso}T12:00:00`).getTime()
  if (Number.isNaN(ms)) return null
  return new Date(ms).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}
