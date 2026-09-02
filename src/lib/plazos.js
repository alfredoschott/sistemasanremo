export function estaVencido(fecha, plazoDias) {
  const ms = fecha?.toMillis?.()
  if (!ms || !plazoDias) return false
  const vencimiento = ms + plazoDias * 24 * 60 * 60 * 1000
  return Date.now() > vencimiento
}
