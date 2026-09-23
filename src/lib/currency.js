// `currencyDisplay: 'code'` a propósito en vez del símbolo `$` por defecto:
// "$527,000" se puede confundir con USD (sobre todo en algo exportado o
// impreso); "MXN 527,000" no deja lugar a dudas. Un solo formateador
// compartido para que ese criterio no se repita (ni se olvide) en cada
// módulo que muestra montos.
export const currency = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  currencyDisplay: 'code',
})

// Etiqueta mínima para encima de una barra de gráfica ("618k", "1.2M"),
// donde el ancho no alcanza para "MXN 618,000" y el título de la gráfica
// ya dice de qué moneda se trata.
export function montoCorto(n) {
  const abs = Math.abs(n)
  const signo = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${signo}${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (abs >= 1_000) return `${signo}${Math.round(abs / 1_000)}k`
  return `${signo}${Math.round(abs)}`
}

// Sin centavos: para tarjetas de resumen angostas (dashboard, gráficas)
// donde el detalle exacto ya está un clic más adentro, en la página del
// módulo correspondiente.
export const currencyCompact = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  currencyDisplay: 'code',
  maximumFractionDigits: 0,
})
