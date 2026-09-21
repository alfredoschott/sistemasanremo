import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import { mensajeError } from '../../lib/firestoreErrors'
import { useToast } from '../../lib/ToastContext'

export function useCotizacion(id) {
  const [cotizacion, setCotizacion] = useState(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    if (!id) return
    const unsubscribe = onSnapshot(
      doc(db, 'cotizaciones', id),
      (snap) => {
        setCotizacion(snap.exists() ? { id: snap.id, ...snap.data() } : null)
        setLoading(false)
      },
      (err) => {
        toast(mensajeError(err, 'No se pudo cargar la cotización.'), 'error')
        setLoading(false)
      },
    )
    return unsubscribe
  }, [id, toast])

  return { cotizacion, loading }
}
