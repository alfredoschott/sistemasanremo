import { deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { Container, Download, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import IconButton from '../../components/IconButton'
import { MetricCard, MetricsRow } from '../../components/Metric'
import Pagination from '../../components/Pagination'
import SearchInput from '../../components/SearchInput'
import Skeleton, { TableSkeleton } from '../../components/Skeleton'
import { db } from '../../lib/firebase'
import { exportCsv } from '../../lib/exportCsv'
import { googleMapsUrl } from '../../lib/maps'
import { mensajeError } from '../../lib/firestoreErrors'
import { useToast } from '../../lib/ToastContext'
import TransformadorModal from './TransformadorModal'
import { useTransformadores } from './useTransformadores'

function DestinoLink({ destino, className = '' }) {
  if (!destino) return <span className="text-ink-dim">—</span>
  return (
    <a
      href={googleMapsUrl(destino)}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-1 text-lime-800 hover:text-lime-900 hover:underline ${className}`}
      title="Ver en Google Maps"
    >
      <MapPin className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{destino}</span>
    </a>
  )
}

const POR_PAGINA = 20

function CantidadInput({ transformador }) {
  const [value, setValue] = useState(transformador.cantidad ?? 0)
  const toast = useToast()

  const commit = () => {
    const cantidad = Math.max(0, Number(value) || 0)
    if (cantidad !== (transformador.cantidad ?? 0)) {
      updateDoc(doc(db, 'transformadoresTerminados', transformador.id), { cantidad }).catch((err) => {
        toast(mensajeError(err, 'No se pudo actualizar la cantidad.'), 'error')
        setValue(transformador.cantidad ?? 0)
      })
    }
  }

  return (
    <input
      type="number"
      min="0"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      className="w-20 rounded-md border border-line-strong px-2 py-1 text-sm outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
    />
  )
}

export default function TransformadoresPage() {
  const { transformadores, loading } = useTransformadores()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [paraEditar, setParaEditar] = useState(null)
  const toast = useToast()

  const buscar = (value) => {
    setSearch(value)
    setPage(1)
  }

  const filtrados = useMemo(
    () =>
      transformadores.filter((t) => {
        const texto = `${t.modelo ?? ''} ${t.voltaje ?? ''} ${t.ubicacion ?? ''} ${t.destino ?? ''}`.toLowerCase()
        return texto.includes(search.toLowerCase().trim())
      }),
    [transformadores, search],
  )

  const metrics = useMemo(() => {
    const totalUnidades = transformadores.reduce((sum, t) => sum + (t.cantidad ?? 0), 0)
    const modelosDistintos = new Set(transformadores.map((t) => t.modelo)).size
    const sinStock = transformadores.filter((t) => (t.cantidad ?? 0) === 0).length
    return { totalUnidades, modelosDistintos, sinStock }
  }, [transformadores])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaActual = Math.min(page, totalPaginas)
  const pagina = filtrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)

  const exportar = () => {
    exportCsv(`transformadores_${new Date().toISOString().slice(0, 10)}.csv`, filtrados, [
      { label: 'Modelo', value: (t) => t.modelo },
      { label: 'Capacidad (kVA)', value: (t) => t.capacidadKva ?? '' },
      { label: 'Voltaje', value: (t) => t.voltaje ?? '' },
      { label: 'Cantidad', value: (t) => t.cantidad ?? 0 },
      { label: 'Ubicación', value: (t) => t.ubicacion ?? '' },
      { label: 'Destino', value: (t) => t.destino ?? '' },
      { label: 'Notas', value: (t) => t.notas ?? '' },
    ])
  }

  const eliminar = async (t) => {
    if (!window.confirm(`¿Eliminar "${t.modelo}" del inventario?`)) return
    try {
      await deleteDoc(doc(db, 'transformadoresTerminados', t.id))
      toast(`${t.modelo} eliminado`)
    } catch (err) {
      toast(mensajeError(err, 'No se pudo eliminar.'), 'error')
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-ink">Transformadores terminados</h1>
          <p className="text-sm text-ink-faint">Inventario de unidades ya fabricadas y listas para entrega.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={exportar}
            className="inline-flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            Nuevo transformador
          </Button>
        </div>
      </div>

      <MetricsRow>
        <MetricCard label="Unidades en inventario" value={metrics.totalUnidades} variant="lime" />
        <MetricCard label="Modelos distintos" value={metrics.modelosDistintos} />
        <MetricCard label="Modelos sin stock" value={metrics.sinStock} variant="warn" />
      </MetricsRow>

      <SearchInput value={search} onChange={buscar} placeholder="Buscar por modelo, voltaje o ubicación…" />

      <div className="overflow-x-auto border border-line-strong bg-surface">
        <table className="hidden w-full text-left text-sm lg:table">
          <thead className="bg-surface-2 text-[0.625rem] font-mono uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3">Capacidad</th>
              <th className="px-4 py-3">Voltaje</th>
              <th className="px-4 py-3">Ubicación</th>
              <th className="px-4 py-3">Destino</th>
              <th className="px-4 py-3">Cantidad</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="stagger divide-y divide-line">
            {loading && <TableSkeleton rows={3} cols={7} />}
            {!loading && pagina.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon={Container}
                    title={search ? 'Sin resultados' : 'Sin transformadores en inventario'}
                    subtitle={search ? 'Prueba con otro término' : 'Agrega el primero con "Nuevo transformador"'}
                  />
                </td>
              </tr>
            )}
            {pagina.map((t) => (
              <tr key={t.id} className="transition-colors hover:bg-surface-2">
                <td className="px-4 py-3 font-medium text-ink">{t.modelo}</td>
                <td className="px-4 py-3 text-ink-dim">{t.capacidadKva ? `${t.capacidadKva} kVA` : '—'}</td>
                <td className="px-4 py-3 text-ink-dim">{t.voltaje || '—'}</td>
                <td className="px-4 py-3 text-ink-dim">{t.ubicacion || '—'}</td>
                <td className="max-w-[180px] px-4 py-3 text-ink-dim">
                  <DestinoLink destino={t.destino} />
                </td>
                <td className="px-4 py-3">
                  <CantidadInput transformador={t} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <IconButton icon={Pencil} onClick={() => setParaEditar(t)} title="Editar" />
                    <IconButton icon={Trash2} variant="danger" onClick={() => eliminar(t)} title="Eliminar" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="divide-y divide-line lg:hidden">
          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2.5 p-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          {!loading && pagina.length === 0 && (
            <EmptyState
              icon={Container}
              title={search ? 'Sin resultados' : 'Sin transformadores en inventario'}
              subtitle={search ? 'Prueba con otro término' : 'Agrega el primero con "Nuevo transformador"'}
            />
          )}
          {pagina.map((t) => (
            <div key={t.id} className="flex flex-col gap-2.5 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{t.modelo}</p>
                  <p className="text-sm text-ink-faint">
                    {t.capacidadKva ? `${t.capacidadKva} kVA` : '—'} · {t.voltaje || '—'}
                  </p>
                  {t.ubicacion && <p className="text-xs text-ink-faint">{t.ubicacion}</p>}
                  {t.destino && <DestinoLink destino={t.destino} className="mt-1 text-xs" />}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <IconButton icon={Pencil} onClick={() => setParaEditar(t)} title="Editar" />
                  <IconButton icon={Trash2} variant="danger" onClick={() => eliminar(t)} title="Eliminar" />
                </div>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-ink-faint">
                Cantidad
                <CantidadInput transformador={t} />
              </label>
            </div>
          ))}
        </div>

        <Pagination page={paginaActual} totalPages={totalPaginas} onChange={setPage} />
      </div>

      <TransformadorModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <TransformadorModal
        open={Boolean(paraEditar)}
        onClose={() => setParaEditar(null)}
        transformador={paraEditar}
      />
    </div>
  )
}
