import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'

export function useProveedores() {
  const [proveedores, setProveedores] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'proveedores'), orderBy('nombre'))
    return onSnapshot(q, (snapshot) => {
      setProveedores(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })
  }, [])

  return proveedores
}
