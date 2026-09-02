import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from './firebase'

export function useAuditoria(entidadId) {
  const [eventos, setEventos] = useState([])

  useEffect(() => {
    if (!entidadId) return
    const q = query(collection(db, 'auditoria'), where('entidadId', '==', entidadId))
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      docs.sort((a, b) => (b.fecha?.toMillis?.() ?? 0) - (a.fecha?.toMillis?.() ?? 0))
      setEventos(docs)
    })
  }, [entidadId])

  return eventos
}
