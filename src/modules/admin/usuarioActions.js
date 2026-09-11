import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'

// Esta cuenta nunca puede perder el rol de Admin ni ser eliminada — ni por
// accidente ni por otro admin. Coincide con la regla del mismo nombre en
// firestore.rules (esCuentaProtegida), que es la que de verdad lo impide
// aunque alguien se salte esta pantalla. Aquí solo evita el intento y
// avisa con un mensaje claro en vez de dejar que truene la escritura.
export const CUENTA_PROTEGIDA = 'sistemasanremo@gmail.com'

export async function agregarUsuario(email) {
  const ref = doc(db, 'usuariosAutorizados', email.trim().toLowerCase())
  const snap = await getDoc(ref)
  if (snap.exists()) throw new Error('ya-existe')
  await setDoc(ref, { roles: [], rolesSoloLectura: [], etiqueta: '', agregado: serverTimestamp() })
}

export async function actualizarRoles(email, roles) {
  if (email === CUENTA_PROTEGIDA && !roles.includes('admin')) throw new Error('cuenta-protegida')
  await updateDoc(doc(db, 'usuariosAutorizados', email), { roles })
}

// `rolesSoloLectura` es un subconjunto de `roles`: marca cuáles de sus
// áreas asignadas son de solo ver (no puede crear/editar/borrar nada ahí).
// "admin" nunca entra aquí — ver UsuariosPage, esa columna es aparte.
export async function actualizarRolesSoloLectura(email, rolesSoloLectura) {
  await updateDoc(doc(db, 'usuariosAutorizados', email), { rolesSoloLectura })
}

export async function actualizarEtiqueta(email, etiqueta) {
  await updateDoc(doc(db, 'usuariosAutorizados', email), { etiqueta: etiqueta.trim() })
}

export async function eliminarUsuario(email) {
  if (email === CUENTA_PROTEGIDA) throw new Error('cuenta-protegida')
  await deleteDoc(doc(db, 'usuariosAutorizados', email))
}
