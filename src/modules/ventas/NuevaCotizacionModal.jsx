import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { useState } from 'react'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { CONDICION_PAGO } from '../../lib/estados'
import { db } from '../../lib/firebase'
import { useToast } from '../../lib/ToastContext'
import { inputClass } from '../../lib/ui'

const initialForm = {
  cliente: '',
  monto: '',
  condicionPago: CONDICION_PAGO.ANTICIPO,
  porcentajeAnticipo: '30',
  entregaSemanas: '4',
}

export default function NuevaCotizacionModal({ open, onClose }) {
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await addDoc(collection(db, 'cotizaciones'), {
        cliente: form.cliente,
        monto: Number(form.monto),
        condicionPago: form.condicionPago,
        porcentajeAnticipo:
          form.condicionPago === CONDICION_PAGO.ANTICIPO ? Number(form.porcentajeAnticipo) : null,
        entregaSemanas: Number(form.entregaSemanas),
        estado: 'Cotizado',
        fecha: serverTimestamp(),
      })
      setForm(initialForm)
      onClose()
      toast(`Cotización creada para ${form.cliente}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva cotización">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="text-sm font-medium text-slate-600">
          Cliente
          <input
            required
            value={form.cliente}
            onChange={update('cliente')}
            className={inputClass}
            placeholder="Industrias Reyna"
          />
        </label>

        <label className="text-sm font-medium text-slate-600">
          Monto (MXN)
          <input
            required
            type="number"
            min="0"
            value={form.monto}
            onChange={update('monto')}
            className={inputClass}
          />
        </label>

        <label className="text-sm font-medium text-slate-600">
          Entrega comprometida (semanas)
          <input
            required
            type="number"
            min="1"
            value={form.entregaSemanas}
            onChange={update('entregaSemanas')}
            className={inputClass}
          />
        </label>

        <fieldset className="text-sm font-medium text-slate-600">
          Condición de pago
          <div className="mt-1 flex gap-4">
            <label className="flex items-center gap-1.5 font-normal">
              <input
                type="radio"
                name="condicionPago"
                value={CONDICION_PAGO.ANTICIPO}
                checked={form.condicionPago === CONDICION_PAGO.ANTICIPO}
                onChange={update('condicionPago')}
              />
              Anticipo
            </label>
            <label className="flex items-center gap-1.5 font-normal">
              <input
                type="radio"
                name="condicionPago"
                value={CONDICION_PAGO.FUDECO}
                checked={form.condicionPago === CONDICION_PAGO.FUDECO}
                onChange={update('condicionPago')}
              />
              Crédito Fudeco (60-90 días)
            </label>
          </div>
        </fieldset>

        {form.condicionPago === CONDICION_PAGO.ANTICIPO && (
          <label className="text-sm font-medium text-slate-600">
            % de anticipo
            <input
              type="number"
              min="0"
              max="100"
              value={form.porcentajeAnticipo}
              onChange={update('porcentajeAnticipo')}
              className={inputClass}
            />
          </label>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Crear cotización'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
