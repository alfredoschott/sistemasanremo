import { doc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { registrarAuditoria } from '../../lib/audit'
import { db } from '../../lib/firebase'
import { crearNotificacion } from '../../lib/notify'

export async function iniciarProduccion(of) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'ordenesFabricacion', of.id), { estado: 'En producción', avance: 0 })
  batch.update(doc(db, 'cotizaciones', of.cotizacionId), { estado: 'Producción' })
  await batch.commit()
  crearNotificacion({
    mensaje: `${of.numeroSerie} entró a producción`,
    tipo: 'info',
    link: `/ventas/${of.cotizacionId}`,
  })
  registrarAuditoria({
    entidad: 'cotizacion',
    entidadId: of.cotizacionId,
    accion: 'En producción',
    detalle: of.numeroSerie,
  })
}

export async function actualizarAvance(ofId, avance) {
  await updateDoc(doc(db, 'ordenesFabricacion', ofId), { avance })
}

export async function completarYFacturar(of) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'ordenesFabricacion', of.id), { estado: 'Completada', avance: 100 })
  batch.update(doc(db, 'cotizaciones', of.cotizacionId), {
    estado: 'Facturado',
    fechaFacturado: serverTimestamp(),
  })
  await batch.commit()
  crearNotificacion({
    mensaje: `${of.numeroSerie} completada y facturada`,
    tipo: 'success',
    link: `/ventas/${of.cotizacionId}`,
  })
  registrarAuditoria({
    entidad: 'cotizacion',
    entidadId: of.cotizacionId,
    accion: 'Completada y facturada',
    detalle: of.numeroSerie,
  })
}
