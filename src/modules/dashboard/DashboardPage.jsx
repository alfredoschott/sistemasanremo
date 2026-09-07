import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Container,
  Factory,
  Info,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useRoles } from '../../lib/RolesContext'
import { useNotificaciones } from '../../lib/useNotificaciones'
import { estadoMaterial } from '../almacen/materialStatus'
import { useMateriales } from '../almacen/useMateriales'
import { useMovimientosHoy } from '../almacen/useMovimientosHoy'
import { useOrdenesCompra } from '../compras/useOrdenesCompra'
import { useOrdenesFabricacion } from '../produccion/useOrdenesFabricacion'
import { useTransformadores } from '../transformadores/useTransformadores'
import { useCotizaciones } from '../ventas/useCotizaciones'

// Sin centavos y a propósito: en una tarjeta de resumen de 3 columnas
// angostas, "$527,000.00" no cabe sin truncarse — el detalle exacto con
// centavos ya está en la página de cada área (Ventas, Finanzas).
const currency = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

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

// Tarjeta genérica de área: ícono + título + 2-3 datos clave + link al
// módulo completo. Cada *Card de abajo monta solo los hooks (Firestore)
// que su propia área necesita, y DashboardPage decide cuáles renderizar
// según el rol — así alguien con una sola área ve algo completo, no un
// hueco vacío esperando el resto de tarjetas que nunca le corresponden.
function Stat({ label, value, danger, size = 'text-lg' }) {
  return (
    <div className="min-w-0">
      <dt className="mb-0.5 truncate text-[0.625rem] uppercase tracking-wide text-ink-faint">
        {label}
      </dt>
      <dd
        className={`truncate font-mono ${size} font-semibold tabular-nums ${
          danger ? 'text-red-700' : 'text-ink'
        }`}
        title={String(value)}
      >
        {value}
      </dd>
    </div>
  )
}

// stats siempre en 2 columnas (nunca 3): con montos en pesos, una tercera
// columna angosta se queda sin espacio y trunca el número. Con un número
// impar de datos, el último se vuelve "estrella" a todo el ancho abajo —
// también le da jerarquía visual al dato más importante de cada área.
function AreaCard({ to, icon: Icon, title, stats }) {
  const esImpar = stats.length % 2 === 1
  const pares = esImpar ? stats.slice(0, -1) : stats
  const estrella = esImpar ? stats[stats.length - 1] : null

  return (
    <Link
      to={to}
      className="group rounded-lg border border-line bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-brand-700" />
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        {pares.map((s) => (
          <Stat key={s.label} {...s} />
        ))}
      </dl>
      {estrella && (
        <dl className="mt-3 border-t border-line pt-3">
          <Stat {...estrella} size="text-2xl" />
        </dl>
      )}
    </Link>
  )
}

function VentasCard() {
  const { cotizaciones } = useCotizaciones()
  const stats = useMemo(() => {
    const cotizado = cotizaciones
      .filter((c) => c.estado === 'Cotizado')
      .reduce((sum, c) => sum + (c.monto ?? 0), 0)
    const facturado = cotizaciones
      .filter((c) => c.estado === 'Facturado')
      .reduce((sum, c) => sum + (c.monto ?? 0), 0)
    return [
      { label: 'Cotizado sin OF', value: currency.format(cotizado) },
      { label: 'Cotizaciones', value: cotizaciones.length },
      { label: 'Facturado', value: currency.format(facturado) },
    ]
  }, [cotizaciones])
  return <AreaCard to="/ventas" icon={TrendingUp} title="Ventas" stats={stats} />
}

function ComprasCard() {
  const { ordenes } = useOrdenesCompra()
  const stats = useMemo(() => {
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)
    const pendientes = ordenes.filter((o) => o.estado === 'pendiente').length
    const recibidasEsteMes = ordenes.filter(
      (o) => o.estado === 'recibida' && (o.fechaRecibida?.toMillis?.() ?? 0) >= inicioMes.getTime(),
    ).length
    const proveedoresActivos = new Set(ordenes.map((o) => o.proveedorId)).size
    return [
      { label: 'Recibidas (mes)', value: recibidasEsteMes },
      { label: 'Proveedores', value: proveedoresActivos },
      { label: 'O.C. pendientes', value: pendientes, danger: pendientes > 0 },
    ]
  }, [ordenes])
  return <AreaCard to="/compras" icon={ShoppingCart} title="Compras" stats={stats} />
}

