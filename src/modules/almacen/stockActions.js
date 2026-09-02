import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore'
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

    tx.update(doc(db, 'ordenesCompra', oc.id), { estado: 'recibida' })
    return avisos
  })

  for (const nombre of bajoMinimo) {
    await crearNotificacion({ mensaje: `${nombre} sigue bajo el mínimo`, tipo: 'warning', link: '/almacen' })
  }
}

export async function registrarMovimientoManual({ materialId, tipo, cantidad }) {
  const aviso = await runTransaction(db, async (tx) => {
    const materialRef = doc(db, 'materiales', materialId)
    const snap = await tx.get(materialRef)
    const data = snap.data() ?? {}
    const delta = tipo === 'entrada' ? cantidad : -cantidad
    const nuevoStock = (data.stock ?? 0) + delta

    tx.update(materialRef, { stock: nuevoStock })
    tx.set(doc(collection(db, 'movimientosAlmacen')), {
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
}
