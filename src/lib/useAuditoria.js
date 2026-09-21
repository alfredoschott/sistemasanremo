import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from './firebase'
import { mensajeError } from './firestoreErrors'
import { useToast } from './ToastContext'

const TANDA = 50

// Igual que useMovimientosMaterial: trae lo más reciente primero, con
// `limite` creciendo de a TANDA (ver `cargarMas`) en vez de traer toda la
// bitácora de una cotización con años de historial.
export function useAuditoria(entidadId) {
  const [eventos, setEventos] = useState([])
  const [limite, setLimite] = useState(TANDA)
  const [hayMas, setHayMas] = useState(false)
  const [entidadPrevia, setEntidadPrevia] = useState(entidadId)
  const toast = useToast()

  // Reinicia la cantidad a mostrar al cambiar de entidad — ajustado durante
  // el render (no en un efecto aparte) para que no haya un frame de más con
  // el límite viejo antes de que el efecto de abajo alcance a correr.
  if (entidadId !== entidadPrevia) {
    setEntidadPrevia(entidadId)
    setLimite(TANDA)
  }

  useEffect(() => {
    if (!entidadId) return
    const q = query(
      collection(db, 'auditoria'),
      where('entidadId', '==', entidadId),
      orderBy('fecha', 'desc'),
      limit(limite),
    )
    return onSnapshot(
      q,
      (snapshot) => {
        setEventos(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        setHayMas(snapshot.size === limite)
      },
      (err) => toast(mensajeError(err, 'No se pudo cargar el historial.'), 'error'),
    )
  }, [entidadId, limite, toast])

  const cargarMas = () => setLimite((l) => l + TANDA)

  return { eventos, hayMas, cargarMas }
}
