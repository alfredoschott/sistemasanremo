import { collection, onSnapshot, query, Timestamp, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'

export function useMovimientosHoy() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const inicioHoy = new Date()
    inicioHoy.setHours(0, 0, 0, 0)
    const q = query(
      collection(db, 'movimientosAlmacen'),
      where('fecha', '>=', Timestamp.fromDate(inicioHoy)),
    )
    return onSnapshot(q, (snapshot) => setCount(snapshot.size))
  }, [])

  return count
}
