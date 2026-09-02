import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'

export function useCotizacion(id) {
  const [cotizacion, setCotizacion] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const unsubscribe = onSnapshot(doc(db, 'cotizaciones', id), (snap) => {
      setCotizacion(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      setLoading(false)
    })
    return unsubscribe
  }, [id])

  return { cotizacion, loading }
}
