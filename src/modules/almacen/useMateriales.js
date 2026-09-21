import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import { mensajeError } from '../../lib/firestoreErrors'
import { useToast } from '../../lib/ToastContext'

export function useMateriales() {
  const [materiales, setMateriales] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    const q = query(collection(db, 'materiales'), orderBy('nombre'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setMateriales(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        setLoading(false)
      },
      (err) => {
        toast(mensajeError(err, 'No se pudieron cargar los materiales.'), 'error')
        setLoading(false)
      },
    )
    return unsubscribe
  }, [toast])

  return { materiales, loading }
}
