import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
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
