// "Guardar como PDF" del navegador usa document.title como nombre de
// archivo sugerido — sin esto, el PDF se descarga con el título genérico
// de la pestaña en vez de algo reconocible como "OC Proveedor X.pdf".
export function imprimirComoPdf(nombreArchivo) {
  const original = document.title
  document.title = nombreArchivo.replace(/\s+/g, ' ').trim()
  const restaurar = () => {
    document.title = original
    window.removeEventListener('afterprint', restaurar)
  }
  window.addEventListener('afterprint', restaurar)
  window.print()
}

export function formatoFechaLarga(fecha) {
  const ms = fecha?.toMillis?.()
  if (!ms) return ''
  return new Date(ms).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

// El id de Firestore es ilegible como folio impreso — un prefijo +
// primeros caracteres en mayúsculas es más corto y presentable.
export function folioCorto(prefijo, id) {
  return `${prefijo}-${id.slice(0, 8).toUpperCase()}`
}
