import { deleteField, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'

// Archivar solo oculta la O.C. recibida de la vista principal (para no
// amontonar la lista con compras viejas) — el registro se conserva, a
// diferencia de eliminar. Mismo patrón que archivarOF/archivarCotizacion.
export async function archivarOC(oc) {
  await updateDoc(doc(db, 'ordenesCompra', oc.id), {
    archivada: true,
    archivadaEn: serverTimestamp(),
  })
}

export async function desarchivarOC(oc) {
  await updateDoc(doc(db, 'ordenesCompra', oc.id), {
    archivada: false,
    archivadaEn: deleteField(),
  })
}

const DIA_MS = 24 * 60 * 60 * 1000
const DIAS_AUTO_ARCHIVO = 30

// Corre desde ComprasPage en cada carga: archiva solas las O.C. recibidas
// hace más de DIAS_AUTO_ARCHIVO sin archivarse a mano, igual que el
// auto-archivado de cotizaciones en Ventas. Las pendientes nunca se tocan.
export async function autoArchivarRecibidasVencidas(ordenes) {
  const limite = Date.now() - DIAS_AUTO_ARCHIVO * DIA_MS
  const candidatas = ordenes.filter((oc) => {
    if (oc.archivada || oc.estado !== 'recibida') return false
    const ms = (oc.fechaRecibida ?? oc.fecha)?.toMillis?.()
    return Boolean(ms) && ms < limite
  })
  await Promise.all(candidatas.map((oc) => archivarOC(oc)))
}
