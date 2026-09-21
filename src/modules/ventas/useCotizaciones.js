import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import { mensajeError } from '../../lib/firestoreErrors'
import { useToast } from '../../lib/ToastContext'

export function useCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    const q = query(collection(db, 'cotizaciones'), orderBy('fecha', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setCotizaciones(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        setLoading(false)
      },
      (err) => {
        toast(mensajeError(err, 'No se pudieron cargar las cotizaciones.'), 'error')
        setLoading(false)
      },
    )
    return unsubscribe
  }, [toast])

  return { cotizaciones, loading }
}
