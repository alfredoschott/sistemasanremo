import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'usuariosAutorizados'), orderBy('agregado', 'asc'))
    return onSnapshot(q, (snapshot) => {
      setUsuarios(
        snapshot.docs.map((d) => ({
          email: d.id,
          roles: d.data().roles ?? [],
          rolesSoloLectura: d.data().rolesSoloLectura ?? [],
          etiqueta: d.data().etiqueta ?? '',
        })),
      )
      setLoading(false)
    })
  }, [])

  return { usuarios, loading }
}
