import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import { mensajeError } from '../../lib/firestoreErrors'
import { useToast } from '../../lib/ToastContext'

export function useTransformadores() {
  const [transformadores, setTransformadores] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    const q = query(collection(db, 'transformadoresTerminados'), orderBy('modelo'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setTransformadores(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        setLoading(false)
      },
      (err) => {
        toast(mensajeError(err, 'No se pudieron cargar los transformadores.'), 'error')
        setLoading(false)
      },
    )
    return unsubscribe
  }, [toast])

  return { transformadores, loading }
}
