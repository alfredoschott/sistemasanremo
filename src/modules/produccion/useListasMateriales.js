import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'

// Lista de materiales (LDM) por modelo de transformador — el estándar de
// qué material y cuánto lleva cada uno, capturado una vez y reutilizado al
// abrir cada OF (ver AbrirOFModal). No confundir con `materialesRequeridos`
// de una OF, que es la copia propia de esa orden (editable sin afectar el
// estándar — ver contexto del proyecto).
export function useListasMateriales() {
  const [listas, setListas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'listasMateriales'), orderBy('modelo', 'asc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setListas(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { listas, loading }
}
