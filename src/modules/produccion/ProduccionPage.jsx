import { AlertTriangle, Factory, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import { MetricCard, MetricsRow } from '../../components/Metric'
import Skeleton from '../../components/Skeleton'
import { estaVencido } from '../../lib/plazos'
import { useToast } from '../../lib/ToastContext'
import ProveedorNombre from '../compras/ProveedorNombre'
import { actualizarAvance, completarYFacturar, iniciarProduccion } from './ofActions'
import { useOrdenesFabricacion } from './useOrdenesFabricacion'

const ESTADO_OF_BADGE = {
  Abierta: 'bg-amber-100 text-amber-700',
  'En producción': 'bg-blue-100 text-blue-700',
  Completada: 'bg-brand-50 text-brand-800',
}

function OrdenFabricacionCard({ of }) {
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  const runAction = async (action, message) => {
    setBusy(true)
    try {
      await action()
      if (message) toast(message)
    } catch {
      toast('No se pudo completar la acción. Intenta de nuevo.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{of.numeroSerie}</p>
          <h3 className="text-lg font-semibold text-slate-800">{of.cliente}</h3>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
              ESTADO_OF_BADGE[of.estado] ?? 'bg-slate-100 text-slate-700'
            }`}
          >
            {of.estado}
          </span>
          {of.estado !== 'Completada' && estaVencido(of.fecha, of.plazoEntregaDias) && (
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

      <dl className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-400">Proveedor</dt>
          <dd className="text-slate-700">
            <ProveedorNombre proveedorId={of.proveedorId} />
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Plazo proveedor</dt>
          <dd className="text-slate-700">{of.plazoEntregaDias} días</dd>
        </div>
      </dl>

      {of.estado === 'Abierta' && (
        <Button
          className="w-full"
          disabled={busy}
          onClick={() =>
            runAction(() => iniciarProduccion(of), `${of.numeroSerie} en producción`)
          }
        >
          Iniciar producción
        </Button>
      )}

      {of.estado === 'En producción' && (
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
            <span>Avance</span>
            <span>{of.avance ?? 0}%</span>
          </div>
          <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-brand-600 transition-all duration-300 ease-out"
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
              actualizarAvance(of.id, Number(e.target.value)).catch(() =>
                toast('No se pudo actualizar el avance.', 'error'),
              )
            }
            className="mb-3 w-full accent-brand-700"
          />
          <Button
            className="w-full"
            disabled={busy}
            onClick={() =>
              runAction(() => completarYFacturar(of), `${of.numeroSerie} completada y facturada`)
            }
          >
            Completar y facturar
          </Button>
        </div>
      )}

      {of.estado === 'Completada' && (
        <p className="text-center text-sm text-slate-400">Facturada — proceso completo.</p>
      )}
    </div>
  )
}

export default function ProduccionPage() {
  const { ordenes, loading } = useOrdenesFabricacion()
  const [search, setSearch] = useState('')

  const ordenesFiltradas = useMemo(
    () =>
      ordenes.filter((of) => of.cliente?.toLowerCase().includes(search.toLowerCase().trim())),
    [ordenes, search],
  )

  const metrics = useMemo(() => {
    const enProduccion = ordenes.filter((of) => of.estado === 'En producción')
    const abiertas = ordenes.filter((of) => of.estado === 'Abierta').length
    const completadas = ordenes.filter((of) => of.estado === 'Completada').length
    const avancePromedio = enProduccion.length
      ? Math.round(
          enProduccion.reduce((sum, of) => sum + (of.avance ?? 0), 0) / enProduccion.length,
        )
      : 0
    return { enProduccion: enProduccion.length, abiertas, completadas, avancePromedio }
  }, [ordenes])

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-800">Órdenes de fabricación</h1>

      <MetricsRow>
        <MetricCard label="Abiertas" value={metrics.abiertas} />
        <MetricCard label="En producción" value={metrics.enProduccion} variant="warn" />
        <MetricCard label="Avance promedio" value={`${metrics.avancePromedio}%`} />
        <MetricCard label="Completadas" value={metrics.completadas} variant="accent" />
      </MetricsRow>

      <div className="mb-3 flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 sm:max-w-xs">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente…"
          className="w-full text-sm outline-none"
        />
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      )}

      {!loading && ordenesFiltradas.length === 0 && (
        <EmptyState
          icon={Factory}
          title={search ? 'Sin resultados' : 'No hay órdenes de fabricación todavía'}
          subtitle={search ? 'Prueba con otro cliente' : 'Se crean desde Compras al abrir una OF'}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ordenesFiltradas.map((of) => (
          <OrdenFabricacionCard key={of.id} of={of} />
        ))}
      </div>
    </div>
  )
}
