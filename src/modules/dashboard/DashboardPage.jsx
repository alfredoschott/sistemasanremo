import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MetricCard, MetricsRow } from '../../components/Metric'
import { useNotificaciones } from '../../lib/useNotificaciones'
import { useMateriales } from '../almacen/useMateriales'
import { useOrdenesCompra } from '../compras/useOrdenesCompra'
import { useOrdenesFabricacion } from '../produccion/useOrdenesFabricacion'
import { useCotizaciones } from '../ventas/useCotizaciones'

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

const ICONS = { success: CheckCircle2, warning: AlertTriangle, info: Info }

function timeAgo(fecha) {
  const ms = fecha?.toMillis?.()
  if (!ms) return ''
  const diffMin = Math.round((Date.now() - ms) / 60000)
  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `hace ${diffH} h`
  return `hace ${Math.round(diffH / 24)} d`
}

export default function DashboardPage() {
  const { cotizaciones } = useCotizaciones()
  const { ordenes: ordenesCompra } = useOrdenesCompra()
  const { ordenes: ordenesFabricacion } = useOrdenesFabricacion()
  const { materiales } = useMateriales()
  const { notificaciones } = useNotificaciones()

  const resumen = useMemo(() => {
    const cotizado = cotizaciones
      .filter((c) => c.estado === 'Cotizado')
      .reduce((sum, c) => sum + (c.monto ?? 0), 0)
    const facturadoMes = cotizaciones
      .filter((c) => c.estado === 'Facturado')
      .reduce((sum, c) => sum + (c.monto ?? 0), 0)
    const ocPendientes = ordenesCompra.filter((o) => o.estado === 'pendiente').length
    const ofActivas = ordenesFabricacion.filter(
      (of) => of.estado === 'Abierta' || of.estado === 'En producción',
    ).length
    const materialesBajoMinimo = materiales.filter(
      (m) => (m.stock ?? 0) < (m.minimo ?? 0),
    ).length
    return { cotizado, facturadoMes, ocPendientes, ofActivas, materialesBajoMinimo }
  }, [cotizaciones, ordenesCompra, ordenesFabricacion, materiales])

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-800">Panorama general</h1>
      <p className="mb-4 text-sm text-slate-500">SRM Telsa Transformadores — Sanremo de México</p>

      <MetricsRow>
        <MetricCard label="Cotizado sin OF" value={currency.format(resumen.cotizado)} />
        <MetricCard label="OF activas" value={resumen.ofActivas} variant="warn" />
        <MetricCard label="Facturado" value={currency.format(resumen.facturadoMes)} variant="accent" />
        <MetricCard
          label="Materiales bajo mínimo"
          value={resumen.materialesBajoMinimo}
          variant={resumen.materialesBajoMinimo > 0 ? 'danger' : 'default'}
        />
      </MetricsRow>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Link
          to="/ventas"
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-sm text-slate-400">Ventas</p>
          <p className="text-2xl font-semibold text-slate-800">{cotizaciones.length}</p>
          <p className="text-xs text-slate-400">cotizaciones totales</p>
        </Link>
        <Link
          to="/compras"
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-sm text-slate-400">Compras</p>
          <p className="text-2xl font-semibold text-slate-800">{resumen.ocPendientes}</p>
          <p className="text-xs text-slate-400">O.C. pendientes</p>
        </Link>
        <Link
          to="/almacen"
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-sm text-slate-400">Almacén</p>
          <p className="text-2xl font-semibold text-slate-800">{materiales.length}</p>
          <p className="text-xs text-slate-400">materiales en catálogo</p>
        </Link>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Actividad reciente</h2>
        {notificaciones.length === 0 ? (
          <p className="text-sm text-slate-400">Sin actividad todavía.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {notificaciones.slice(0, 8).map((n) => {
              const Icon = ICONS[n.tipo] ?? Info
              return (
                <li key={n.id} className="flex items-start gap-2.5 text-sm">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span className="flex-1 text-slate-600">{n.mensaje}</span>
                  <span className="shrink-0 text-xs text-slate-400">{timeAgo(n.fecha)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
