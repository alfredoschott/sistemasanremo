import { deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { Check, Pencil, Trash2, Truck } from 'lucide-react'
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

function PlazoPagoInput({ proveedor }) {
  const [value, setValue] = useState(proveedor.plazoPagoDias ?? 0)
  const toast = useToast()

  const commit = () => {
    const plazoPagoDias = Number(value) || 0
    if (plazoPagoDias !== (proveedor.plazoPagoDias ?? 0)) {
      updateDoc(doc(db, 'proveedores', proveedor.id), { plazoPagoDias }).catch(() =>
        toast('No se pudo actualizar el plazo de pago.', 'error'),
      )
    }
  }

  return (
    <input
      type="number"
      min="0"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
    />
  )
}

export default function ProveedoresPanel() {
  const proveedores = useProveedores()
  const toast = useToast()

  const eliminarProveedor = async (proveedor) => {
    if (
      !window.confirm(
        `¿Eliminar "${proveedor.nombre}"? Solo hazlo si ya no se usa en ninguna O.C. ni OF.`,
      )
    )
      return
    try {
      await deleteDoc(doc(db, 'proveedores', proveedor.id))
      toast(`${proveedor.nombre} eliminado`)
    } catch {
      toast('No se pudo eliminar el proveedor.', 'error')
    }
  }

  return (
    <section>
      <h2 className="mb-1 text-xl font-semibold text-slate-800">Proveedores</h2>
      <p className="mb-3 text-sm text-slate-500">
        El plazo de pago se usa para proyectar el flujo de caja en Finanzas.
      </p>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {proveedores.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Sin proveedores todavía"
            subtitle="Se crean al vuelo desde una OF o una O.C."
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Proveedor</th>
                <th className="px-4 py-2">Plazo de pago (días)</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {proveedores.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-brand-50/40">
                  <td className="px-4 py-2.5">
                    <NombreEditable proveedor={p} />
                  </td>
                  <td className="px-4 py-2.5">
                    <PlazoPagoInput proveedor={p} />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => eliminarProveedor(p)}
                      className="text-slate-400 transition-colors hover:text-red-600"
                      title="Eliminar proveedor"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
