import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import { mensajeError } from '../../lib/firestoreErrors'
import { useToast } from '../../lib/ToastContext'

export function useCotizacionesCotizadas() {
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    const q = query(collection(db, 'cotizaciones'), where('estado', '==', 'Cotizado'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        docs.sort((a, b) => (b.fecha?.toMillis?.() ?? 0) - (a.fecha?.toMillis?.() ?? 0))
        setCotizaciones(docs)
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
