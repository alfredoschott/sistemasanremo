import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { useState } from 'react'
import { db } from '../../lib/firebase'
import ProveedorPicker from './ProveedorPicker'

const lineaVacia = { nombre: '', cantidad: '1' }

export default function NuevaOrdenCompraModal({ open, onClose }) {
  const [proveedorId, setProveedorId] = useState('')
  const [plazoEntregaDias, setPlazoEntregaDias] = useState('20')
  const [materiales, setMateriales] = useState([{ ...lineaVacia }])
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const updateLinea = (index, field) => (e) => {
    setMateriales((prev) =>
      prev.map((linea, i) => (i === index ? { ...linea, [field]: e.target.value } : linea)),
    )
  }

  const addLinea = () => setMateriales((prev) => [...prev, { ...lineaVacia }])
  const removeLinea = (index) =>
    setMateriales((prev) => prev.filter((_, i) => i !== index))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await addDoc(collection(db, 'ordenesCompra'), {
        proveedorId,
        plazoEntregaDias: Number(plazoEntregaDias),
        materiales: materiales
          .filter((l) => l.nombre.trim())
          .map((l) => ({ nombre: l.nombre.trim(), cantidad: Number(l.cantidad) || 1 })),
        estado: 'pendiente',
        fecha: serverTimestamp(),
      })
      setProveedorId('')
      setMateriales([{ ...lineaVacia }])
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Nueva orden de compra</h2>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="text-sm font-medium text-slate-600">
            Proveedor
            <ProveedorPicker value={proveedorId} onChange={setProveedorId} />
          </label>

          <label className="text-sm font-medium text-slate-600">
            Plazo de entrega (días)
            <input
              required
              type="number"
              min="1"
              value={plazoEntregaDias}
              onChange={(e) => setPlazoEntregaDias(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <div>
            <span className="text-sm font-medium text-slate-600">Materiales</span>
            <div className="mt-1 flex flex-col gap-2">
              {materiales.map((linea, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={linea.nombre}
                    onChange={updateLinea(index, 'nombre')}
                    placeholder="Material"
                    className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    min="1"
                    value={linea.cantidad}
                    onChange={updateLinea(index, 'cantidad')}
                    className="w-20 rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  {materiales.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLinea(index)}
                      className="px-2 text-slate-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addLinea}
              className="mt-2 text-sm font-medium text-brand-700 hover:underline"
            >
              + Agregar material
            </button>
          </div>

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
              {saving ? 'Guardando…' : 'Crear O.C.'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
