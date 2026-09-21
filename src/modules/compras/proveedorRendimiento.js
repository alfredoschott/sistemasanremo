import { fechaVencimiento } from '../../lib/plazos'

const DIA_MS = 24 * 60 * 60 * 1000

// Calcula, por proveedor, qué tan seguido entrega a tiempo — comparando la
// fecha en que se marcó "recibida" la O.C. contra su fecha límite (la misma
// que usa `estaVencido` para la alerta de "Vencida"). Solo cuentan las O.C.
// ya recibidas: una pendiente todavía no tiene desenlace que evaluar.
export function calcularRendimientoProveedores(ordenes) {
  const porProveedor = new Map()

  for (const oc of ordenes) {
    if (oc.estado !== 'recibida' || !oc.proveedorId) continue
    const limite = fechaVencimiento(oc.fecha, oc.plazoEntregaDias, oc.fechaCompromiso)
    const recibida = oc.fechaRecibida?.toMillis?.()
    // Sin fecha límite calculable (ni fechaCompromiso ni plazoEntregaDias
    // capturados) no se puede juzgar si llegó a tiempo — se cuenta en el
    // total pero no suma ni a "a tiempo" ni a "tarde".
    const diasAtraso = limite && recibida ? Math.round((recibida - limite) / DIA_MS) : null

    const previo = porProveedor.get(oc.proveedorId) ?? {
      proveedorId: oc.proveedorId,
      total: 0,
      aTiempo: 0,
      tarde: 0,
      sumaDiasAtraso: 0,
    }
    previo.total += 1
    if (diasAtraso !== null) {
      if (diasAtraso <= 0) previo.aTiempo += 1
      else {
        previo.tarde += 1
        previo.sumaDiasAtraso += diasAtraso
      }
    }
    porProveedor.set(oc.proveedorId, previo)
  }

  return [...porProveedor.values()]
    .map((p) => {
      const evaluadas = p.aTiempo + p.tarde
      return {
        proveedorId: p.proveedorId,
        total: p.total,
        aTiempo: p.aTiempo,
        tarde: p.tarde,
        pctATiempo: evaluadas > 0 ? Math.round((p.aTiempo / evaluadas) * 100) : null,
        promedioDiasAtraso: p.tarde > 0 ? Math.round(p.sumaDiasAtraso / p.tarde) : null,
      }
    })
    .sort((a, b) => (b.pctATiempo ?? -1) - (a.pctATiempo ?? -1))
}
