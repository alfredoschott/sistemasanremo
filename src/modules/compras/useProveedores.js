import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import { mensajeError } from '../../lib/firestoreErrors'
import { useToast } from '../../lib/ToastContext'

export function useProveedores() {
  const [proveedores, setProveedores] = useState([])
  const toast = useToast()

  useEffect(() => {
    const q = query(collection(db, 'proveedores'), orderBy('nombre'))
    return onSnapshot(
      q,
      (snapshot) => {
        setProveedores(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      },
      (err) => toast(mensajeError(err, 'No se pudieron cargar los proveedores.'), 'error'),
    )
  }, [toast])

  return proveedores
}
