import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { Check, Pencil, Plus, Trash2, Truck, X } from 'lucide-react'
import { useState } from 'react'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import IconButton from '../../components/IconButton'
import { db } from '../../lib/firebase'
import { useToast } from '../../lib/ToastContext'
import { inputClassCompact, inputClassInline } from '../../lib/ui'
import { useProveedores } from './useProveedores'

function CampoEditable({ proveedor, campo, placeholder = '—', width = 'w-32' }) {
  const [editing, setEditing] = useState(false)
  const valorActual = proveedor[campo] ?? ''
  const [value, setValue] = useState(valorActual)
  const toast = useToast()

  const commit = () => {
    const nuevo = value.trim()
    setEditing(false)
    if (nuevo !== valorActual) {
      updateDoc(doc(db, 'proveedores', proveedor.id), { [campo]: nuevo }).catch(() => {
        toast('No se pudo guardar el cambio.', 'error')
        setValue(valorActual)
      })
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
          onBlur={commit}
          className={`${width} ${inputClassCompact}`}
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
      className="group inline-flex items-center gap-1.5 text-left text-ink-dim"
    >
      {valorActual || <span className="text-line-strong">{placeholder}</span>}
      <Pencil className="h-3 w-3 shrink-0 text-line-strong opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}

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
          onBlur={commit}
          className={`w-36 ${inputClassCompact}`}
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
      className="group inline-flex items-center gap-1.5 font-medium text-ink"
    >
      {proveedor.nombre}
      <Pencil className="h-3 w-3 shrink-0 text-line-strong opacity-0 transition-opacity group-hover:opacity-100" />
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
      className="w-16 rounded-md border border-line-strong px-2 py-1 text-sm outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
    />
  )
}

function NuevoProveedorForm({ onClose }) {
  const [nombre, setNombre] = useState('')
  const [contacto, setContacto] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const submit = async (e) => {
    e.preventDefault()
    const nombreLimpio = nombre.trim()
    if (!nombreLimpio) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'proveedores'), {
        nombre: nombreLimpio,
        contacto: contacto.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        plazoPagoDias: 0,
      })
      toast('Proveedor agregado')
      onClose()
    } catch {
      toast('No se pudo crear el proveedor.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 border-b border-line bg-surface-2 p-4 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <label className="flex-1 text-xs font-medium text-ink-faint">
        Nombre
        <input
          autoFocus
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del proveedor"
          className={`mt-1 w-full ${inputClassInline}`}
        />
      </label>
      <label className="flex-1 text-xs font-medium text-ink-faint">
        Contacto
        <input
          value={contacto}
          onChange={(e) => setContacto(e.target.value)}
          placeholder="Nombre del contacto"
          className={`mt-1 w-full ${inputClassInline}`}
        />
      </label>
      <label className="flex-1 text-xs font-medium text-ink-faint">
        Teléfono
        <input
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="Teléfono"
          className={`mt-1 w-full ${inputClassInline}`}
        />
      </label>
      <label className="flex-1 text-xs font-medium text-ink-faint">
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@proveedor.com"
          className={`mt-1 w-full ${inputClassInline}`}
        />
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={saving} disabled={!nombre.trim()}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
        <IconButton type="button" icon={X} onClick={onClose} title="Cancelar" />
      </div>
    </form>
  )
}

export default function ProveedoresPanel() {
  const proveedores = useProveedores()
  const toast = useToast()
  const [creando, setCreando] = useState(false)

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
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-ink">Proveedores</h2>
        {!creando && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setCreando(true)}
            className="inline-flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Nuevo proveedor
          </Button>
        )}
      </div>
      <p className="mb-3 text-sm text-ink-faint">
        Haz clic en cualquier dato para editarlo. El plazo de pago se usa para proyectar el flujo
        de caja en Finanzas.
      </p>
      <div className="overflow-x-auto border border-line-strong bg-surface">
        {creando && <NuevoProveedorForm onClose={() => setCreando(false)} />}
        {proveedores.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Sin proveedores todavía"
            subtitle="Créalos aquí o al vuelo desde una OF o una O.C."
          />
        ) : (
          <>
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="bg-surface-2 text-[0.625rem] font-mono uppercase tracking-wide text-ink-faint">
                <tr>
                  <th className="px-4 py-2">Proveedor</th>
                  <th className="px-4 py-2">Contacto</th>
                  <th className="px-4 py-2">Teléfono</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Plazo de pago (días)</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="stagger divide-y divide-line">
                {proveedores.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-surface-2">
                    <td className="px-4 py-2.5">
                      <NombreEditable proveedor={p} />
                    </td>
                    <td className="px-4 py-2.5">
                      <CampoEditable proveedor={p} campo="contacto" placeholder="Agregar contacto" />
                    </td>
                    <td className="px-4 py-2.5">
                      <CampoEditable proveedor={p} campo="telefono" placeholder="Agregar teléfono" width="w-28" />
                    </td>
                    <td className="px-4 py-2.5">
                      <CampoEditable proveedor={p} campo="email" placeholder="Agregar email" width="w-44" />
                    </td>
                    <td className="px-4 py-2.5">
                      <PlazoPagoInput proveedor={p} />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <IconButton
                        icon={Trash2}
                        variant="danger"
                        onClick={() => eliminarProveedor(p)}
                        title="Eliminar proveedor"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="divide-y divide-line md:hidden">
              {proveedores.map((p) => (
                <div key={p.id} className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <NombreEditable proveedor={p} />
                    <IconButton
                      icon={Trash2}
                      variant="danger"
                      onClick={() => eliminarProveedor(p)}
                      title="Eliminar proveedor"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-xs text-ink-faint">
                    <label className="flex items-center gap-1.5">
                      Contacto
                      <CampoEditable proveedor={p} campo="contacto" placeholder="Agregar" width="w-32" />
                    </label>
                    <label className="flex items-center gap-1.5">
                      Teléfono
                      <CampoEditable proveedor={p} campo="telefono" placeholder="Agregar" width="w-28" />
                    </label>
                    <label className="flex items-center gap-1.5">
                      Email
                      <CampoEditable proveedor={p} campo="email" placeholder="Agregar" width="w-40" />
                    </label>
                    <label className="flex items-center gap-1.5">
                      Plazo de pago (días)
                      <PlazoPagoInput proveedor={p} />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
