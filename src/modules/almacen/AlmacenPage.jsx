import { doc, updateDoc } from 'firebase/firestore'
import { AlertTriangle, Boxes, Plus } from 'lucide-react'
import { useState } from 'react'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import { TableSkeleton } from '../../components/Skeleton'
import { db } from '../../lib/firebase'
import MovimientoModal from './MovimientoModal'
import { useMateriales } from './useMateriales'

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

export default function AlmacenPage() {
  const { materiales, loading } = useMateriales()
  const [modalOpen, setModalOpen] = useState(false)

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
                  <td className="px-4 py-3 font-medium text-slate-700">{material.nombre}</td>
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
