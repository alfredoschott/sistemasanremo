import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import { mensajeError } from '../../lib/firestoreErrors'
import { useToast } from '../../lib/ToastContext'

const TANDA = 50

// Trae el historial más reciente primero, con `limite` creciendo de a
// TANDA en TANDA (ver `cargarMas`) en vez de traer siempre toda la
// colección — un material que se mueve seguido durante años no debería
// bajar años de movimientos solo para abrir su historial.
export function useMovimientosMaterial(materialId) {
  const [movimientos, setMovimientos] = useState([])
  const [limite, setLimite] = useState(TANDA)
  const [hayMas, setHayMas] = useState(false)
  const [materialPrevio, setMaterialPrevio] = useState(materialId)
  const toast = useToast()

  // Reinicia la cantidad a mostrar al cambiar de material — ajustado
  // durante el render (no en un efecto aparte) para que no haya un frame de
  // más con el límite viejo antes de que el efecto de abajo alcance a correr.
  if (materialId !== materialPrevio) {
    setMaterialPrevio(materialId)
    setLimite(TANDA)
  }

  useEffect(() => {
    if (!materialId) return
    const q = query(
      collection(db, 'movimientosAlmacen'),
      where('materialId', '==', materialId),
      orderBy('fecha', 'desc'),
      limit(limite),
    )
    return onSnapshot(
      q,
      (snapshot) => {
        setMovimientos(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        setHayMas(snapshot.size === limite)
      },
      (err) => toast(mensajeError(err, 'No se pudo cargar el historial del material.'), 'error'),
    )
  }, [materialId, limite, toast])

  const cargarMas = () => setLimite((l) => l + TANDA)

  return { movimientos, hayMas, cargarMas }
}
