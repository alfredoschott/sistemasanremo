import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { useState } from 'react'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { registrarAuditoria } from '../../lib/audit'
import { CONDICION_PAGO } from '../../lib/estados'
import { db } from '../../lib/firebase'
import { crearNotificacion } from '../../lib/notify'
import { useToast } from '../../lib/ToastContext'
import { inputClass } from '../../lib/ui'

const initialForm = {
  cliente: '',
  monto: '',
  condicionPago: CONDICION_PAGO.ANTICIPO,
  porcentajeAnticipo: '30',
  entregaSemanas: '4',
}

function formFromCotizacion(cotizacion) {
  return {
    cliente: cotizacion.cliente ?? '',
    monto: String(cotizacion.monto ?? ''),
    condicionPago: cotizacion.condicionPago ?? CONDICION_PAGO.ANTICIPO,
    porcentajeAnticipo: String(cotizacion.porcentajeAnticipo ?? '30'),
    entregaSemanas: String(cotizacion.entregaSemanas ?? '4'),
  }
}

function CotizacionForm({ onClose, cotizacion }) {
  const [form, setForm] = useState(() =>
    cotizacion ? formFromCotizacion(cotizacion) : initialForm,
  )
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const isEdit = Boolean(cotizacion)

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = {
        cliente: form.cliente,
        monto: Number(form.monto),
        condicionPago: form.condicionPago,
        porcentajeAnticipo:
          form.condicionPago === CONDICION_PAGO.ANTICIPO ? Number(form.porcentajeAnticipo) : null,
        entregaSemanas: Number(form.entregaSemanas),
      }

      if (isEdit) {
        await updateDoc(doc(db, 'cotizaciones', cotizacion.id), data)
        toast(`Cotización de ${form.cliente} actualizada`)
        registrarAuditoria({ entidad: 'cotizacion', entidadId: cotizacion.id, accion: 'Editada' })
      } else {
        const ref = await addDoc(collection(db, 'cotizaciones'), {
          ...data,
          estado: 'Cotizado',
          fecha: serverTimestamp(),
        })
        toast(`Cotización creada para ${form.cliente}`)
        crearNotificacion({ mensaje: `Nueva cotización: ${form.cliente}`, tipo: 'success' })
        registrarAuditoria({ entidad: 'cotizacion', entidadId: ref.id, accion: 'Creada' })
      }

      onClose()
    } catch {
      toast('No se pudo guardar la cotización. Intenta de nuevo.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
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
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear cotización'}
        </Button>
      </div>
    </form>
  )
}

export default function NuevaCotizacionModal({ open, onClose, cotizacion = null }) {
  return (
    <Modal open={open} onClose={onClose} title={cotizacion ? 'Editar cotización' : 'Nueva cotización'}>
      <CotizacionForm key={cotizacion?.id ?? 'new'} onClose={onClose} cotizacion={cotizacion} />
    </Modal>
  )
}
