// Agrupa listas con fecha (Timestamp de Firestore) por mes calendario —
// usado en Finanzas (vencimientos) y Almacén (historial de movimientos)
// para no mostrar todo en una sola lista larga.
export function claveMes(ms) {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function nombreMes(ms) {
  const label = new Date(ms).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}
