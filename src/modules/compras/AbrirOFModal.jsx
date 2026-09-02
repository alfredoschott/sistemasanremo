import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { useState } from 'react'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { db } from '../../lib/firebase'
import { useToast } from '../../lib/ToastContext'
import { inputClass } from '../../lib/ui'
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
  const toast = useToast()

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
      toast(`OF ${numeroSerie} abierta para ${cotizacion.cliente}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open title="Abrir orden de fabricación" subtitle={cotizacion.cliente} onClose={onClose}>
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
            className={inputClass}
          />
        </label>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || !proveedorId}>
            {saving ? 'Abriendo…' : 'Abrir OF'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
