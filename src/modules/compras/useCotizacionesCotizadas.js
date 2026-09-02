import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'

export function useCotizacionesCotizadas() {
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'cotizaciones'), where('estado', '==', 'Cotizado'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      docs.sort((a, b) => (b.fecha?.toMillis?.() ?? 0) - (a.fecha?.toMillis?.() ?? 0))
      setCotizaciones(docs)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { cotizaciones, loading }
}
