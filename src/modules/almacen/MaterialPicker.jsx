import { addDoc, collection } from 'firebase/firestore'
import { useState } from 'react'
import { db } from '../../lib/firebase'
import { inputClass } from '../../lib/ui'
import { useMateriales } from './useMateriales'

const NUEVO = '__nuevo__'

export default function MaterialPicker({ value, onChange }) {
  const { materiales } = useMateriales()
  const [creatingName, setCreatingName] = useState(null)

  const handleSelect = (e) => {
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
    const ref = await addDoc(collection(db, 'materiales'), {
      nombre,
      unidad: 'pza',
      categoria: 'Otros',
      stock: 0,
      minimo: 0,
    })
    setCreatingName(null)
    onChange(ref.id)
  }

  if (creatingName !== null) {
    return (
      <div className="flex gap-2">
        <input
          autoFocus
          value={creatingName}
          onChange={(e) => setCreatingName(e.target.value)}
          placeholder="Nombre del material"
          className={`flex-1 ${inputClass} mt-0`}
        />
        <button
          type="button"
          onClick={confirmNuevo}
          className="rounded-md bg-brand-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-800"
        >
          Guardar
        </button>
      </div>
    )
  }

  return (
    <select required value={value} onChange={handleSelect} className={inputClass}>
      <option value="" disabled>
        Selecciona un material
      </option>
      {materiales.map((m) => (
        <option key={m.id} value={m.id}>
          {m.nombre}
        </option>
      ))}
      <option value={NUEVO}>+ Nuevo material…</option>
    </select>
  )
}
