import { doc, updateDoc } from 'firebase/firestore'
import { AlertTriangle, Boxes, Check, Pencil, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import { MetricCard, MetricsRow } from '../../components/Metric'
import { TableSkeleton } from '../../components/Skeleton'
import { db } from '../../lib/firebase'
import MovimientoModal from './MovimientoModal'
import { useMateriales } from './useMateriales'
import { useMovimientosHoy } from './useMovimientosHoy'

function MinimoInput({ material }) {
  const [value, setValue] = useState(material.minimo ?? 0)

  const commit = () => {
    const minimo = Number(value) || 0
    if (minimo !== material.minimo) {
      updateDoc(doc(db, 'materiales', material.id), { minimo })
    }
  }

  return (
    <input
      type="number"
      min="0"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
    />
  )
}

function NombreEditable({ material }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(material.nombre)

  const commit = () => {
    const nombre = value.trim()
    setEditing(false)
    if (nombre && nombre !== material.nombre) {
      updateDoc(doc(db, 'materiales', material.id), { nombre })
    } else {
      setValue(material.nombre)
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        />
        <button onClick={commit} className="text-brand-700 hover:text-brand-800">
          <Check className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group inline-flex items-center gap-1.5 font-medium text-slate-700"
    >
      {material.nombre}
      <Pencil className="h-3 w-3 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}

export default function AlmacenPage() {
  const { materiales, loading } = useMateriales()
  const movimientosHoy = useMovimientosHoy()
  const [modalOpen, setModalOpen] = useState(false)

  const metrics = useMemo(() => {
    const critico = materiales.filter((m) => (m.stock ?? 0) <= 0).length
    const bajo = materiales.filter((m) => (m.stock ?? 0) > 0 && (m.stock ?? 0) < (m.minimo ?? 0)).length
    return { critico, bajo, total: materiales.length }
  }, [materiales])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Materiales</h1>
          <p className="text-sm text-slate-500">{materiales.length} en catálogo</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-1.5">
          <Plus className="h-4 w-4" />
          Movimiento
        </Button>
      </div>

      <MetricsRow>
        <MetricCard label="Estado crítico" value={metrics.critico} variant="danger" />
        <MetricCard label="Stock bajo" value={metrics.bajo} variant="warn" />
        <MetricCard label="Materiales totales" value={metrics.total} />
        <MetricCard label="Movimientos hoy" value={movimientosHoy} variant="accent" />
      </MetricsRow>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Material</th>
              <th className="px-4 py-3">Stock actual</th>
              <th className="px-4 py-3">Mínimo</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <TableSkeleton rows={3} cols={4} />}
            {!loading && materiales.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <EmptyState
                    icon={Boxes}
                    title="Sin materiales todavía"
                    subtitle="Se crean aquí o al armar una O.C."
                  />
                </td>
              </tr>
            )}
            {materiales.map((material) => {
              const bajoMinimo = (material.stock ?? 0) < (material.minimo ?? 0)
              return (
                <tr key={material.id} className="transition-colors hover:bg-brand-50/40">
                  <td className="px-4 py-3">
                    <NombreEditable material={material} />
                  </td>
                  <td
                    className={`px-4 py-3 font-medium ${bajoMinimo ? 'text-red-600' : 'text-slate-600'}`}
                  >
                    {material.stock ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <MinimoInput material={material} />
                  </td>
                  <td className="px-4 py-3">
                    {bajoMinimo && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                        <AlertTriangle className="h-3 w-3" />
                        Bajo mínimo
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <MovimientoModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
