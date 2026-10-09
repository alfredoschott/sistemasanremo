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
//   null      -> no autorizado (el servidor confirma que el documento no existe)
//   { roles } -> autorizado, con sus roles asignados (puede ser [])
export function useAutorizado(email) {
  const [datos, setDatos] = useState(undefined)

  useEffect(() => {
    if (!email) return
    let reintentado = false
    let timer
    let unsub = () => {}

    const suscribir = () => {
      unsub = onSnapshot(
        doc(db, 'usuariosAutorizados', email),
        (snap) => {
          // Un "no existe" que viene solo de la caché local (sin haber
          // preguntado al servidor) no prueba nada: pasa justo después de
          // iniciar sesión en un navegador sin datos guardados. Se espera
          // la respuesta real antes de mostrar "Sin acceso".
          if (!snap.exists() && snap.metadata.fromCache) return
          setDatos(snap.exists() ? { roles: snap.data().roles ?? [] } : null)
        },
        (err) => {
          console.error('useAutorizado:', err)
          // Un error pasajero (token que aún no llega, red) no debe
          // expulsar a alguien autorizado: se reintenta una vez antes de rendirse.
          if (!reintentado) {
            reintentado = true
            unsub()
            timer = setTimeout(suscribir, 1500)
          } else {
            setDatos(null)
          }
        },
      )
    }

    suscribir()
    return () => {
      clearTimeout(timer)
      unsub()
    }
  }, [email])

  return datos
}
