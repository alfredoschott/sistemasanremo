import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
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
    areas: ['ventas', 'compras'],
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

// Archivar solo oculta la cotización de la lista principal (para no
// amontonar la lista con pedidos viejos ya cerrados) — el registro se
// conserva. También archiva su OF asociada (si tiene), porque si no
// desaparece de Ventas pero se sigue amontonando en Producción.
export async function archivarCotizacion(cotizacion) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'cotizaciones', cotizacion.id), {
    archivada: true,
    archivadaEn: serverTimestamp(),
  })
  const ofSnap = await getDocs(
    query(collection(db, 'ordenesFabricacion'), where('cotizacionId', '==', cotizacion.id)),
  )
  ofSnap.forEach((d) => batch.update(d.ref, { archivada: true, archivadaEn: serverTimestamp() }))
  await batch.commit()
}

export async function desarchivarCotizacion(cotizacion) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'cotizaciones', cotizacion.id), {
    archivada: false,
    archivadaEn: deleteField(),
  })
  const ofSnap = await getDocs(
    query(collection(db, 'ordenesFabricacion'), where('cotizacionId', '==', cotizacion.id)),
  )
  ofSnap.forEach((d) => batch.update(d.ref, { archivada: false, archivadaEn: deleteField() }))
  await batch.commit()
}

const DIA_MS = 24 * 60 * 60 * 1000
const DIAS_AUTO_ARCHIVO = 30

// Corre desde VentasList en cada carga: archiva solas las cotizaciones ya
// cerradas (Facturado/Cancelado) que llevan más de DIAS_AUTO_ARCHIVO sin
// archivarse a mano, para que nadie tenga que acordarse de hacerlo. Las
// activas (Cotizado, OF abierta, Producción) nunca se tocan aquí.
export async function autoArchivarVencidas(cotizaciones) {
  const limite = Date.now() - DIAS_AUTO_ARCHIVO * DIA_MS
  const candidatas = cotizaciones.filter((c) => {
    if (c.archivada || !['Facturado', 'Cancelado'].includes(c.estado)) return false
    const ms = (c.fechaFacturado ?? c.fecha)?.toMillis?.()
    return Boolean(ms) && ms < limite
  })
  await Promise.all(candidatas.map((c) => archivarCotizacion(c)))
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
