import { Factory } from 'lucide-react'
import { useState } from 'react'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import Skeleton from '../../components/Skeleton'
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
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            ESTADO_OF_BADGE[of.estado] ?? 'bg-slate-100 text-slate-700'
          }`}
        >
          {of.estado}
        </span>
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
            onChange={(e) => actualizarAvance(of.id, Number(e.target.value))}
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

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-800">Órdenes de fabricación</h1>

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      )}

      {!loading && ordenes.length === 0 && (
        <EmptyState
          icon={Factory}
          title="No hay órdenes de fabricación todavía"
          subtitle="Se crean desde Compras al abrir una OF"
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ordenes.map((of) => (
          <OrdenFabricacionCard key={of.id} of={of} />
        ))}
      </div>
    </div>
  )
}
