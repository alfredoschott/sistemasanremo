import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { registrarAuditoria } from '../../lib/audit'
import { db } from '../../lib/firebase'
import { crearNotificacion } from '../../lib/notify'

export async function cancelarCotizacion(cotizacion) {
  await updateDoc(doc(db, 'cotizaciones', cotizacion.id), { estado: 'Cancelado' })
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

export async function duplicarCotizacion(cotizacion) {
  const ref = await addDoc(collection(db, 'cotizaciones'), {
    cliente: cotizacion.cliente,
    monto: cotizacion.monto,
    condicionPago: cotizacion.condicionPago,
    porcentajeAnticipo: cotizacion.porcentajeAnticipo ?? null,
    entregaSemanas: cotizacion.entregaSemanas,
    estado: 'Cotizado',
    fecha: serverTimestamp(),
  })
  await registrarAuditoria({
    entidad: 'cotizacion',
    entidadId: ref.id,
    accion: 'Creada',
    detalle: `Duplicada de la cotización anterior de ${cotizacion.cliente}`,
  })
  return ref.id
}
