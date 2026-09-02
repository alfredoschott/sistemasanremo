import { doc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../../lib/firebase'

export async function iniciarProduccion(of) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'ordenesFabricacion', of.id), { estado: 'En producción', avance: 0 })
  batch.update(doc(db, 'cotizaciones', of.cotizacionId), { estado: 'Producción' })
  await batch.commit()
}

export async function actualizarAvance(ofId, avance) {
  await updateDoc(doc(db, 'ordenesFabricacion', ofId), { avance })
}

export async function completarYFacturar(of) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'ordenesFabricacion', of.id), { estado: 'Completada', avance: 100 })
  batch.update(doc(db, 'cotizaciones', of.cotizacionId), { estado: 'Facturado' })
  await batch.commit()
}
