import { estaVencido } from '../../lib/plazos'

// Las OF antiguas guardan un solo `proveedorId`/`plazoEntregaDias` planos.
// Las nuevas guardan `proveedores`: [{ proveedorId, plazoEntregaDias,
// fechaCompromiso, materiales }], que puede venir vacío (proveedor es
// opcional). Esta función normaliza ambos formatos a una sola lista para
// que el resto del código no tenga que preocuparse por cuál formato tiene
// cada documento.
export function proveedoresDe(of) {
  if (of.proveedores?.length) return of.proveedores
  if (of.proveedorId) return [{ proveedorId: of.proveedorId, plazoEntregaDias: of.plazoEntregaDias }]
  return []
}

// Vencida si CUALQUIER proveedor asignado ya pasó su fecha límite — ya
// sea la fecha exacta que dio (fechaCompromiso) o el plazo en días desde
// que se abrió la OF.
export function ofVencida(of) {
  return proveedoresDe(of).some((p) =>
    estaVencido(of.fecha, p.plazoEntregaDias, p.fechaCompromiso),
  )
}
