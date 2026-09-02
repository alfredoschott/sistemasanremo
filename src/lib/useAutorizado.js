import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from './firebase'

// Las reglas de Firestore/Storage exigen estar en /usuariosAutorizados.
// Este hook intenta leer el propio documento del usuario: si no está
// autorizado, la lectura se rechaza (permission-denied) — esa es la
// señal para mostrar la pantalla de "sin acceso" en vez de una app rota.
export function useAutorizado(email) {
  const [autorizado, setAutorizado] = useState(null)

  useEffect(() => {
    if (!email) return
    let activo = true
    getDoc(doc(db, 'usuariosAutorizados', email))
      .then((snap) => activo && setAutorizado(snap.exists()))
      .catch(() => activo && setAutorizado(false))
    return () => {
      activo = false
    }
  }, [email])

  return autorizado
}
