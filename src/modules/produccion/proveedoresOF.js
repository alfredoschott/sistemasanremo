// Las OF antiguas guardan un solo `proveedorId`/`plazoEntregaDias` planos.
// Las nuevas guardan `proveedores`: [{ proveedorId, plazoEntregaDias, materiales }],
// que puede venir vacío (proveedor es opcional). Esta función normaliza
// ambos formatos a una sola lista para que el resto del código no tenga
// que preocuparse por cuál formato tiene cada documento.
export function proveedoresDe(of) {
  if (of.proveedores?.length) return of.proveedores
  if (of.proveedorId) return [{ proveedorId: of.proveedorId, plazoEntregaDias: of.plazoEntregaDias }]
  return []
}

export function plazoMasCorto(of) {
  const plazos = proveedoresDe(of)
    .map((p) => p.plazoEntregaDias)
    .filter((d) => Number.isFinite(d))
  return plazos.length ? Math.min(...plazos) : null
}
