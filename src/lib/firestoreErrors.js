// Mensaje a mostrar cuando Firestore rechaza una escritura por falta de
// permiso — sobre todo por el modo "solo lectura" por área (ver
// firestore.rules: puedeEscribir) o por tocar la cuenta protegida en
// usuariosAutorizados. `mensajeError` se usa en los `catch` de las
// acciones para no mostrar el genérico "No se pudo..." cuando en realidad
// es esto y no un error de red/servidor.
const MENSAJE_SOLO_LECTURA = 'No tienes permiso para modificar esto — tu acceso aquí es de solo lectura.'

export function mensajeError(err, generico) {
  return err?.code === 'permission-denied' ? MENSAJE_SOLO_LECTURA : generico
}
