import { doc, updateDoc } from 'firebase/firestore'
import { Check, Pencil, Truck } from 'lucide-react'
import { useState } from 'react'
import EmptyState from '../../components/EmptyState'
import { db } from '../../lib/firebase'
import { useToast } from '../../lib/ToastContext'
import { useProveedores } from './useProveedores'

function NombreEditable({ proveedor }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(proveedor.nombre)
  const toast = useToast()

  const commit = () => {
    const nombre = value.trim()
    setEditing(false)
    if (nombre && nombre !== proveedor.nombre) {
      updateDoc(doc(db, 'proveedores', proveedor.id), { nombre }).catch(() =>
        toast('No se pudo actualizar el nombre.', 'error'),
      )
    } else {
      setValue(proveedor.nombre)
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
      {proveedor.nombre}
      <Pencil className="h-3 w-3 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}

export default function ProveedoresPanel() {
  const proveedores = useProveedores()

  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold text-slate-800">Proveedores</h2>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {proveedores.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Sin proveedores todavía"
            subtitle="Se crean al vuelo desde una OF o una O.C."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {proveedores.map((p) => (
              <li key={p.id} className="px-4 py-3 text-sm transition-colors hover:bg-brand-50/40">
                <NombreEditable proveedor={p} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
