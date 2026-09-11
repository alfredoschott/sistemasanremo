import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  ChevronRight,
  Download,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import EstadoBadge from '../../components/EstadoBadge'
import IconButton from '../../components/IconButton'
import { MetricCard, MetricsRow } from '../../components/Metric'
import SearchInput from '../../components/SearchInput'
import { TableSkeleton } from '../../components/Skeleton'
import { exportCsv } from '../../lib/exportCsv'
import { ESTADOS_COTIZACION } from '../../lib/estados'
import { estaVencido } from '../../lib/plazos'
import { mensajeError } from '../../lib/firestoreErrors'
import { useToast } from '../../lib/ToastContext'
import { currency } from '../../lib/currency'
import {
  archivarCotizacion,
  autoArchivarVencidas,
  desarchivarCotizacion,
  eliminarCotizacion,
} from './cotizacionActions'
import NuevaCotizacionModal from './NuevaCotizacionModal'
import { useCotizaciones } from './useCotizaciones'

const PUEDE_ELIMINAR = new Set(['Cotizado', 'Cancelado'])
const PUEDE_ARCHIVAR = new Set(['Facturado', 'Cancelado'])

const ESTADOS_FILTRO = ['Todos', ...ESTADOS_COTIZACION, 'Cancelado']
const PAGO_FILTRO = [
  { value: 'todas', label: 'Todas' },
  { value: 'anticipo', label: 'Anticipo' },
  { value: 'fudeco', label: 'Crédito Fudeco' },
]


