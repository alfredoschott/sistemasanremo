import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

export async function crearNotificacion({ mensaje, tipo = 'info', link = null }) {
  await addDoc(collection(db, 'notificaciones'), {
    mensaje,
    tipo,
    link,
    leida: false,
    fecha: serverTimestamp(),
  })
}
