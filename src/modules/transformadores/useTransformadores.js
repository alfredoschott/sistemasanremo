import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'

export function useTransformadores() {
  const [transformadores, setTransformadores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'transformadoresTerminados'), orderBy('modelo'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransformadores(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { transformadores, loading }
}
