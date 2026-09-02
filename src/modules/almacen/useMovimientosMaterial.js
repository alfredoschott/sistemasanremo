import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'

export function useMovimientosMaterial(materialId) {
  const [movimientos, setMovimientos] = useState([])

  useEffect(() => {
    if (!materialId) return
    const q = query(collection(db, 'movimientosAlmacen'), where('materialId', '==', materialId))
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      docs.sort((a, b) => (b.fecha?.toMillis?.() ?? 0) - (a.fecha?.toMillis?.() ?? 0))
      setMovimientos(docs)
    })
  }, [materialId])

  return movimientos
}
