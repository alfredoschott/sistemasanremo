import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'

// Un modelo no puede tener dos listas de materiales a la vez — si no, al
// abrir una OF de ese modelo (ver AbrirOFModal) no habría forma de saber
// cuál usar. Se valida aquí (no solo con una regla de Firestore) para
// poder avisar con un mensaje claro antes de guardar.
async function existeModelo(modelo, idAIgnorar) {
  const snap = await getDocs(query(collection(db, 'listasMateriales'), where('modelo', '==', modelo)))
  return snap.docs.some((d) => d.id !== idAIgnorar)
}

export async function crearListaMateriales({ modelo, materiales, notas }) {
  if (await existeModelo(modelo)) {
    throw new Error('modelo-duplicado')
  }
  await addDoc(collection(db, 'listasMateriales'), { modelo, materiales, notas: notas || '' })
}

export async function actualizarListaMateriales(lista, { modelo, materiales, notas }) {
  if (modelo !== lista.modelo && (await existeModelo(modelo, lista.id))) {
    throw new Error('modelo-duplicado')
  }
  await updateDoc(doc(db, 'listasMateriales', lista.id), { modelo, materiales, notas: notas || '' })
}

export async function eliminarListaMateriales(lista) {
  await deleteDoc(doc(db, 'listasMateriales', lista.id))
}
