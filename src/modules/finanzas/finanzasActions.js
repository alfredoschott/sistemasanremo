import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { registrarAuditoria } from '../../lib/audit'
import { db } from '../../lib/firebase'
import { crearNotificacion } from '../../lib/notify'

export async function marcarCobrado(cotizacion) {
  await updateDoc(doc(db, 'cotizaciones', cotizacion.id), {
    cobrado: true,
    fechaCobro: serverTimestamp(),
  })
  await registrarAuditoria({
    entidad: 'cotizacion',
    entidadId: cotizacion.id,
    accion: 'Cobrada',
  })
  await crearNotificacion({
    mensaje: `Cobro recibido de ${cotizacion.cliente}`,
    tipo: 'success',
    link: `/ventas/${cotizacion.id}`,
  })
}

export async function marcarPagado(oc) {
  await updateDoc(doc(db, 'ordenesCompra', oc.id), {
    pagado: true,
    fechaPago: serverTimestamp(),
  })
  await crearNotificacion({
    mensaje: 'Pago a proveedor registrado',
    tipo: 'info',
    link: '/finanzas',
  })
}

export async function deshacerCobrado(cotizacion) {
  await updateDoc(doc(db, 'cotizaciones', cotizacion.id), { cobrado: false, fechaCobro: null })
  await registrarAuditoria({
    entidad: 'cotizacion',
    entidadId: cotizacion.id,
    accion: 'Cobro deshecho',
  })
}

export async function deshacerPagado(oc) {
  await updateDoc(doc(db, 'ordenesCompra', oc.id), { pagado: false, fechaPago: null })
}
