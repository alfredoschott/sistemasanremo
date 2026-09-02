import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { useState } from 'react'
import { db } from '../../lib/firebase'
import ProveedorPicker from './ProveedorPicker'

function generarNumeroSerie() {
  const year = new Date().getFullYear()
  const suffix = Date.now().toString().slice(-6)
  return `OF-${year}-${suffix}`
}

export default function AbrirOFModal({ cotizacion, onClose }) {
  const [proveedorId, setProveedorId] = useState('')
  const [plazoEntregaDias, setPlazoEntregaDias] = useState('20')
  const [saving, setSaving] = useState(false)

  if (!cotizacion) return null

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const numeroSerie = generarNumeroSerie()
      const cotizacionRef = doc(db, 'cotizaciones', cotizacion.id)
      const ofRef = doc(collection(db, 'ordenesFabricacion'))

      const batch = writeBatch(db)
      batch.set(ofRef, {
        numeroSerie,
        cotizacionId: cotizacion.id,
        cliente: cotizacion.cliente,
        proveedorId,
        plazoEntregaDias: Number(plazoEntregaDias),
        estado: 'Abierta',
        fecha: serverTimestamp(),
      })
      batch.update(cotizacionRef, { estado: 'OF abierta', ofId: ofRef.id, numeroSerie })
      await batch.commit()

      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-slate-800">Abrir orden de fabricación</h2>
        <p className="mb-4 text-sm text-slate-500">{cotizacion.cliente}</p>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="text-sm font-medium text-slate-600">
            Proveedor de materiales
            <ProveedorPicker value={proveedorId} onChange={setProveedorId} />
          </label>

          <label className="text-sm font-medium text-slate-600">
            Plazo de entrega del proveedor (días)
            <input
              required
              type="number"
              min="15"
              max="30"
              value={plazoEntregaDias}
              onChange={(e) => setPlazoEntregaDias(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !proveedorId}
              className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
            >
              {saving ? 'Abriendo…' : 'Abrir OF'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
