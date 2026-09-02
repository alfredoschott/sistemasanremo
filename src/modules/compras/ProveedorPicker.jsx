import { addDoc, collection } from 'firebase/firestore'
import { useState } from 'react'
import { db } from '../../lib/firebase'
import { useProveedores } from './useProveedores'

const NUEVO = '__nuevo__'

export default function ProveedorPicker({ value, onChange }) {
  const proveedores = useProveedores()
  const [creatingName, setCreatingName] = useState(null)

  const handleSelect = async (e) => {
    const selected = e.target.value
    if (selected === NUEVO) {
      setCreatingName('')
      onChange('')
      return
    }
    setCreatingName(null)
    onChange(selected)
  }

  const confirmNuevo = async () => {
    const nombre = creatingName.trim()
    if (!nombre) return
    const ref = await addDoc(collection(db, 'proveedores'), { nombre })
    setCreatingName(null)
    onChange(ref.id)
  }

  if (creatingName !== null) {
    return (
      <div className="mt-1 flex gap-2">
        <input
          autoFocus
          value={creatingName}
          onChange={(e) => setCreatingName(e.target.value)}
          placeholder="Nombre del proveedor"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={confirmNuevo}
          className="rounded-md bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-800"
        >
          Guardar
        </button>
      </div>
    )
  }

  return (
    <select
      required
      value={value}
      onChange={handleSelect}
      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
    >
      <option value="" disabled>
        Selecciona un proveedor
      </option>
      {proveedores.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nombre}
        </option>
      ))}
      <option value={NUEVO}>+ Nuevo proveedor…</option>
    </select>
  )
}
