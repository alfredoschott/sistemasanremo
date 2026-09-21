import { collection, onSnapshot, query, Timestamp, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import { mensajeError } from '../../lib/firestoreErrors'
import { useToast } from '../../lib/ToastContext'

export function useMovimientosHoy() {
  const [count, setCount] = useState(0)
  const toast = useToast()

  useEffect(() => {
    const inicioHoy = new Date()
    inicioHoy.setHours(0, 0, 0, 0)
    const q = query(
      collection(db, 'movimientosAlmacen'),
      where('fecha', '>=', Timestamp.fromDate(inicioHoy)),
    )
    return onSnapshot(
      q,
      (snapshot) => setCount(snapshot.size),
      (err) => toast(mensajeError(err, 'No se pudieron cargar los movimientos de hoy.'), 'error'),
    )
  }, [toast])

  return count
}
