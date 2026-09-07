import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'

export async function agregarUsuario(email) {
  const ref = doc(db, 'usuariosAutorizados', email.trim().toLowerCase())
  const snap = await getDoc(ref)
  if (snap.exists()) throw new Error('ya-existe')
  await setDoc(ref, { roles: [], agregado: serverTimestamp() })
}

export async function actualizarRoles(email, roles) {
  await updateDoc(doc(db, 'usuariosAutorizados', email), { roles })
}

export async function eliminarUsuario(email) {
  await deleteDoc(doc(db, 'usuariosAutorizados', email))
}
