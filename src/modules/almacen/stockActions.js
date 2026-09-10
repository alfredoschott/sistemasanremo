import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
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
    await crearNotificacion({
      mensaje: `${nombre} sigue bajo el mínimo`,
      tipo: 'warning',
      link: '/almacen',
      areas: ['almacen', 'compras'],
    })
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

    // Se valida aquí (dentro de la transacción) y no solo en el formulario,
    // porque dos salidas simultáneas del mismo material podrían pasar ambas
    // la validación del cliente y dejar el stock en negativo.
    if (nuevoStock < 0) {
      throw new Error('stock-insuficiente')
    }

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
    await crearNotificacion({
      mensaje: `${aviso} quedó bajo el mínimo`,
      tipo: 'warning',
      link: '/almacen',
      areas: ['almacen', 'compras'],
    })
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

// Borra un material solo si nunca se ha usado: ni en ninguna O.C. (pendiente
// o ya recibida) ni en ningún movimiento de almacén. Si se permitiera borrar
// un material con historial, esas O.C./movimientos quedarían con un
// materialId que ya no resuelve a nada. Devuelve los datos borrados para
// poder restaurarlo desde el "Deshacer" del toast.
export async function eliminarMaterial(material) {
  const [ordenesSnap, movimientosSnap] = await Promise.all([
    getDocs(collection(db, 'ordenesCompra')),
    getDocs(query(collection(db, 'movimientosAlmacen'), where('materialId', '==', material.id))),
  ])
  const enUso =
    !movimientosSnap.empty ||
    ordenesSnap.docs.some((d) =>
      (d.data().materiales ?? []).some((linea) => linea.materialId === material.id),
    )
  if (enUso) {
    throw new Error('material-en-uso')
  }

  const materialRef = doc(db, 'materiales', material.id)
  const snap = await getDoc(materialRef)
  const data = snap.data()
  await deleteDoc(materialRef)
  return data
}

// Restaura un material eliminado (usado por el toast "Deshacer"), con el
// mismo id para que las O.C./movimientos históricos que lo referencian
// vuelvan a resolverse.
export async function restaurarMaterial(materialId, data) {
  if (!data) return
  await setDoc(doc(db, 'materiales', materialId), data)
}

// Registra que Producción sacó material del almacén para una OF —
// consumo parcial, no toda la lista de materiales de un jalón. Descuenta
// stock real (sigue sin permitir negativo: es una restricción física, no
// de planeación) y suma `cantidadConsumida` en la línea correspondiente de
// `materialesRequeridos` de esa OF, para llevar el acumulado.
//
// Si el acumulado ya supera lo planeado, no se bloquea — el usuario ya
// decidió seguir y capturó un motivo (ver MaterialesOFModal) — pero sí
// queda guardado en el movimiento para no perder el rastro de por qué se
// usó más de lo previsto.
export async function registrarConsumoMaterial({ of, materialId, cantidad, motivoExceso }) {
  const movimientoRef = doc(collection(db, 'movimientosAlmacen'))

  const aviso = await runTransaction(db, async (tx) => {
    const materialRef = doc(db, 'materiales', materialId)
    const ofRef = doc(db, 'ordenesFabricacion', of.id)
    const [materialSnap, ofSnap] = await Promise.all([tx.get(materialRef), tx.get(ofRef)])

    const data = materialSnap.data() ?? {}
    const nuevoStock = (data.stock ?? 0) - cantidad
    if (nuevoStock < 0) {
      throw new Error('stock-insuficiente')
    }

    const requeridos = ofSnap.data()?.materialesRequeridos ?? []
    const nuevosRequeridos = requeridos.map((linea) =>
      linea.materialId === materialId
        ? { ...linea, cantidadConsumida: (linea.cantidadConsumida ?? 0) + cantidad }
        : linea,
    )

    tx.update(materialRef, { stock: nuevoStock })
    tx.update(ofRef, { materialesRequeridos: nuevosRequeridos })
    tx.set(movimientoRef, {
      materialId,
      tipo: 'salida',
      cantidad,
      referencia: { tipo: 'produccion', id: of.id },
      motivoExceso: motivoExceso || null,
      fecha: serverTimestamp(),
    })

    return nuevoStock < (data.minimo ?? 0) ? data.nombre : null
  })

  if (aviso) {
    await crearNotificacion({
      mensaje: `${aviso} quedó bajo el mínimo`,
      tipo: 'warning',
      link: '/almacen',
      areas: ['almacen', 'compras'],
    })
  }

  return { movimientoId: movimientoRef.id }
}

// Deshace un consumo específico (usado por el toast "Deshacer"): regresa
// el stock y resta lo consumido de la línea de la OF.
export async function revertirConsumoMaterial({ movimientoId, of, materialId, cantidad }) {
  await runTransaction(db, async (tx) => {
    const materialRef = doc(db, 'materiales', materialId)
    const ofRef = doc(db, 'ordenesFabricacion', of.id)
    const [materialSnap, ofSnap] = await Promise.all([tx.get(materialRef), tx.get(ofRef)])

    const stockActual = materialSnap.data()?.stock ?? 0
    const requeridos = ofSnap.data()?.materialesRequeridos ?? []
    const nuevosRequeridos = requeridos.map((linea) =>
      linea.materialId === materialId
        ? { ...linea, cantidadConsumida: Math.max(0, (linea.cantidadConsumida ?? 0) - cantidad) }
        : linea,
    )

    tx.update(materialRef, { stock: stockActual + cantidad })
    tx.update(ofRef, { materialesRequeridos: nuevosRequeridos })
    tx.delete(doc(db, 'movimientosAlmacen', movimientoId))
  })
}
