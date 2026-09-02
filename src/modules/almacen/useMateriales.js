import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'

export function useMateriales() {
  const [materiales, setMateriales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'materiales'), orderBy('nombre'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMateriales(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { materiales, loading }
}
