import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import { mensajeError } from '../../lib/firestoreErrors'
import { useToast } from '../../lib/ToastContext'

export function useOrdenesFabricacion() {
  const [ordenes, setOrdenes] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    const q = query(collection(db, 'ordenesFabricacion'), orderBy('fecha', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setOrdenes(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        setLoading(false)
      },
      (err) => {
        toast(mensajeError(err, 'No se pudieron cargar las órdenes de fabricación.'), 'error')
        setLoading(false)
      },
    )
    return unsubscribe
  }, [toast])

  return { ordenes, loading }
}
