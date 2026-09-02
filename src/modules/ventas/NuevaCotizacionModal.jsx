import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { useState } from 'react'
import { CONDICION_PAGO } from '../../lib/estados'
import { db } from '../../lib/firebase'

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

  if (!open) return null

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
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Nueva cotización</h2>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="text-sm font-medium text-slate-600">
            Cliente
            <input
              required
              value={form.cliente}
              onChange={update('cliente')}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          )}

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
              disabled={saving}
              className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Crear cotización'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
