import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from './firebase'

export function useNotas(entidadId) {
  const [notas, setNotas] = useState([])

  useEffect(() => {
    if (!entidadId) return
    const q = query(collection(db, 'notas'), where('entidadId', '==', entidadId))
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      docs.sort((a, b) => (a.fecha?.toMillis?.() ?? 0) - (b.fecha?.toMillis?.() ?? 0))
      setNotas(docs)
    })
  }, [entidadId])

  return notas
}
