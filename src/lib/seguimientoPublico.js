import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase'

// Copia mínima y pública de una cotización (mismo id que el documento real
// en `cotizaciones`), para que el cliente vea su estatus sin necesitar
// cuenta — ver src/modules/seguimiento/SeguimientoPage.jsx. Las reglas de
// Firestore permiten lectura sin auth SOLO en esta colección, y solo con
// estos campos (cliente, estado, avance, entregaSemanas) — nunca montos,
// materiales ni nada del resto del sistema.
//
// Es "best effort" a propósito (el .catch se traga el error): si esto
// falla, el flujo de negocio real (la cotización/OF en sí) ya se guardó
// bien — no vale la pena tronar la acción principal del usuario porque el
// espejo público no se pudo escribir.
export function actualizarSeguimiento(cotizacionId, data) {
  return setDoc(
    doc(db, 'seguimientoPublico', cotizacionId),
    { ...data, actualizado: serverTimestamp() },
    { merge: true },
  ).catch(() => {})
}

export function eliminarSeguimiento(cotizacionId) {
  return deleteDoc(doc(db, 'seguimientoPublico', cotizacionId)).catch(() => {})
}
