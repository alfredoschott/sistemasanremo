import { deleteDoc, doc } from 'firebase/firestore'
import { AlertTriangle, ClipboardList, Download, PackageCheck, Paperclip, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import Adjuntos from '../../components/Adjuntos'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import IconButton from '../../components/IconButton'
import { MetricCard, MetricsRow } from '../../components/Metric'
import Modal from '../../components/Modal'
import SearchInput from '../../components/SearchInput'
import { TableSkeleton } from '../../components/Skeleton'
import { db } from '../../lib/firebase'
import MaterialNombre from '../almacen/MaterialNombre'
import { recibirOrdenCompra, revertirRecepcion } from '../almacen/stockActions'
import { useMateriales } from '../almacen/useMateriales'
import { useOrdenesFabricacion } from '../produccion/useOrdenesFabricacion'
import { exportCsv } from '../../lib/exportCsv'
import { estaVencido } from '../../lib/plazos'
import { useToast } from '../../lib/ToastContext'
import AbrirOFModal from './AbrirOFModal'
import NuevaOrdenCompraModal from './NuevaOrdenCompraModal'
import ProveedoresPanel from './ProveedoresPanel'
import ProveedorNombre from './ProveedorNombre'
import { useCotizacionesCotizadas } from './useCotizacionesCotizadas'
import { useOrdenesCompra } from './useOrdenesCompra'
import { useProveedores } from './useProveedores'

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

const OC_BADGE = {
  pendiente: 'bg-amber-100 text-amber-700',
  recibida: 'bg-brand-50 text-brand-800',
}

function plazoTexto(oc) {
  if (oc.fechaCompromiso) {
    return new Date(`${oc.fechaCompromiso}T12:00:00`).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
    })
  }
  return `${oc.plazoEntregaDias} días`
}