export default function VentasList() {
  const { cotizaciones, loading } = useCotizaciones()
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [filtroPago, setFiltroPago] = useState('todas')
  const [eliminandoId, setEliminandoId] = useState(null)
  const [archivandoId, setArchivandoId] = useState(null)
  const [viendoArchivadas, setViendoArchivadas] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  // Revisa una vez cargadas las cotizaciones si hay alguna ya cerrada desde
  // hace tiempo para archivarla sola (ver autoArchivarVencidas) — así la
  // lista no se llena de pedidos viejos aunque nadie se acuerde de archivar.
  useEffect(() => {
    if (loading) return
    autoArchivarVencidas(cotizaciones).catch(() => {})
  }, [loading, cotizaciones])

  const eliminar = (e, cot) => {
    e.stopPropagation()
    if (!window.confirm(`¿Eliminar definitivamente la cotización de ${cot.cliente}? Esto no se puede deshacer.`))
      return
    setEliminandoId(cot.id)
    eliminarCotizacion(cot)
      .then(() => toast(`Cotización de ${cot.cliente} eliminada`))
      .catch((err) => toast(mensajeError(err, 'No se pudo eliminar. Intenta de nuevo.'), 'error'))
      .finally(() => setEliminandoId(null))
  }

  const archivar = (e, cot) => {
    e.stopPropagation()
    setArchivandoId(cot.id)
    archivarCotizacion(cot)
      .then(() =>
        toast(`Cotización de ${cot.cliente} archivada`, 'success', {
          onUndo: () => desarchivarCotizacion(cot),
        }),
      )
      .catch((err) => toast(mensajeError(err, 'No se pudo archivar. Intenta de nuevo.'), 'error'))
      .finally(() => setArchivandoId(null))
  }

  const desarchivar = (e, cot) => {
    e.stopPropagation()
    setArchivandoId(cot.id)
    desarchivarCotizacion(cot)
      .then(() => toast(`Cotización de ${cot.cliente} restaurada`))
      .catch((err) => toast(mensajeError(err, 'No se pudo restaurar. Intenta de nuevo.'), 'error'))
      .finally(() => setArchivandoId(null))
  }

  const metrics = useMemo(() => {
    const cotizado = cotizaciones
      .filter((c) => c.estado === 'Cotizado')
      .reduce((sum, c) => sum + (c.monto ?? 0), 0)
    const enProduccion = cotizaciones.filter((c) => c.estado === 'Producción').length
    const facturado = cotizaciones
      .filter((c) => c.estado === 'Facturado')
      .reduce((sum, c) => sum + (c.monto ?? 0), 0)
    const anticipos = cotizaciones
      .filter((c) => c.condicionPago === 'anticipo' && c.estado !== 'Facturado')
      .reduce((sum, c) => sum + ((c.monto ?? 0) * (c.porcentajeAnticipo ?? 0)) / 100, 0)
    return { cotizado, enProduccion, facturado, anticipos }
  }, [cotizaciones])

  const archivadas = useMemo(() => cotizaciones.filter((c) => c.archivada), [cotizaciones])

  // Facturado/Cancelado se hunden al final (en vez de mezclarse con las
  // activas) mientras no se archivan a mano o solas a los 30 días.
  const filtradas = useMemo(
    () =>
      cotizaciones
        .filter((c) => Boolean(c.archivada) === viendoArchivadas)
        .filter((c) => c.cliente?.toLowerCase().includes(search.toLowerCase().trim()))
        .filter((c) => filtroEstado === 'Todos' || c.estado === filtroEstado)
        .filter((c) => filtroPago === 'todas' || c.condicionPago === filtroPago)
        .sort((a, b) => (PUEDE_ARCHIVAR.has(a.estado) ? 1 : 0) - (PUEDE_ARCHIVAR.has(b.estado) ? 1 : 0)),
    [cotizaciones, search, filtroEstado, filtroPago, viendoArchivadas],
  )

  const hayFiltrosActivos = filtroEstado !== 'Todos' || filtroPago !== 'todas' || Boolean(search)

  const exportar = () => {
    exportCsv(
      `cotizaciones_${new Date().toISOString().slice(0, 10)}.csv`,
      filtradas,
      [
        { label: 'Cliente', value: (c) => c.cliente },
        {
          label: 'Transformadores',
          value: (c) =>
            (c.items ?? []).map((i) => `${i.cantidad}x ${i.modelo}`).join('; '),
        },
        { label: 'Monto', value: (c) => c.monto },
        { label: 'Condición de pago', value: (c) => c.condicionPago },
        { label: 'Entrega (semanas)', value: (c) => c.entregaSemanas },
        { label: 'Estado', value: (c) => c.estado },
        { label: 'Número de serie', value: (c) => c.numeroSerie ?? '' },
      ],
    )
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-ink">Cotizaciones</h1>
          <p className="text-sm text-ink-faint">{cotizaciones.length - archivadas.length} en total</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(archivadas.length > 0 || viendoArchivadas) && (
            <Button
              variant="secondary"
              onClick={() => setViendoArchivadas((v) => !v)}
              className="inline-flex items-center gap-1.5"
            >
              <Archive className="h-4 w-4" />
              {viendoArchivadas ? 'Ver activas' : `Archivadas (${archivadas.length})`}
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={exportar}
            className="gap-1.5 inline-flex items-center"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button onClick={() => setModalOpen(true)} className="gap-1.5 inline-flex items-center">
            <Plus className="h-4 w-4" />
            Nueva cotización
          </Button>
        </div>
      </div>

      <MetricsRow>
        <MetricCard label="Cotizado" value={currency.format(metrics.cotizado)} />
        <MetricCard label="En producción" value={`${metrics.enProduccion} OF`} variant="warn" />
        <MetricCard label="Facturado" value={currency.format(metrics.facturado)} variant="accent" />
        <MetricCard label="Anticipos pendientes" value={currency.format(metrics.anticipos)} />
      </MetricsRow>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar por cliente…" />

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap gap-1.5">
          {ESTADOS_FILTRO.map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filtroEstado === estado
                  ? 'bg-brand-700 text-white'
                  : 'bg-surface-2 text-ink-dim hover:bg-line'
              }`}
            >
              {estado}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-line hidden sm:block" />
        <div className="flex flex-wrap gap-1.5">
          {PAGO_FILTRO.map((p) => (
            <button
              key={p.value}
              onClick={() => setFiltroPago(p.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filtroPago === p.value
                  ? 'bg-brand-700 text-white'
                  : 'bg-surface-2 text-ink-dim hover:bg-line'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {hayFiltrosActivos && (
          <button
            onClick={() => {
              setFiltroEstado('Todos')
              setFiltroPago('todas')
              setSearch('')
            }}
            className="text-xs font-medium text-ink-faint hover:text-ink-dim hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="overflow-x-auto border border-line-strong bg-surface">
        <table className="hidden w-full text-left text-sm lg:table">
          <thead className="bg-surface-2 text-[0.625rem] font-mono uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Monto</th>
              <th className="px-4 py-3">Condición de pago</th>
              <th className="px-4 py-3">Entrega</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="stagger divide-y divide-line">
            {loading && <TableSkeleton rows={3} cols={6} />}
            {!loading && filtradas.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={FileText}
                    title={hayFiltrosActivos ? 'Sin resultados' : 'Sin cotizaciones todavía'}
                    subtitle={hayFiltrosActivos ? 'Prueba con otro filtro o término' : 'Crea la primera con "Nueva cotización"'}
                  />
                </td>
              </tr>
            )}
            {filtradas.map((cot) => (
              <tr
                key={cot.id}
                onClick={() => navigate(`/ventas/${cot.id}`)}
                className="cursor-pointer transition-colors hover:bg-surface-2"
              >
                <td className="px-4 py-3 font-medium text-ink">{cot.cliente}</td>
                <td className="px-4 py-3 text-ink-dim">{currency.format(cot.monto ?? 0)}</td>
                <td className="px-4 py-3 text-ink-dim">
                  {cot.condicionPago === 'anticipo'
                    ? `Anticipo ${cot.porcentajeAnticipo ?? ''}%`
                    : 'Crédito Fudeco'}
                </td>
                <td className="px-4 py-3 text-ink-dim">
                  <span className="inline-flex items-center gap-1">
                    {cot.entregaSemanas} sem.
                    {!['Facturado', 'Cancelado'].includes(cot.estado) &&
                      estaVencido(cot.fecha, (cot.entregaSemanas ?? 0) * 7) && (
                        <AlertTriangle
                          className="h-3.5 w-3.5 text-red-500"
                          title="Entrega comprometida vencida"
                        />
                      )}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <EstadoBadge estado={cot.estado} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {viendoArchivadas ? (
                      <IconButton
                        icon={ArchiveRestore}
                        disabled={archivandoId === cot.id}
                        onClick={(e) => desarchivar(e, cot)}
                        title="Restaurar a la lista principal"
                      />
                    ) : (
                      PUEDE_ARCHIVAR.has(cot.estado) && (
                        <IconButton
                          icon={Archive}
                          disabled={archivandoId === cot.id}
                          onClick={(e) => archivar(e, cot)}
                          title="Archivar"
                        />
                      )
                    )}
                    {PUEDE_ELIMINAR.has(cot.estado) && (
                      <IconButton
                        icon={Trash2}
                        variant="danger"
                        disabled={eliminandoId === cot.id}
                        onClick={(e) => eliminar(e, cot)}
                        title="Eliminar cotización"
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="divide-y divide-line lg:hidden">
          {loading && (
            <div className="flex flex-col gap-2.5 p-4">
              <div className="skeleton h-4 w-2/3 rounded-md" />
              <div className="skeleton h-4 w-1/3 rounded-md" />
            </div>
          )}
          {!loading && filtradas.length === 0 && (
            <EmptyState
              icon={FileText}
              title={hayFiltrosActivos ? 'Sin resultados' : 'Sin cotizaciones todavía'}
              subtitle={hayFiltrosActivos ? 'Prueba con otro filtro o término' : 'Crea la primera con "Nueva cotización"'}
            />
          )}
          {filtradas.map((cot) => (
            <div
              key={cot.id}
              onClick={() => navigate(`/ventas/${cot.id}`)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 p-4 text-left transition-colors active:bg-brand-50/40"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{cot.cliente}</p>
                <p className="text-sm text-ink-faint">{currency.format(cot.monto ?? 0)}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-ink-faint">
                  {cot.condicionPago === 'anticipo'
                    ? `Anticipo ${cot.porcentajeAnticipo ?? ''}%`
                    : 'Crédito Fudeco'}
                  {' · '}
                  {cot.entregaSemanas} sem.
                  {!['Facturado', 'Cancelado'].includes(cot.estado) &&
                    estaVencido(cot.fecha, (cot.entregaSemanas ?? 0) * 7) && (
                      <AlertTriangle className="h-3 w-3 shrink-0 text-red-500" title="Entrega vencida" />
                    )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <div className="flex flex-col items-end gap-1.5">
                  <EstadoBadge estado={cot.estado} />
                  <div className="flex items-center gap-1">
                    {viendoArchivadas ? (
                      <IconButton
                        icon={ArchiveRestore}
                        disabled={archivandoId === cot.id}
                        onClick={(e) => desarchivar(e, cot)}
                        title="Restaurar a la lista principal"
                      />
                    ) : (
                      PUEDE_ARCHIVAR.has(cot.estado) && (
                        <IconButton
                          icon={Archive}
                          disabled={archivandoId === cot.id}
                          onClick={(e) => archivar(e, cot)}
                          title="Archivar"
                        />
                      )
                    )}
                    {PUEDE_ELIMINAR.has(cot.estado) && (
                      <IconButton
                        icon={Trash2}
                        variant="danger"
                        disabled={eliminandoId === cot.id}
                        onClick={(e) => eliminar(e, cot)}
                        title="Eliminar cotización"
                      />
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-line-strong" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <NuevaCotizacionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
