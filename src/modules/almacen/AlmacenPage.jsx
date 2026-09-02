import { doc, updateDoc } from 'firebase/firestore'
import { useState } from 'react'
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
      className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
    />
  )
}

export default function AlmacenPage() {
  const { materiales, loading } = useMateriales()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Materiales</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
        >
          + Movimiento
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
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
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && materiales.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Sin materiales todavía. Se crean desde aquí o al armar una O.C.
                </td>
              </tr>
            )}
            {materiales.map((material) => {
              const bajoMinimo = (material.stock ?? 0) < (material.minimo ?? 0)
              return (
                <tr key={material.id}>
                  <td className="px-4 py-3 font-medium text-slate-700">{material.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{material.stock ?? 0}</td>
                  <td className="px-4 py-3">
                    <MinimoInput material={material} />
                  </td>
                  <td className="px-4 py-3">
                    {bajoMinimo && (
                      <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
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
