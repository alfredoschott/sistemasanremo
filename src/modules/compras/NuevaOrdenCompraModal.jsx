import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { X } from 'lucide-react'
import { useState } from 'react'
import MaterialPicker from '../almacen/MaterialPicker'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { db } from '../../lib/firebase'
import { crearNotificacion } from '../../lib/notify'
import { useToast } from '../../lib/ToastContext'
import { inputClass } from '../../lib/ui'
import ProveedorPicker from './ProveedorPicker'

const lineaVacia = { materialId: '', cantidad: '1' }

function lineasFromOc(oc) {
  return oc.materiales?.length
    ? oc.materiales.map((l) => ({ materialId: l.materialId, cantidad: String(l.cantidad) }))
    : [{ ...lineaVacia }]
}

function OrdenCompraForm({ onClose, oc }) {
  const [proveedorId, setProveedorId] = useState(oc?.proveedorId ?? '')
  const [plazoEntregaDias, setPlazoEntregaDias] = useState(String(oc?.plazoEntregaDias ?? '20'))
  const [materiales, setMateriales] = useState(() => (oc ? lineasFromOc(oc) : [{ ...lineaVacia }]))
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const isEdit = Boolean(oc)

  const updateLinea = (index, field) => (value) => {
    setMateriales((prev) =>
      prev.map((linea, i) => (i === index ? { ...linea, [field]: value } : linea)),
    )
  }

  const addLinea = () => setMateriales((prev) => [...prev, { ...lineaVacia }])
  const removeLinea = (index) =>
    setMateriales((prev) => prev.filter((_, i) => i !== index))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = {
        proveedorId,
        plazoEntregaDias: Number(plazoEntregaDias),
        materiales: materiales
          .filter((l) => l.materialId)
          .map((l) => ({ materialId: l.materialId, cantidad: Number(l.cantidad) || 1 })),
      }

      if (isEdit) {
        await updateDoc(doc(db, 'ordenesCompra', oc.id), data)
        toast('Orden de compra actualizada')
      } else {
        await addDoc(collection(db, 'ordenesCompra'), {
          ...data,
          estado: 'pendiente',
          fecha: serverTimestamp(),
        })
        toast('Orden de compra creada')
        crearNotificacion({ mensaje: 'Nueva orden de compra creada', tipo: 'info' })
      }

      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
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
          className={inputClass}
        />
      </label>

      <div>
        <span className="text-sm font-medium text-slate-600">Materiales</span>
        <div className="mt-1 flex flex-col gap-2">
          {materiales.map((linea, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1">
                <MaterialPicker
                  value={linea.materialId}
                  onChange={updateLinea(index, 'materialId')}
                />
              </div>
              <input
                type="number"
                min="1"
                value={linea.cantidad}
                onChange={(e) => updateLinea(index, 'cantidad')(e.target.value)}
                className={`w-20 ${inputClass} mt-0`}
              />
              {materiales.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLinea(index)}
                  className="px-2 text-slate-400 transition-colors hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addLinea}
          className="mt-2 text-sm font-medium text-brand-700 transition-colors hover:text-brand-800 hover:underline"
        >
          + Agregar material
        </button>
      </div>

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving || !proveedorId}>
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear O.C.'}
        </Button>
      </div>
    </form>
  )
}

export default function NuevaOrdenCompraModal({ open, onClose, oc = null }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={oc ? 'Editar orden de compra' : 'Nueva orden de compra'}
      maxWidth="max-w-lg"
    >
      <OrdenCompraForm key={oc?.id ?? 'new'} onClose={onClose} oc={oc} />
    </Modal>
  )
}
