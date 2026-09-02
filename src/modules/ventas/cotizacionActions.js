import { doc, updateDoc } from 'firebase/firestore'
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
  })
}
