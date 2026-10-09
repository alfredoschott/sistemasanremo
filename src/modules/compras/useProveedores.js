import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import { mensajeError } from '../../lib/firestoreErrors'
import { useToast } from '../../lib/ToastContext'

// `enabled: false` evita suscribirse (y pagar las lecturas) cuando quien lo usa
// no necesita los datos todavía o el rol del usuario no los puede leer.
export function useProveedores({ enabled = true } = {}) {
  const [proveedores, setProveedores] = useState([])
  const toast = useToast()

  useEffect(() => {
    if (!enabled) return
    const q = query(collection(db, 'proveedores'), orderBy('nombre'))
    return onSnapshot(
      q,
      (snapshot) => {
        setProveedores(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      },
      (err) => toast(mensajeError(err, 'No se pudieron cargar los proveedores.'), 'error'),
    )
  }, [toast, enabled])

  return proveedores
}
