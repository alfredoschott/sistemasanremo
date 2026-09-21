import { Archive, ClipboardList, Download, Factory } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import { MetricCard, MetricsRow } from '../../components/Metric'
import SearchInput from '../../components/SearchInput'
import Skeleton from '../../components/Skeleton'
import { exportCsv } from '../../lib/exportCsv'
import { imprimirComoPdf } from '../../lib/imprimir'
import { useMateriales } from '../almacen/useMateriales'
import { useProveedores } from '../compras/useProveedores'
import MaterialesOFModal from './MaterialesOFModal'
import OrdenFabricacionCard from './OrdenFabricacionCard'
import OrdenFabricacionImprimible from './OrdenFabricacionImprimible'
import { proveedoresDe } from './proveedoresOF'
import { useOrdenesFabricacion } from './useOrdenesFabricacion'

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