function ProduccionCard() {
  const { ordenes } = useOrdenesFabricacion()
  const stats = useMemo(() => {
    const activas = ordenes.filter((of) => !of.archivada)
    const abiertas = activas.filter((of) => of.estado === 'Abierta').length
    const enProduccion = activas.filter((of) => of.estado === 'En producción')
    const avancePromedio = enProduccion.length
      ? Math.round(enProduccion.reduce((sum, of) => sum + (of.avance ?? 0), 0) / enProduccion.length)
      : 0
    return [
      { label: 'OF abiertas', value: abiertas },
      { label: 'En producción', value: enProduccion.length },
      { label: 'Avance promedio', value: `${avancePromedio}%` },
    ]
  }, [ordenes])
  return <AreaCard to="/produccion" icon={Factory} title="Producción" stats={stats} />
}

function AlmacenCard() {
  const { materiales } = useMateriales()
  const movimientosHoy = useMovimientosHoy()
  const stats = useMemo(() => {
    let critico = 0
    let bajo = 0
    materiales.forEach((m) => {
      const estado = estadoMaterial(m)
      if (estado === 'critico') critico++
      if (estado === 'bajo') bajo++
    })
    return [
      { label: 'Estado crítico', value: critico, danger: critico > 0 },
      { label: 'Stock bajo', value: bajo, danger: bajo > 0 },
      { label: 'Movimientos hoy', value: movimientosHoy },
    ]
  }, [materiales, movimientosHoy])
  return <AreaCard to="/almacen" icon={Boxes} title="Almacén" stats={stats} />
}

function TransformadoresCard() {
  const { transformadores } = useTransformadores()
  const stats = useMemo(() => {
    const unidades = transformadores.reduce((sum, t) => sum + (t.cantidad ?? 0), 0)
    return [
      { label: 'Modelos en catálogo', value: transformadores.length },
      { label: 'Unidades totales', value: unidades },
    ]
  }, [transformadores])
  return <AreaCard to="/transformadores" icon={Container} title="Transformadores" stats={stats} />
}

function FinanzasCard() {
  const { cotizaciones } = useCotizaciones()
  const { ordenes } = useOrdenesCompra()
  const stats = useMemo(() => {
    const porCobrar = cotizaciones
      .filter((c) => c.estado === 'Facturado' && c.condicionPago === 'fudeco' && !c.cobrado)
      .reduce((sum, c) => sum + (c.monto ?? 0), 0)
    const porPagar = ordenes
      .filter((o) => o.estado === 'recibida' && !o.pagado && o.montoTotal)
      .reduce((sum, o) => sum + (o.montoTotal ?? 0), 0)
    const saldo = porCobrar - porPagar
    return [
      { label: 'Por cobrar', value: currency.format(porCobrar) },
      { label: 'Por pagar', value: currency.format(porPagar) },
      { label: 'Saldo (30d)', value: currency.format(saldo), danger: saldo < 0 },
    ]
  }, [cotizaciones, ordenes])
  return <AreaCard to="/finanzas" icon={Wallet} title="Finanzas" stats={stats} />
}

const AREA_CARDS = {
  ventas: VentasCard,
  compras: ComprasCard,
  produccion: ProduccionCard,
  almacen: AlmacenCard,
  transformadores: TransformadoresCard,
  finanzas: FinanzasCard,
}

function ActividadReciente() {
  const { notificaciones } = useNotificaciones()
  return (
    <div className="mt-6 rounded-lg border border-line bg-surface p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-ink">Actividad reciente</h2>
      {notificaciones.length === 0 ? (
        <p className="text-sm text-ink-faint">Sin actividad todavía.</p>
      ) : (
        <ul className="stagger flex flex-col gap-2.5">
          {notificaciones.slice(0, 8).map((n) => {
            const Icon = ICONS[n.tipo] ?? Info
            return (
              <li key={n.id} className="flex items-start gap-2.5 text-sm">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
                <span className="flex-1 text-ink-dim">{n.mensaje}</span>
                <span className="shrink-0 text-xs text-ink-faint">{timeAgo(n.fecha)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { roles, tieneAcceso } = useRoles()
  const areasVisibles = Object.keys(AREA_CARDS).filter((rol) => tieneAcceso(rol))

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-ink">Panorama general</h1>
      <p className="mb-4 text-sm text-ink-faint">SRM Telsa Transformadores — Sanremo de México</p>

      {roles.length === 0 && (
        <p className="mb-4 rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm text-ink-faint">
          Todavía no tienes ninguna área asignada. Pide que un administrador te dé acceso desde
          "Administradores".
        </p>
      )}

      {areasVisibles.length > 0 && (
        <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areasVisibles.map((rol) => {
            const Card = AREA_CARDS[rol]
            return <Card key={rol} />
          })}
        </div>
      )}

      <ActividadReciente />
    </div>
  )
}