function esEsteMes(fecha) {
  const ms = fecha?.toMillis?.()
  if (!ms) return false
  const d = new Date(ms)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

export default function ComprasPage() {
  const { cotizaciones, loading: loadingCotizaciones } = useCotizacionesCotizadas()
  const { ordenes, loading: loadingOrdenes } = useOrdenesCompra()
  const { ordenes: ordenesFabricacion } = useOrdenesFabricacion()
  const proveedores = useProveedores()
  const { materiales } = useMateriales()
  const [cotizacionParaOF, setCotizacionParaOF] = useState(null)
  const [ocModalOpen, setOcModalOpen] = useState(false)
  const [ocParaEditar, setOcParaEditar] = useState(null)
  const [ocDocumentosId, setOcDocumentosId] = useState(null)
  const [recibiendoId, setRecibiendoId] = useState(null)
  const [revirtiendoId, setRevirtiendoId] = useState(null)
  const [eliminandoId, setEliminandoId] = useState(null)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todas')
  const ocDocumentos = ordenes.find((o) => o.id === ocDocumentosId) ?? null
  const toast = useToast()

  const nombreProveedor = useMemo(() => {
    const map = new Map(proveedores.map((p) => [p.id, p.nombre]))
    return (id) => map.get(id) ?? ''
  }, [proveedores])

  const nombreMaterial = useMemo(() => {
    const map = new Map(materiales.map((m) => [m.id, m.nombre]))
    return (id) => map.get(id) ?? ''
  }, [materiales])

  const numeroSerieOF = useMemo(() => {
    const map = new Map(ordenesFabricacion.map((of) => [of.id, of.numeroSerie]))
    return (ofId) => map.get(ofId) ?? null
  }, [ordenesFabricacion])

  const ordenesFiltradas = useMemo(
    () =>
      ordenes
        .filter((oc) => filtroEstado === 'todas' || oc.estado === filtroEstado)
        .filter((oc) =>
          nombreProveedor(oc.proveedorId).toLowerCase().includes(search.toLowerCase().trim()),
        ),
    [ordenes, search, filtroEstado, nombreProveedor],
  )

  const metrics = useMemo(() => {
    const pendientes = ordenes.filter((o) => o.estado === 'pendiente').length
    const recibidasEsteMes = ordenes.filter(
      (o) => o.estado === 'recibida' && esEsteMes(o.fecha),
    ).length
    const proveedoresActivos = new Set(ordenes.map((o) => o.proveedorId)).size
    const materialesDistintos = new Set(
      ordenes.flatMap((o) => (o.materiales ?? []).map((l) => l.materialId)),
    ).size
    return { pendientes, recibidasEsteMes, proveedoresActivos, materialesDistintos }
  }, [ordenes])

  const exportarOc = () => {
    exportCsv(`ordenes_compra_${new Date().toISOString().slice(0, 10)}.csv`, ordenesFiltradas, [
      { label: 'Proveedor', value: (oc) => nombreProveedor(oc.proveedorId) },
      {
        label: 'Materiales',
        value: (oc) =>
          (oc.materiales ?? [])
            .map((l) => `${l.cantidad}x ${nombreMaterial(l.materialId)}`)
            .join('; '),
      },
      { label: 'Plazo (días)', value: (oc) => oc.plazoEntregaDias },
      { label: 'Fecha comprometida', value: (oc) => oc.fechaCompromiso ?? '' },
      { label: 'Monto total', value: (oc) => oc.montoTotal ?? '' },
      { label: 'Estado', value: (oc) => oc.estado },
    ])
  }

  const revertir = async (oc) => {
    setRevirtiendoId(oc.id)
    try {
      await revertirRecepcion(oc)
      toast('O.C. regresada a pendiente — stock ajustado')
    } catch {
      toast('No se pudo revertir. Intenta de nuevo.', 'error')
    } finally {
      setRevirtiendoId(null)
    }
  }

  const eliminarOC = async (oc) => {
    const advertencia =
      oc.estado === 'recibida'
        ? '¿Eliminar esta O.C.? Se restará el stock que sumó y no se puede deshacer.'
        : '¿Eliminar esta O.C.? No se puede deshacer.'
    if (!window.confirm(advertencia)) return
    setEliminandoId(oc.id)
    try {
      if (oc.estado === 'recibida') {
        await revertirRecepcion(oc)
      }
      await deleteDoc(doc(db, 'ordenesCompra', oc.id))
      toast('O.C. eliminada')
    } catch {
      toast('No se pudo eliminar. Intenta de nuevo.', 'error')
    } finally {
      setEliminandoId(null)
    }
  }

  const marcarRecibida = async (oc) => {
    setRecibiendoId(oc.id)
    try {
      await recibirOrdenCompra(oc)
      toast('O.C. recibida — stock actualizado', 'success', {
        onUndo: () => revertir(oc),
      })
    } catch {
      toast('No se pudo marcar como recibida. Intenta de nuevo.', 'error')
    } finally {
      setRecibiendoId(null)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <MetricsRow>
        <MetricCard
          label="O.C. pendientes"
          value={metrics.pendientes}
          variant="warn"
          onClick={() => setFiltroEstado('pendiente')}
        />
        <MetricCard label="Recibidas este mes" value={metrics.recibidasEsteMes} variant="brandLight" />
        <MetricCard label="Proveedores activos" value={metrics.proveedoresActivos} />
        <MetricCard label="Materiales distintos" value={metrics.materialesDistintos} />
      </MetricsRow>

      <section>
        <h1 className="mb-3 text-xl font-semibold text-ink">Cotizaciones por abrir OF</h1>
        <div className="overflow-x-auto border border-line-strong bg-surface">
          <table className="hidden w-full text-left text-sm lg:table">
            <thead className="bg-surface-2 text-[0.625rem] font-mono uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Entrega comprometida</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="stagger divide-y divide-line">
              {loadingCotizaciones && <TableSkeleton rows={2} cols={4} />}
              {!loadingCotizaciones && cotizaciones.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      icon={ClipboardList}
                      title="No hay cotizaciones esperando OF"
                      subtitle="Aparecerán aquí cuando Ventas cotice a un cliente"
                    />
                  </td>
                </tr>
              )}
              {cotizaciones.map((cot) => (
                <tr key={cot.id} className="transition-colors hover:bg-surface-2">
                  <td className="px-4 py-3 font-medium text-ink">{cot.cliente}</td>
                  <td className="px-4 py-3 text-ink-dim">{currency.format(cot.monto ?? 0)}</td>
                  <td className="px-4 py-3 text-ink-dim">{cot.entregaSemanas} sem.</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" onClick={() => setCotizacionParaOF(cot)}>
                      Abrir OF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="divide-y divide-line lg:hidden">
            {loadingCotizaciones && (
              <div className="flex flex-col gap-2.5 p-4">
                <div className="skeleton h-4 w-2/3 rounded-md" />
                <div className="skeleton h-4 w-1/3 rounded-md" />
              </div>
            )}
            {!loadingCotizaciones && cotizaciones.length === 0 && (
              <EmptyState
                icon={ClipboardList}
                title="No hay cotizaciones esperando OF"
                subtitle="Aparecerán aquí cuando Ventas cotice a un cliente"
              />
            )}
            {cotizaciones.map((cot) => (
              <div key={cot.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{cot.cliente}</p>
                  <p className="text-sm text-ink-faint">
                    {currency.format(cot.monto ?? 0)} · {cot.entregaSemanas} sem.
                  </p>
                </div>
                <Button size="sm" className="shrink-0" onClick={() => setCotizacionParaOF(cot)}>
                  Abrir OF
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-ink">Órdenes de compra</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={exportarOc}
              className="inline-flex items-center gap-1.5"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button
              onClick={() => setOcModalOpen(true)}
              className="inline-flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Nueva O.C.
            </Button>
          </div>
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por proveedor…" />
        <div className="mb-3 flex flex-wrap gap-1.5">
          {[
            { value: 'todas', label: 'Todas' },
            { value: 'pendiente', label: 'Pendiente' },
            { value: 'recibida', label: 'Recibida' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFiltroEstado(opt.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filtroEstado === opt.value
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface-2 text-ink-dim hover:bg-line'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto border border-line-strong bg-surface">
          <table className="hidden w-full text-left text-sm lg:table">
            <thead className="bg-surface-2 text-[0.625rem] font-mono uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Materiales</th>
                <th className="px-4 py-3">Plazo</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="stagger divide-y divide-line">
              {loadingOrdenes && <TableSkeleton rows={2} cols={6} />}
              {!loadingOrdenes && ordenesFiltradas.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={PackageCheck}
                      title={search ? 'Sin resultados' : 'Sin órdenes de compra todavía'}
                      subtitle={search ? 'Prueba con otro proveedor' : 'Crea la primera con "Nueva O.C."'}
                    />
                  </td>
                </tr>
              )}
              {ordenesFiltradas.map((oc) => (
                <tr key={oc.id} className="transition-colors hover:bg-surface-2">
                  <td className="px-4 py-3 font-medium text-ink">
                    <ProveedorNombre proveedorId={oc.proveedorId} />
                    {oc.ofId && (
                      <p className="text-xs font-normal text-ink-faint">
                        OF {numeroSerieOF(oc.ofId) ?? '—'}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-dim">
                    <ul className="flex flex-col gap-0.5">
                      {(oc.materiales ?? []).map((linea, i) => (
                        <li key={i} className="whitespace-nowrap">
                          <span className="font-medium text-ink">{linea.cantidad}×</span>{' '}
                          <MaterialNombre materialId={linea.materialId} />
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3 text-ink-dim">{plazoTexto(oc)}</td>
                  <td className="px-4 py-3 text-ink-dim">
                    {oc.montoTotal ? currency.format(oc.montoTotal) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          OC_BADGE[oc.estado] ?? 'bg-surface-2 text-ink'
                        }`}
                      >
                        {oc.estado}
                      </span>
                      {oc.estado === 'pendiente' &&
                        estaVencido(oc.fecha, oc.plazoEntregaDias, oc.fechaCompromiso) && (
                        <span
                          title="Plazo vencido"
                          className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          Vencida
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton
                        icon={Paperclip}
                        badge={oc.adjuntos?.length ?? 0}
                        onClick={() => setOcDocumentosId(oc.id)}
                        title="Documentos"
                      />
                      <IconButton
                        icon={Pencil}
                        onClick={() => setOcParaEditar(oc)}
                        title="Editar"
                      />
                      {oc.estado === 'pendiente' && (
                        <Button
                          size="sm"
                          variant="outline"
                          loading={recibiendoId === oc.id}
                          onClick={() => marcarRecibida(oc)}
                          className="ml-1"
                        >
                          {recibiendoId === oc.id ? 'Recibiendo…' : 'Marcar recibida'}
                        </Button>
                      )}
                      {oc.estado === 'recibida' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={revirtiendoId === oc.id}
                          onClick={() => {
                            if (window.confirm('¿Regresar esta O.C. a pendiente? Se restará el stock que sumó.')) {
                              revertir(oc)
                            }
                          }}
                          className="ml-1"
                          title="Revertir a pendiente"
                        >
                          {revirtiendoId === oc.id ? 'Revirtiendo…' : 'Revertir'}
                        </Button>
                      )}
                      <IconButton
                        icon={Trash2}
                        variant="danger"
                        disabled={eliminandoId === oc.id}
                        onClick={() => eliminarOC(oc)}
                        title="Eliminar O.C."
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="divide-y divide-line lg:hidden">
            {loadingOrdenes && (
              <div className="flex flex-col gap-2.5 p-4">
                <div className="skeleton h-4 w-2/3 rounded-md" />
                <div className="skeleton h-4 w-1/3 rounded-md" />
              </div>
            )}
            {!loadingOrdenes && ordenesFiltradas.length === 0 && (
              <EmptyState
                icon={PackageCheck}
                title={search ? 'Sin resultados' : 'Sin órdenes de compra todavía'}
                subtitle={search ? 'Prueba con otro proveedor' : 'Crea la primera con "Nueva O.C."'}
              />
            )}
            {ordenesFiltradas.map((oc) => (
              <div key={oc.id} className="flex flex-col gap-2.5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">
                      <ProveedorNombre proveedorId={oc.proveedorId} />
                    </p>
                    <p className="text-sm text-ink-faint">
                      {oc.montoTotal ? currency.format(oc.montoTotal) : '—'} · {plazoTexto(oc)}
                      {oc.ofId && ` · OF ${numeroSerieOF(oc.ofId) ?? '—'}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <IconButton
                      icon={Paperclip}
                      badge={oc.adjuntos?.length ?? 0}
                      onClick={() => setOcDocumentosId(oc.id)}
                      title="Documentos"
                    />
                    <IconButton icon={Pencil} onClick={() => setOcParaEditar(oc)} title="Editar" />
                  </div>
                </div>

                <ul className="flex flex-col gap-0.5 text-xs text-ink-faint">
                  {(oc.materiales ?? []).map((linea, i) => (
                    <li key={i}>
                      <span className="font-medium text-ink-dim">{linea.cantidad}×</span>{' '}
                      <MaterialNombre materialId={linea.materialId} />
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        OC_BADGE[oc.estado] ?? 'bg-surface-2 text-ink'
                      }`}
                    >
                      {oc.estado}
                    </span>
                    {oc.estado === 'pendiente' &&
                      estaVencido(oc.fecha, oc.plazoEntregaDias, oc.fechaCompromiso) && (
                      <span
                        title="Plazo vencido"
                        className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        Vencida
                      </span>
                    )}
                  </div>
                  {oc.estado === 'pendiente' && (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={recibiendoId === oc.id}
                      onClick={() => marcarRecibida(oc)}
                    >
                      {recibiendoId === oc.id ? 'Recibiendo…' : 'Marcar recibida'}
                    </Button>
                  )}
                  {oc.estado === 'recibida' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={revirtiendoId === oc.id}
                      onClick={() => {
                        if (window.confirm('¿Regresar esta O.C. a pendiente? Se restará el stock que sumó.')) {
                          revertir(oc)
                        }
                      }}
                      title="Revertir a pendiente"
                    >
                      {revirtiendoId === oc.id ? 'Revirtiendo…' : 'Revertir'}
                    </Button>
                  )}
                  <IconButton
                    icon={Trash2}
                    variant="danger"
                    disabled={eliminandoId === oc.id}
                    onClick={() => eliminarOC(oc)}
                    title="Eliminar O.C."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProveedoresPanel />

      <AbrirOFModal cotizacion={cotizacionParaOF} onClose={() => setCotizacionParaOF(null)} />
      <NuevaOrdenCompraModal open={ocModalOpen} onClose={() => setOcModalOpen(false)} />
      <NuevaOrdenCompraModal
        open={Boolean(ocParaEditar)}
        onClose={() => setOcParaEditar(null)}
        oc={ocParaEditar}
      />

      <Modal
        open={Boolean(ocDocumentos)}
        onClose={() => setOcDocumentosId(null)}
        title="Documentos de la O.C."
        subtitle={ocDocumentos ? nombreProveedor(ocDocumentos.proveedorId) : ''}
      >
        {ocDocumentos && (
          <Adjuntos
            coleccion="ordenesCompra"
            docId={ocDocumentos.id}
            adjuntos={ocDocumentos.adjuntos}
          />
        )}
      </Modal>
    </div>
  )
}
