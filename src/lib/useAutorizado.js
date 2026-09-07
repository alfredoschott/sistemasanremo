import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from './firebase'

// Las reglas de Firestore exigen estar en /usuariosAutorizados para leer
// cualquier cosa: este es el único documento que un usuario sin acceso
// puede intentar leer sin que la regla lo rechace de entrada. Si no existe,
// la lectura llega vacía (no error) — esa es la señal de "sin acceso".
// onSnapshot (no getDoc) para que un cambio de rol hecho desde el panel de
// Usuarios se refleje al instante, sin recargar la página.
//
// Devuelve:
//   undefined -> todavía cargando
//   null      -> no autorizado (el documento no existe)
//   { roles } -> autorizado, con sus roles asignados (puede ser [])
export function useAutorizado(email) {
  const [datos, setDatos] = useState(undefined)

  useEffect(() => {
    if (!email) return
    return onSnapshot(
      doc(db, 'usuariosAutorizados', email),
      (snap) => setDatos(snap.exists() ? { roles: snap.data().roles ?? [] } : null),
      () => setDatos(null),
    )
  }, [email])

  return datos
}
