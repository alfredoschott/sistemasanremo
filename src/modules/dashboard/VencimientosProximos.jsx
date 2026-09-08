import { AlertTriangle, CalendarClock } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { fechaVencimiento } from '../../lib/plazos'
import { useRoles } from '../../lib/RolesContext'
import { useOrdenesCompra } from '../compras/useOrdenesCompra'
import ProveedorNombre from '../compras/ProveedorNombre'
import { proveedoresDe } from '../produccion/proveedoresOF'
import { useOrdenesFabricacion } from '../produccion/useOrdenesFabricacion'

const LIMITE = 6
// Ventana hacia adelante: no tiene caso listar algo que vence en 3 meses
// junto con lo urgente de esta semana — se pierde la prioridad.
const DIAS_ADELANTE = 14

function formatoFecha(ms) {
  return new Date(ms).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

// Junta lo que se está por vencer (o ya venció) entre las OF de Producción
// y las O.C. de Compras en una sola lista ordenada por fecha — para no
// tener que revisar módulo por módulo buscando qué urge.
export default function VencimientosProximos() {
  const { tieneAcceso } = useRoles()
  const { ordenes: ordenesFabricacion } = useOrdenesFabricacion()
  const { ordenes: ordenesCompra } = useOrdenesCompra()

  const items = useMemo(() => {
    const limiteMs = Date.now() + DIAS_ADELANTE * 24 * 60 * 60 * 1000
    const lista = []

    if (tieneAcceso('produccion')) {
      ordenesFabricacion
        .filter((of) => !of.archivada && of.estado !== 'Completada')
        .forEach((of) => {
          proveedoresDe(of).forEach((p) => {
            const ms = fechaVencimiento(of.fecha, p.plazoEntregaDias, p.fechaCompromiso)
            if (ms && ms <= limiteMs) {
              lista.push({
                key: `of-${of.id}-${p.proveedorId}`,
                ms,
                to: '/produccion',
                tipo: 'OF',
                titulo: of.numeroSerie,
                detalle: <ProveedorNombre proveedorId={p.proveedorId} />,
              })
            }
          })
        })
    }

    if (tieneAcceso('compras')) {
      ordenesCompra
        .filter((oc) => oc.estado === 'pendiente')
        .forEach((oc) => {
          const ms = fechaVencimiento(oc.fecha, oc.plazoEntregaDias, oc.fechaCompromiso)
          if (ms && ms <= limiteMs) {
            lista.push({
              key: `oc-${oc.id}`,
              ms,
              to: '/compras',
              tipo: 'O.C.',
              titulo: <ProveedorNombre proveedorId={oc.proveedorId} />,
              detalle: `${(oc.materiales ?? []).length} material${(oc.materiales ?? []).length === 1 ? '' : 'es'}`,
            })
          }
        })
    }

    return lista.sort((a, b) => a.ms - b.ms).slice(0, LIMITE)
  }, [ordenesFabricacion, ordenesCompra, tieneAcceso])

  if (!tieneAcceso('produccion') && !tieneAcceso('compras')) return null
  if (items.length === 0) return null

  return (
    <div className="mt-6 rounded-lg border border-line bg-surface p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-brand-700" />
        <h2 className="text-sm font-semibold text-ink">Vencimientos próximos</h2>
      </div>
      <ul className="stagger flex flex-col gap-2">
        {items.map((item) => {
          const vencido = item.ms < Date.now()
          return (
            <li key={item.key}>
              <Link
                to={item.to}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 -mx-2 text-sm transition-colors hover:bg-surface-2"
              >
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    vencido ? 'bg-red-100 text-red-700' : 'bg-copper-soft text-copper-ink'
                  }`}
                >
                  {item.tipo}
                </span>
                <span className="min-w-0 flex-1 truncate text-ink-dim">
                  {item.titulo} · {item.detalle}
                </span>
                <span
                  className={`flex shrink-0 items-center gap-1 font-mono text-xs ${
                    vencido ? 'font-semibold text-red-700' : 'text-ink-faint'
                  }`}
                >
                  {vencido && <AlertTriangle className="h-3 w-3" />}
                  {vencido ? 'Vencida' : formatoFecha(item.ms)}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
