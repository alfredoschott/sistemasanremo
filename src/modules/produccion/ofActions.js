import {
  collection,
  deleteField,
  doc,
  getDoc,
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
import { actualizarSeguimiento } from '../../lib/seguimientoPublico'
import { proveedoresDe } from './proveedoresOF'

export async function iniciarProduccion(of) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'ordenesFabricacion', of.id), { estado: 'En producción', avance: 0 })
  batch.update(doc(db, 'cotizaciones', of.cotizacionId), { estado: 'Producción' })
  await batch.commit()
  actualizarSeguimiento(of.cotizacionId, { estado: 'Producción', avance: 0 })
  crearNotificacion({
    mensaje: `${of.numeroSerie} entró a producción`,
    tipo: 'info',
    link: `/ventas/${of.cotizacionId}`,
    areas: ['produccion', 'ventas'],
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
  actualizarSeguimiento(of.cotizacionId, { estado: 'OF abierta', avance: 0 })
}

export async function actualizarAvance(of, avance) {
  await updateDoc(doc(db, 'ordenesFabricacion', of.id), { avance })
  actualizarSeguimiento(of.cotizacionId, { avance })
}

// Al facturar, los transformadores de la cotización pasan solos al
// inventario de "Transformadores terminados" (antes había que agregarlos
// ahí a mano aparte, y casi nadie se acordaba — el inventario terminaba
// desactualizado). Quedan con capacidad/voltaje/ubicación/destino vacíos:
// esos datos logísticos se llenan después, cuando se sepa a dónde va cada
// unidad.
async function agregarTransformadoresTerminados(batch, of, cotizacionId) {
  const cotizacionSnap = await getDoc(doc(db, 'cotizaciones', cotizacionId))
  const items = cotizacionSnap.data()?.items ?? []
  for (const item of items) {
    if (!item.modelo) continue
    const ref = doc(collection(db, 'transformadoresTerminados'))
    batch.set(ref, {
      modelo: item.modelo,
      cantidad: item.cantidad ?? 1,
      capacidadKva: null,
      voltaje: '',
      ubicacion: '',
      destino: '',
      notas: `De ${of.numeroSerie ?? ''} — ${of.cliente ?? ''}`.trim(),
      ofId: of.id,
      fecha: serverTimestamp(),
    })
  }
}

async function quitarTransformadoresTerminadosDeOF(ofId) {
  const snap = await getDocs(query(collection(db, 'transformadoresTerminados'), where('ofId', '==', ofId)))
  if (snap.empty) return
  const batch = writeBatch(db)
  snap.forEach((d) => batch.delete(d.ref))
  await batch.commit()
}

export async function completarYFacturar(of) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'ordenesFabricacion', of.id), { estado: 'Completada', avance: 100 })
  batch.update(doc(db, 'cotizaciones', of.cotizacionId), {
    estado: 'Facturado',
    fechaFacturado: serverTimestamp(),
  })
  await agregarTransformadoresTerminados(batch, of, of.cotizacionId)
  await batch.commit()
  actualizarSeguimiento(of.cotizacionId, { estado: 'Facturado', avance: 100 })
  crearNotificacion({
    mensaje: `${of.numeroSerie} completada y facturada`,
    tipo: 'success',
    link: `/ventas/${of.cotizacionId}`,
    areas: ['produccion', 'ventas', 'finanzas'],
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
  await quitarTransformadoresTerminadosDeOF(of.id)
  actualizarSeguimiento(of.cotizacionId, { estado: 'Producción', avance: of.avance ?? 0 })
}

// Archivar solo oculta la OF completada de la vista principal (para no
// amontonar la lista con pedidos viejos) — el registro y su auditoría
// se conservan, a diferencia de eliminar. También archiva la cotización
// asociada, así no se queda amontonando la lista de Ventas por separado.
export async function archivarOF(of) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'ordenesFabricacion', of.id), {
    archivada: true,
    archivadaEn: serverTimestamp(),
  })
  if (of.cotizacionId) {
    batch.update(doc(db, 'cotizaciones', of.cotizacionId), {
      archivada: true,
      archivadaEn: serverTimestamp(),
    })
  }
  await batch.commit()
}

export async function desarchivarOF(of) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'ordenesFabricacion', of.id), {
    archivada: false,
    archivadaEn: deleteField(),
  })
  if (of.cotizacionId) {
    batch.update(doc(db, 'cotizaciones', of.cotizacionId), {
      archivada: false,
      archivadaEn: deleteField(),
    })
  }
  await batch.commit()
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
  await quitarTransformadoresTerminadosDeOF(of.id)
  actualizarSeguimiento(of.cotizacionId, { estado: 'Cotizado', avance: 0 })
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

// Agrega una línea de material a la OF que no venía en el cálculo
// automático (ver materialesRequeridos.js) — el pedido puede llevar algo
// distinto a la lista de materiales estándar del modelo. Arranca en 0
// consumido; el consumo real se registra aparte, vía
// stockActions.registrarConsumoMaterial (ese sí toca stock real).
export async function agregarMaterialAOF(of, materialId, cantidadPlan) {
  const requeridos = of.materialesRequeridos ?? []
  if (requeridos.some((l) => l.materialId === materialId)) {
    throw new Error('material-ya-agregado')
  }
  await updateDoc(doc(db, 'ordenesFabricacion', of.id), {
    materialesRequeridos: [...requeridos, { materialId, cantidadPlan, cantidadConsumida: 0 }],
  })
}

// Quita una línea de material de la OF — solo si nunca se le registró
// consumo (si ya se sacó stock con esa referencia, quitarla perdería el
// rastro de a qué línea pertenece; hay que revertir esos consumos primero).
export async function quitarMaterialDeOF(of, materialId) {
  const requeridos = of.materialesRequeridos ?? []
  const linea = requeridos.find((l) => l.materialId === materialId)
  if (linea?.cantidadConsumida > 0) {
    throw new Error('material-con-consumo')
  }
  await updateDoc(doc(db, 'ordenesFabricacion', of.id), {
    materialesRequeridos: requeridos.filter((l) => l.materialId !== materialId),
  })
}

// Quita un proveedor de la lista de una OF. No borra su O.C. si ya se
// había generado (esa se maneja aparte desde Compras) — solo deja de
// aparecer como proveedor asignado a esta OF.
export async function quitarProveedorDeOF(of, index) {
  const restantes = proveedoresDe(of).filter((_, i) => i !== index)
  await updateDoc(doc(db, 'ordenesFabricacion', of.id), { proveedores: restantes })
}
