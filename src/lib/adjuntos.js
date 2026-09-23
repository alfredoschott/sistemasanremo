import { deleteObject, ref } from 'firebase/storage'
import { storage } from './firebase'

// Borra de Storage los archivos adjuntos de un documento que se va a
// eliminar — si no, se quedan ahí ocupando espacio sin que nada los
// referencie. Best effort: un archivo que ya no existe (o que falla) no
// debe impedir eliminar el documento en sí.
export async function borrarAdjuntos(adjuntos) {
  await Promise.all((adjuntos ?? []).map((a) => deleteObject(ref(storage, a.path)).catch(() => {})))
}
