import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

export async function registrarAuditoria({ entidad, entidadId, accion, detalle = '' }) {
  await addDoc(collection(db, 'auditoria'), {
    entidad,
    entidadId,
    accion,
    detalle,
    usuario: auth.currentUser?.email ?? 'desconocido',
    fecha: serverTimestamp(),
  })
}
