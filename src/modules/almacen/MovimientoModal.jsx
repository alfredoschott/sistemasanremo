import { useState } from 'react'
import MaterialPicker from './MaterialPicker'
import { registrarMovimientoManual } from './stockActions'

export default function MovimientoModal({ open, onClose }) {
  const [materialId, setMaterialId] = useState('')
  const [tipo, setTipo] = useState('entrada')
  const [cantidad, setCantidad] = useState('1')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await registrarMovimientoManual({ materialId, tipo, cantidad: Number(cantidad) })
      setMaterialId('')
      setCantidad('1')
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Movimiento de almacén</h2>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="text-sm font-medium text-slate-600">
            Material
            <div className="mt-1">
              <MaterialPicker value={materialId} onChange={setMaterialId} />
            </div>
          </label>

          <fieldset className="text-sm font-medium text-slate-600">
            Tipo
            <div className="mt-1 flex gap-4">
              <label className="flex items-center gap-1.5 font-normal">
                <input
                  type="radio"
                  name="tipo"
                  value="entrada"
                  checked={tipo === 'entrada'}
                  onChange={(e) => setTipo(e.target.value)}
                />
                Entrada
              </label>
              <label className="flex items-center gap-1.5 font-normal">
                <input
                  type="radio"
                  name="tipo"
                  value="salida"
                  checked={tipo === 'salida'}
                  onChange={(e) => setTipo(e.target.value)}
                />
                Salida
              </label>
            </div>
          </fieldset>

          <label className="text-sm font-medium text-slate-600">
            Cantidad
            <input
              required
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
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
              disabled={saving || !materialId}
              className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
