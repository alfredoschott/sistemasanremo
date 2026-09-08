// Fecha límite de entrega: si el proveedor ya se comprometió a una fecha
// exacta (fechaCompromiso, tipo "2026-09-20"), esa manda sobre el cálculo
// genérico de "plazoDias después de creada la orden".
export function fechaVencimiento(fechaCreacion, plazoDias, fechaCompromiso) {
  if (fechaCompromiso) {
    const ms = new Date(`${fechaCompromiso}T23:59:59`).getTime()
    return Number.isNaN(ms) ? null : ms
  }
  const creado = fechaCreacion?.toMillis?.()
  if (!creado || !plazoDias) return null
  return creado + plazoDias * 24 * 60 * 60 * 1000
}

export function estaVencido(fechaCreacion, plazoDias, fechaCompromiso) {
  const limite = fechaVencimiento(fechaCreacion, plazoDias, fechaCompromiso)
  return limite ? Date.now() > limite : false
}
