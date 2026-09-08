import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { registrarAuditoria } from '../../lib/audit'
import { db } from '../../lib/firebase'
import { crearNotificacion } from '../../lib/notify'
import { actualizarSeguimiento, eliminarSeguimiento } from '../../lib/seguimientoPublico'

export async function cancelarCotizacion(cotizacion) {
  await updateDoc(doc(db, 'cotizaciones', cotizacion.id), { estado: 'Cancelado' })
  actualizarSeguimiento(cotizacion.id, { estado: 'Cancelado' })
  await registrarAuditoria({
    entidad: 'cotizacion',
    entidadId: cotizacion.id,
    accion: 'Cancelada',
  })
  await crearNotificacion({
    mensaje: `Cotización de ${cotizacion.cliente} cancelada`,
    tipo: 'warning',
    link: `/ventas/${cotizacion.id}`,
  })
}

export async function deshacerCancelacion(cotizacion) {
  await updateDoc(doc(db, 'cotizaciones', cotizacion.id), { estado: cotizacion.estado })
  actualizarSeguimiento(cotizacion.id, { estado: cotizacion.estado })
  await registrarAuditoria({
    entidad: 'cotizacion',
    entidadId: cotizacion.id,
    accion: 'Cancelación deshecha',
  })
}

// Solo se puede eliminar una cotización que no tiene una OF abierta detrás
// (estado 'Cotizado' o 'Cancelado' — ver puedeEliminar en VentasDetalle),
// así nunca deja una OF huérfana apuntando a una cotización inexistente.
export async function eliminarCotizacion(cotizacion) {
  const notasSnap = await getDocs(
    query(collection(db, 'notas'), where('entidad', '==', 'cotizacion'), where('entidadId', '==', cotizacion.id)),
  )
  await Promise.all(notasSnap.docs.map((d) => deleteDoc(d.ref)))
  await deleteDoc(doc(db, 'cotizaciones', cotizacion.id))
  eliminarSeguimiento(cotizacion.id)
}

export async function duplicarCotizacion(cotizacion) {
  const ref = await addDoc(collection(db, 'cotizaciones'), {
    cliente: cotizacion.cliente,
    monto: cotizacion.monto,
    items: cotizacion.items ?? [],
    condicionPago: cotizacion.condicionPago,
    porcentajeAnticipo: cotizacion.porcentajeAnticipo ?? null,
    entregaSemanas: cotizacion.entregaSemanas,
    estado: 'Cotizado',
    fecha: serverTimestamp(),
  })
  actualizarSeguimiento(ref.id, {
    cliente: cotizacion.cliente,
    estado: 'Cotizado',
    entregaSemanas: cotizacion.entregaSemanas,
  })
  await registrarAuditoria({
    entidad: 'cotizacion',
    entidadId: ref.id,
    accion: 'Creada',
    detalle: `Duplicada de la cotización anterior de ${cotizacion.cliente}`,
  })
  return ref.id
}
