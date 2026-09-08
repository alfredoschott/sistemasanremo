import { collection, deleteField, doc, getDoc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { registrarAuditoria } from '../../lib/audit'
import { db } from '../../lib/firebase'
import { crearNotificacion } from '../../lib/notify'
import { proveedoresDe } from './proveedoresOF'

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

export async function deshacerIniciarProduccion(of) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'ordenesFabricacion', of.id), { estado: 'Abierta', avance: 0 })
  batch.update(doc(db, 'cotizaciones', of.cotizacionId), { estado: 'OF abierta' })
  await batch.commit()
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

// También se usa como botón persistente para "regresar a producción" una OF
// ya completada (no solo desde el toast inmediato). Si la cotización ya se
// marcó como cobrada en Finanzas, se bloquea: primero hay que deshacer el
// cobro para no dejar cobrado:true en una cotización que ya no está Facturada.
export async function deshacerCompletarYFacturar(of) {
  const cotizacionSnap = await getDoc(doc(db, 'cotizaciones', of.cotizacionId))
  if (cotizacionSnap.exists() && cotizacionSnap.data().cobrado) {
    throw new Error('ya-cobrada')
  }

  const batch = writeBatch(db)
  batch.update(doc(db, 'ordenesFabricacion', of.id), {
    estado: 'En producción',
    avance: of.avance ?? 0,
  })
  batch.update(doc(db, 'cotizaciones', of.cotizacionId), {
    estado: 'Producción',
    fechaFacturado: deleteField(),
  })
  await batch.commit()
}

// Archivar solo oculta la OF completada de la vista principal (para no
// amontonar la lista con pedidos viejos) — el registro y su auditoría
// se conservan, a diferencia de eliminar.
export async function archivarOF(ofId) {
  await updateDoc(doc(db, 'ordenesFabricacion', ofId), {
    archivada: true,
    archivadaEn: serverTimestamp(),
  })
}

export async function desarchivarOF(ofId) {
  await updateDoc(doc(db, 'ordenesFabricacion', ofId), {
    archivada: false,
    archivadaEn: deleteField(),
  })
}

// Eliminar una OF regresa la cotización relacionada a "Cotizado" (y borra
// todo lo que esa OF le había escrito: numeroSerie, facturación, cobro).
// Así se puede corregir una OF abierta por error en cualquier estado sin
// dejar la cotización apuntando a un documento que ya no existe.
export async function eliminarOF(of) {
  const cotizacionRef = doc(db, 'cotizaciones', of.cotizacionId)
  const cotizacionSnap = await getDoc(cotizacionRef)

  const batch = writeBatch(db)
  batch.delete(doc(db, 'ordenesFabricacion', of.id))
  if (cotizacionSnap.exists()) {
    batch.update(cotizacionRef, {
      estado: 'Cotizado',
      ofId: deleteField(),
      numeroSerie: deleteField(),
      fechaFacturado: deleteField(),
      cobrado: deleteField(),
      fechaCobro: deleteField(),
    })
  }
  await batch.commit()
}

// Agrega un proveedor a una OF que ya está abierta (no solo al crearla).
// Si trae materiales, genera su O.C. de una vez — igual que al abrir la OF.
// También migra OF antiguas (con proveedorId/plazoEntregaDias planos) al
// nuevo formato de array la primera vez que se editan.
export async function agregarProveedorAOF(of, proveedor) {
  const batch = writeBatch(db)
  const ofRef = doc(db, 'ordenesFabricacion', of.id)
  batch.update(ofRef, { proveedores: [...proveedoresDe(of), proveedor] })

  if (proveedor.materiales.length > 0) {
    const ocRef = doc(collection(db, 'ordenesCompra'))
    batch.set(ocRef, {
      ofId: of.id,
      proveedorId: proveedor.proveedorId,
      plazoEntregaDias: proveedor.plazoEntregaDias,
      fechaCompromiso: proveedor.fechaCompromiso ?? null,
      montoTotal: null,
      materiales: proveedor.materiales,
      estado: 'pendiente',
      fecha: serverTimestamp(),
    })
  }

  await batch.commit()
}

// Quita un proveedor de la lista de una OF. No borra su O.C. si ya se
// había generado (esa se maneja aparte desde Compras) — solo deja de
// aparecer como proveedor asignado a esta OF.
export async function quitarProveedorDeOF(of, index) {
  const restantes = proveedoresDe(of).filter((_, i) => i !== index)
  await updateDoc(doc(db, 'ordenesFabricacion', of.id), { proveedores: restantes })
}
