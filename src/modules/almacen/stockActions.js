import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'

// Todo lo que suma/resta stock pasa por runTransaction: varias áreas
// (Compras al recibir una O.C., Almacén con ajustes manuales, Producción
// en el futuro) pueden tocar el mismo material al mismo tiempo.

export async function recibirOrdenCompra(oc) {
  await runTransaction(db, async (tx) => {
    const materialRefs = oc.materiales.map((linea) => doc(db, 'materiales', linea.materialId))
    const snaps = await Promise.all(materialRefs.map((ref) => tx.get(ref)))

    snaps.forEach((snap, i) => {
      const stockActual = snap.data()?.stock ?? 0
      tx.update(materialRefs[i], { stock: stockActual + oc.materiales[i].cantidad })
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
  })
}

export async function registrarMovimientoManual({ materialId, tipo, cantidad }) {
  await runTransaction(db, async (tx) => {
    const materialRef = doc(db, 'materiales', materialId)
    const snap = await tx.get(materialRef)
    const stockActual = snap.data()?.stock ?? 0
    const delta = tipo === 'entrada' ? cantidad : -cantidad

    tx.update(materialRef, { stock: stockActual + delta })
    tx.set(doc(collection(db, 'movimientosAlmacen')), {
      materialId,
      tipo,
      cantidad,
      referencia: null,
      fecha: serverTimestamp(),
    })
  })
}
