import {
  Archive,
  AlertTriangle,
  ArchiveRestore,
  Boxes,
  ClipboardList,
  Download,
  Factory,
  Plus,
  Printer,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import IconButton from '../../components/IconButton'
import { MetricCard, MetricsRow } from '../../components/Metric'
import SearchInput from '../../components/SearchInput'
import Skeleton from '../../components/Skeleton'
import { exportCsv } from '../../lib/exportCsv'
import { imprimirComoPdf } from '../../lib/imprimir'
import { useToast } from '../../lib/ToastContext'
import { useMateriales } from '../almacen/useMateriales'
import { useProveedores } from '../compras/useProveedores'
import ProveedorNombre from '../compras/ProveedorNombre'
import AgregarProveedorOFModal from './AgregarProveedorOFModal'
import {
  actualizarAvance,
  archivarOF,
  completarYFacturar,
  desarchivarOF,
  deshacerCompletarYFacturar,
  deshacerIniciarProduccion,
  eliminarOF,
  iniciarProduccion,
  quitarProveedorDeOF,
} from './ofActions'
import MaterialesOFModal from './MaterialesOFModal'
import OrdenFabricacionImprimible from './OrdenFabricacionImprimible'
import { ofVencida, proveedoresDe } from './proveedoresOF'
import { useOrdenesFabricacion } from './useOrdenesFabricacion'

const ESTADO_OF_BADGE = {
  Abierta: 'bg-amber-100 text-amber-700',
  'En producción': 'bg-blue-100 text-blue-700',
  Completada: 'bg-brand-50 text-brand-800',
}

function OrdenFabricacionCard({ of, viendoArchivadas, onImprimir, onVerMateriales, materiales }) {
  const [busy, setBusy] = useState(false)
  const [agregandoProveedor, setAgregandoProveedor] = useState(false)
  const toast = useToast()
  const proveedoresOF = proveedoresDe(of)
  const puedeEditarProveedores = of.estado !== 'Completada'
  const materialesRequeridos = of.materialesRequeridos ?? []
  const materialesFaltantes = materialesRequeridos.filter((l) => {
    const pendiente = Math.max(0, l.cantidadPlan - (l.cantidadConsumida ?? 0))
    const disponible = materiales.find((m) => m.id === l.materialId)?.stock ?? 0
    return pendiente > disponible
  }).length

  const runAction = async (action, message, onUndo) => {
    setBusy(true)
    try {
      await action()
      if (message) toast(message, 'success', { onUndo })
    } catch {
      toast('No se pudo completar la acción. Intenta de nuevo.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const archivar = () =>
    runAction(
      () => archivarOF(of),
      `${of.numeroSerie} archivada`,
      () => desarchivarOF(of),
    )

  const desarchivar = () => runAction(() => desarchivarOF(of), `${of.numeroSerie} restaurada`)

  const quitarProveedor = (index) => {
    if (!window.confirm('¿Quitar este proveedor de la OF? Si ya tenía una O.C. generada, esa no se toca.'))
      return
    runAction(() => quitarProveedorDeOF(of, index), 'Proveedor quitado')
  }

  const eliminar = () => {
    if (
      !window.confirm(
        `¿Eliminar definitivamente la OF ${of.numeroSerie}? La cotización de ${of.cliente} regresará a "Cotizado". Esto no se puede deshacer.`,
      )
    )
      return
    runAction(() => eliminarOF(of), `${of.numeroSerie} eliminada`)
  }

  const regresarAAbierta = () => {
    if (!window.confirm(`¿Regresar ${of.numeroSerie} a "Abierta"? Se perderá el avance registrado.`))
      return
    runAction(() => deshacerIniciarProduccion(of), `${of.numeroSerie} regresada a "Abierta"`)
  }

  const regresarAProduccion = async () => {
    if (!window.confirm(`¿Regresar ${of.numeroSerie} a "En producción"? Deshace la facturación.`))
      return
    setBusy(true)
    try {
      await deshacerCompletarYFacturar(of)
      toast(`${of.numeroSerie} regresada a "En producción"`)
    } catch (err) {
      if (err.message === 'ya-cobrada') {
        toast('Primero deshaz el cobro de esta cotización en Finanzas.', 'error')
      } else {
        toast('No se pudo completar la acción. Intenta de nuevo.', 'error')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="group rounded-lg border border-line bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-faint">{of.numeroSerie}</p>
          <h3 className="text-lg font-semibold text-ink">{of.cliente}</h3>
          {of.modelos?.length > 0 && (
            <p className="text-xs text-ink-faint">{of.modelos.join(', ')}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                ESTADO_OF_BADGE[of.estado] ?? 'bg-surface-2 text-ink'
              }`}
            >
              {of.estado}
            </span>
            <IconButton
              icon={Boxes}
              badge={materialesFaltantes}
              onClick={onVerMateriales}
              title="Materiales de la OF"
            />
            <IconButton
              icon={Printer}
              onClick={onImprimir}
              title="Imprimir / guardar como PDF"
            />
            {of.estado !== 'Completada' && (
              <IconButton
                icon={Trash2}
                variant="danger"
                onClick={eliminar}
                disabled={busy}
                title="Eliminar OF"
              />
            )}
          </div>
          {of.estado !== 'Completada' && ofVencida(of) && (
            <span
              title="Plazo del proveedor vencido"
              className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
            >
              <AlertTriangle className="h-3 w-3" />
              Vencida
            </span>
          )}
        </div>
      </div>

      <div className="mb-4 text-sm">
        <dt className="text-ink-faint">{proveedoresOF.length > 1 ? 'Proveedores' : 'Proveedor'}</dt>
        {proveedoresOF.length === 0 ? (
          <dd className="text-ink-dim">Sin proveedor asignado</dd>
        ) : (
          <dd className="mt-1 flex flex-col gap-1 text-ink">
            {proveedoresOF.map((p, i) => (
              <span key={i} className="flex items-center gap-1">
                <span>
                  <ProveedorNombre proveedorId={p.proveedorId} />
                  {p.fechaCompromiso ? (
                    <span className="text-ink-faint">
                      {' '}
                      · llega {new Date(`${p.fechaCompromiso}T12:00:00`).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  ) : p.plazoEntregaDias ? (
                    <span className="text-ink-faint"> · {p.plazoEntregaDias} días</span>
                  ) : null}
                </span>
                {puedeEditarProveedores && (
                  <IconButton
                    icon={X}
                    variant="danger"
                    onClick={() => quitarProveedor(i)}
                    disabled={busy}
                    title="Quitar proveedor"
                    className="h-5 w-5 p-0.5"
                  />
                )}
              </span>
            ))}
          </dd>
        )}
        {puedeEditarProveedores && (
          <button
            type="button"
            onClick={() => setAgregandoProveedor(true)}
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-green-700 transition-colors hover:text-green-800 hover:underline"
          >
            <Plus className="h-3 w-3" />
            Agregar proveedor
          </button>
        )}
      </div>

      <AgregarProveedorOFModal
        of={agregandoProveedor ? of : null}
        onClose={() => setAgregandoProveedor(false)}
      />

      {of.estado === 'Abierta' && (
        <Button
          className="w-full"
          loading={busy}
          onClick={() =>
            runAction(
              () => iniciarProduccion(of),
              `${of.numeroSerie} en producción`,
              () => deshacerIniciarProduccion(of),
            )
          }
        >
          Iniciar producción
        </Button>
      )}

      {of.estado === 'En producción' && (
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-ink-faint">
            <span>Avance</span>
            <div className="flex items-center gap-1">
              <span>{of.avance ?? 0}%</span>
              <IconButton
                icon={Undo2}
                disabled={busy}
                onClick={regresarAAbierta}
                title='Regresar a "Abierta"'
                className="h-5 w-5 p-0.5"
              />
            </div>
          </div>
          <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full bg-green-600 transition-all duration-300 ease-out"
              style={{ width: `${of.avance ?? 0}%` }}
            />
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={of.avance ?? 0}
            disabled={busy}
            onChange={(e) =>
              actualizarAvance(of, Number(e.target.value)).catch(() =>
                toast('No se pudo actualizar el avance.', 'error'),
              )
            }
            className="mb-3 w-full accent-green-600"
          />
          <Button
            className="w-full"
            loading={busy}
            onClick={() =>
              runAction(
                () => completarYFacturar(of),
                `${of.numeroSerie} completada y facturada`,
                () => deshacerCompletarYFacturar(of),
              )
            }
          >
            Completar y facturar
          </Button>
        </div>
      )}

      {of.estado === 'Completada' && (
        <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
          <p className="text-sm text-ink-faint">Facturada — proceso completo.</p>
          <div className="flex items-center gap-1">
            <IconButton
              icon={Undo2}
              disabled={busy}
              onClick={regresarAProduccion}
              title='Regresar a "En producción"'
            />
            {viendoArchivadas ? (
              <IconButton
                icon={ArchiveRestore}
                onClick={desarchivar}
                disabled={busy}
                title="Restaurar a la lista principal"
              />
            ) : (
              <IconButton icon={Archive} onClick={archivar} disabled={busy} title="Archivar" />
            )}
            <IconButton
              icon={Trash2}
              variant="danger"
              onClick={eliminar}
              disabled={busy}
              title="Eliminar definitivamente"
            />
          </div>
        </div>
      )}
    </div>
  )
}

const ESTADOS_FILTRO_OF = ['Todas', 'Abierta', 'En producción', 'Completada']

export default function ProduccionPage() {
  const { ordenes, loading } = useOrdenesFabricacion()
  const proveedores = useProveedores()
  const { materiales } = useMateriales()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [viendoArchivadas, setViendoArchivadas] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState('Todas')
  const [printingOF, setPrintingOF] = useState(null)
  const [materialesOF, setMaterialesOF] = useState(null)

  const nombreProveedor = useMemo(() => {
    const map = new Map(proveedores.map((p) => [p.id, p.nombre]))
    return (id) => map.get(id) ?? ''
  }, [proveedores])

  // Al mandar imprimir una OF, el documento imprimible (oculto en
  // pantalla, ver OrdenFabricacionImprimible) ya está montado con esa OF
  // porque printingOF cambió — solo falta abrir el diálogo de impresión.
  useEffect(() => {
    if (!printingOF) return
    imprimirComoPdf(`OF ${printingOF.cliente} ${printingOF.numeroSerie}`)
    const limpiar = () => setPrintingOF(null)
    window.addEventListener('afterprint', limpiar, { once: true })
    return () => window.removeEventListener('afterprint', limpiar)
  }, [printingOF])

  const archivadas = useMemo(() => ordenes.filter((of) => of.archivada), [ordenes])

  // Con varias OF abiertas, en producción y completadas a la vez, mezcladas
  // solo por fecha de creación, las activas se pierden entre las que ya
  // terminaron — por eso el filtro por estado, igual que en Ventas. Y las
  // ya "Completada" se hunden al final de su grupo (en vez de eliminarse
  // por completo requieren archivarse a mano o solas a los 30 días).
  const ordenesFiltradas = useMemo(
    () =>
      ordenes
        .filter((of) => Boolean(of.archivada) === viendoArchivadas)
        .filter((of) => filtroEstado === 'Todas' || of.estado === filtroEstado)
        .filter((of) => {
          const texto = `${of.cliente ?? ''} ${of.numeroSerie ?? ''}`.toLowerCase()
          return texto.includes(search.toLowerCase().trim())
        })
        .sort((a, b) => (a.estado === 'Completada' ? 1 : 0) - (b.estado === 'Completada' ? 1 : 0)),
    [ordenes, search, viendoArchivadas, filtroEstado],
  )

  const hayFiltrosActivos = filtroEstado !== 'Todas' || Boolean(search)

  const exportar = () => {
    exportCsv(`ordenes_fabricacion_${new Date().toISOString().slice(0, 10)}.csv`, ordenesFiltradas, [
      { label: 'Número de serie', value: (of) => of.numeroSerie },
      { label: 'Cliente', value: (of) => of.cliente },
      {
        label: 'Proveedores',
        value: (of) =>
          proveedoresDe(of)
            .map(
              (p) =>
                `${nombreProveedor(p.proveedorId)} (${p.fechaCompromiso ?? `${p.plazoEntregaDias ?? '?'}d`})`,
            )
            .join('; '),
      },
      { label: 'Estado', value: (of) => of.estado },
      { label: 'Avance %', value: (of) => of.avance ?? 0 },
    ])
  }

  const metrics = useMemo(() => {
    const activas = ordenes.filter((of) => !of.archivada)
    const enProduccion = activas.filter((of) => of.estado === 'En producción')
    const abiertas = activas.filter((of) => of.estado === 'Abierta').length
    const completadas = activas.filter((of) => of.estado === 'Completada').length
    const avancePromedio = enProduccion.length
      ? Math.round(
          enProduccion.reduce((sum, of) => sum + (of.avance ?? 0), 0) / enProduccion.length,
        )
      : 0
    return { enProduccion: enProduccion.length, abiertas, completadas, avancePromedio }
  }, [ordenes])

  return (
    <>
    <div className={printingOF ? 'print:hidden' : ''}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-ink">Órdenes de fabricación</h1>
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
          <Link
            to="/produccion/listas-materiales"
            className="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3.5 py-2 text-sm font-medium text-ink-dim transition-colors hover:bg-surface-2"
          >
            <ClipboardList className="h-4 w-4" />
            Listas de materiales
          </Link>
          <Button variant="secondary" onClick={exportar} className="inline-flex items-center gap-1.5">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <MetricsRow>
        <MetricCard
          label="Abiertas"
          value={metrics.abiertas}
          onClick={() => setFiltroEstado('Abierta')}
        />
        <MetricCard
          label="En producción"
          value={metrics.enProduccion}
          variant="warn"
          onClick={() => setFiltroEstado('En producción')}
        />
        <MetricCard label="Avance promedio" value={`${metrics.avancePromedio}%`} />
        <MetricCard
          label="Completadas"
          value={metrics.completadas}
          variant="green"
          onClick={() => setFiltroEstado('Completada')}
        />
      </MetricsRow>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar por cliente o número de serie…" />

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap gap-1.5">
          {ESTADOS_FILTRO_OF.map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filtroEstado === estado
                  ? 'bg-green-600 text-white'
                  : 'bg-surface-2 text-ink-dim hover:bg-line'
              }`}
            >
              {estado}
            </button>
          ))}
        </div>
        {hayFiltrosActivos && (
          <button
            onClick={() => {
              setFiltroEstado('Todas')
              setSearch('')
            }}
            className="text-xs font-medium text-ink-faint hover:text-ink-dim hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {loading && (
        <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      )}

      {!loading && ordenesFiltradas.length === 0 && (
        <EmptyState
          icon={Factory}
          title={
            search
              ? 'Sin resultados'
              : viendoArchivadas
                ? 'No hay órdenes archivadas'
                : 'No hay órdenes de fabricación todavía'
          }
          subtitle={
            search
              ? 'Prueba con otro cliente'
              : viendoArchivadas
                ? 'Las OF completadas que archives aparecerán aquí'
                : 'Se crean desde Compras al abrir una OF'
          }
        />
      )}

      <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ordenesFiltradas.map((of) => (
          <OrdenFabricacionCard
            key={of.id}
            of={of}
            viendoArchivadas={viendoArchivadas}
            onImprimir={() => setPrintingOF(of)}
            onVerMateriales={() => setMaterialesOF(of.id)}
            materiales={materiales}
          />
        ))}
      </div>
    </div>

    <OrdenFabricacionImprimible of={printingOF} nombreProveedor={nombreProveedor} />
    <MaterialesOFModal
      // Se busca en `ordenes` (no se guarda el objeto directo) para que el
      // modal siga viendo el consumo actualizado en vivo mientras está
      // abierto, en vez de quedarse con la copia de cuando se abrió.
      of={ordenes.find((of) => of.id === materialesOF) ?? null}
      onClose={() => setMaterialesOF(null)}
    />
    </>
  )
}
