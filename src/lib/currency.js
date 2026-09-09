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

// Sin centavos: para tarjetas de resumen angostas (dashboard, gráficas)
// donde el detalle exacto ya está un clic más adentro, en la página del
// módulo correspondiente.
export const currencyCompact = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  currencyDisplay: 'code',
  maximumFractionDigits: 0,
})
