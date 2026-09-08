// Enlace universal de Google Maps (sin API key): funciona igual en
// navegador de escritorio, Safari/iOS y Chrome/Android, y abre la app
// nativa de Maps cuando está instalada.
export function googleMapsUrl(direccion) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`
}
