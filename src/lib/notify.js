import { addDoc, collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from './firebase'

// `areas`: roles a los que le corresponde ver esta notificación (los mismos
// nombres que en /usuariosAutorizados y firestore.rules). Si se omite,
// queda visible para cualquier usuario autorizado — para avisos que no son
// de un área en particular. Un admin siempre ve todo (ver useNotificaciones).
export async function crearNotificacion({ mensaje, tipo = 'info', link = null, areas = null }) {
  await addDoc(collection(db, 'notificaciones'), {
    mensaje,
    tipo,
    link,
    areas,
    leida: false,
    fecha: serverTimestamp(),
  })
}

const DIA_MS = 24 * 60 * 60 * 1000
const DIAS_LEIDA = 7
const DIAS_TOPE = 60

// Corre desde useNotificaciones en cada carga: borra solas las leídas con
// más de DIAS_LEIDA, y cualquier notificación (leída o no) con más de
// DIAS_TOPE — mismo patrón que autoArchivarVencidas en Ventas/Producción/
// Compras, para que la campana no se llene para siempre sin que nadie se
// acuerde de limpiarla.
export async function limpiarNotificacionesViejas(notificaciones) {
  const ahora = Date.now()
  const candidatas = notificaciones.filter((n) => {
    const ms = n.fecha?.toMillis?.()
    if (!ms) return false
    const antiguedadDias = (ahora - ms) / DIA_MS
    return antiguedadDias > DIAS_TOPE || (n.leida && antiguedadDias > DIAS_LEIDA)
  })
  if (candidatas.length === 0) return
  const batch = writeBatch(db)
  candidatas.forEach((n) => batch.delete(doc(db, 'notificaciones', n.id)))
  await batch.commit()
}
