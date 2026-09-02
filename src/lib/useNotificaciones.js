import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from './firebase'

export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'notificaciones'), orderBy('fecha', 'desc'), limit(30))
    return onSnapshot(q, (snapshot) => {
      setNotificaciones(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })
  }, [])

  const noLeidas = notificaciones.filter((n) => !n.leida).length

  return { notificaciones, noLeidas }
}
