import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'
import { db } from './firebase'
import { limpiarNotificacionesViejas } from './notify'
import { useRoles } from './RolesContext'

// Trae más de las que se van a mostrar: al filtrar por área en el cliente
// (la colección es compartida entre todos, ver firestore.rules), alguien
// con una sola área podría quedarse con menos de 30 relevantes si solo se
// piden 30 sin filtrar antes.
const LIMITE_CONSULTA = 60
const LIMITE_MOSTRAR = 30

export function useNotificaciones() {
  const { roles, esAdmin } = useRoles()
  const [notificaciones, setNotificaciones] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'notificaciones'), orderBy('fecha', 'desc'), limit(LIMITE_CONSULTA))
    return onSnapshot(q, (snapshot) => {
      setNotificaciones(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })
  }, [])

  // Borra solas las notificaciones viejas (ver limpiarNotificacionesViejas)
  // cada vez que llega una lista nueva, para que la campana no se acumule
  // para siempre sin que nadie tenga que limpiarla a mano.
  useEffect(() => {
    if (notificaciones.length === 0) return
    limpiarNotificacionesViejas(notificaciones).catch(() => {})
  }, [notificaciones])

  // notif.areas ausente/null = visible para cualquiera autorizado (avisos
  // generales, o notificaciones viejas de antes de que existiera este
  // campo). Un admin siempre ve todo, sin importar `areas`.
  const visibles = useMemo(() => {
    const filtradas = notificaciones.filter(
      (n) => esAdmin || !n.areas || n.areas.some((area) => roles.includes(area)),
    )
    return filtradas.slice(0, LIMITE_MOSTRAR)
  }, [notificaciones, roles, esAdmin])

  const noLeidas = visibles.filter((n) => !n.leida).length

  return { notificaciones: visibles, noLeidas }
}
