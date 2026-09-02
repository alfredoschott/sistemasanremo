import {
  collection,
  deleteField,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { crearNotificacion } from '../../lib/notify'

// Todo lo que suma/resta stock pasa por runTransaction: varias áreas
// (Compras al recibir una O.C., Almacén con ajustes manuales, Producción
// en el futuro) pueden tocar el mismo material al mismo tiempo.

export async function recibirOrdenCompra(oc) {
  const bajoMinimo = await runTransaction(db, async (tx) => {
    const materialRefs = oc.materiales.map((linea) => doc(db, 'materiales', linea.materialId))
    const snaps = await Promise.all(materialRefs.map((ref) => tx.get(ref)))
    const avisos = []

    snaps.forEach((snap, i) => {
      const data = snap.data() ?? {}
      const nuevoStock = (data.stock ?? 0) + oc.materiales[i].cantidad
      tx.update(materialRefs[i], { stock: nuevoStock })
      if (nuevoStock < (data.minimo ?? 0)) avisos.push(data.nombre)
    })

    oc.materiales.forEach((linea) => {
      tx.set(doc(collection(db, 'movimientosAlmacen')), {
        materialId: linea.materialId,
        tipo: 'entrada',
        cantidad: linea.cantidad,
        referencia: { tipo: 'ordenCompra', id: oc.id },
        fecha: serverTimestamp(),
      })
    })

    tx.update(doc(db, 'ordenesCompra', oc.id), {
      estado: 'recibida',
      fechaRecibida: serverTimestamp(),
    })
    return avisos
  })

  for (const nombre of bajoMinimo) {
    await crearNotificacion({ mensaje: `${nombre} sigue bajo el mínimo`, tipo: 'warning', link: '/almacen' })
  }
}

// Revierte una O.C. de "recibida" a "pendiente": resta el stock que se
// había sumado y borra los movimientos que generó esa recepción. Pensado
// tanto para el botón "Deshacer" del toast como para corregir un error de
// captura desde la edición de la O.C.
export async function revertirRecepcion(oc) {
  const movimientosSnap = await getDocs(
    query(
      collection(db, 'movimientosAlmacen'),
      where('referencia.tipo', '==', 'ordenCompra'),
      where('referencia.id', '==', oc.id),
    ),
  )

  await runTransaction(db, async (tx) => {
    const materialRefs = oc.materiales.map((linea) => doc(db, 'materiales', linea.materialId))
    const snaps = await Promise.all(materialRefs.map((ref) => tx.get(ref)))

    snaps.forEach((snap, i) => {
      const stockActual = snap.data()?.stock ?? 0
      tx.update(materialRefs[i], { stock: stockActual - oc.materiales[i].cantidad })
    })

    movimientosSnap.docs.forEach((d) => tx.delete(d.ref))

    tx.update(doc(db, 'ordenesCompra', oc.id), {
      estado: 'pendiente',
      fechaRecibida: deleteField(),
    })
  })
}

export async function registrarMovimientoManual({ materialId, tipo, cantidad }) {
  const movimientoRef = doc(collection(db, 'movimientosAlmacen'))

  const aviso = await runTransaction(db, async (tx) => {
    const materialRef = doc(db, 'materiales', materialId)
    const snap = await tx.get(materialRef)
    const data = snap.data() ?? {}
    const delta = tipo === 'entrada' ? cantidad : -cantidad
    const nuevoStock = (data.stock ?? 0) + delta

    tx.update(materialRef, { stock: nuevoStock })
    tx.set(movimientoRef, {
      materialId,
      tipo,
      cantidad,
      referencia: null,
      fecha: serverTimestamp(),
    })

    return nuevoStock < (data.minimo ?? 0) ? data.nombre : null
  })

  if (aviso) {
    await crearNotificacion({ mensaje: `${aviso} quedó bajo el mínimo`, tipo: 'warning', link: '/almacen' })
  }

  return { movimientoId: movimientoRef.id, materialId, tipo, cantidad }
}

// Deshace un movimiento manual específico (usado por el toast "Deshacer").
export async function revertirMovimientoManual({ movimientoId, materialId, tipo, cantidad }) {
  await runTransaction(db, async (tx) => {
    const materialRef = doc(db, 'materiales', materialId)
    const snap = await tx.get(materialRef)
    const stockActual = snap.data()?.stock ?? 0
    const delta = tipo === 'entrada' ? -cantidad : cantidad

    tx.update(materialRef, { stock: stockActual + delta })
    tx.delete(doc(db, 'movimientosAlmacen', movimientoId))
  })
}
