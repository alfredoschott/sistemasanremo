import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import { mensajeError } from '../../lib/firestoreErrors'
import { useToast } from '../../lib/ToastContext'

// `enabled: false` evita suscribirse (y pagar las lecturas) cuando quien lo usa
// no necesita los datos todavía o el rol del usuario no los puede leer.
export function useCotizaciones({ enabled = true } = {}) {
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    if (!enabled) return
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
  }, [toast, enabled])

  return { cotizaciones, loading }
}
