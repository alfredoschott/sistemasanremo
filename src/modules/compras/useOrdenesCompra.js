import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'

export function useOrdenesCompra() {
  const [ordenes, setOrdenes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'ordenesCompra'), orderBy('fecha', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrdenes(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { ordenes, loading }
}
