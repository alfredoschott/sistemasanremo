import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { X } from 'lucide-react'
import { useState } from 'react'
import Button from '../../components/Button'
import IconButton from '../../components/IconButton'
import Modal from '../../components/Modal'
import { registrarAuditoria } from '../../lib/audit'
import { CONDICION_PAGO } from '../../lib/estados'
import { db } from '../../lib/firebase'
import { crearNotificacion } from '../../lib/notify'
import { currency } from '../../lib/currency'
import { actualizarSeguimiento } from '../../lib/seguimientoPublico'
import { useToast } from '../../lib/ToastContext'
import { inputClass, inputClassInline } from '../../lib/ui'


const lineaVacia = () => ({ modelo: '', cantidad: '1', precioUnitario: '' })

const initialForm = {
  cliente: '',
  condicionPago: CONDICION_PAGO.ANTICIPO,
  porcentajeAnticipo: '30',
  diasCredito: '60',
  entregaSemanas: '4',
}

function itemsFromCotizacion(cotizacion) {
  if (cotizacion.items?.length) {
    return cotizacion.items.map((i) => ({
      modelo: i.modelo ?? '',
      cantidad: String(i.cantidad ?? '1'),
      precioUnitario: String(i.precioUnitario ?? ''),
    }))
  }
  // Cotizaciones de antes de tener líneas por transformador: se arman con
  // una sola línea a partir del monto plano, para no perder el total al
  // editarlas — el usuario puede desglosarla en varias líneas si quiere.
  if (cotizacion.monto) {
    return [{ modelo: '', cantidad: '1', precioUnitario: String(cotizacion.monto) }]
  }
  return [lineaVacia()]
}

function formFromCotizacion(cotizacion) {
  return {
    cliente: cotizacion.cliente ?? '',
    condicionPago: cotizacion.condicionPago ?? CONDICION_PAGO.ANTICIPO,
    porcentajeAnticipo: String(cotizacion.porcentajeAnticipo ?? '30'),
    diasCredito: String(cotizacion.diasCredito ?? '60'),
    entregaSemanas: String(cotizacion.entregaSemanas ?? '4'),
  }
}

function CotizacionForm({ onClose, cotizacion }) {
  const [form, setForm] = useState(() =>
    cotizacion ? formFromCotizacion(cotizacion) : initialForm,
  )
  const [items, setItems] = useState(() =>
    cotizacion ? itemsFromCotizacion(cotizacion) : [lineaVacia()],
  )
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const isEdit = Boolean(cotizacion)

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const actualizarLinea = (index, campo) => (e) =>
    setItems((prev) => prev.map((l, i) => (i === index ? { ...l, [campo]: e.target.value } : l)))
  const agregarLinea = () => setItems((prev) => [...prev, lineaVacia()])
  const quitarLinea = (index) => setItems((prev) => prev.filter((_, i) => i !== index))

  const total = items.reduce(
    (sum, l) => sum + (Number(l.cantidad) || 0) * (Number(l.precioUnitario) || 0),
    0,
  )

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const itemsValidos = items
        .filter((l) => l.modelo.trim())
        .map((l) => ({
          modelo: l.modelo.trim(),
          cantidad: Number(l.cantidad) || 1,
          precioUnitario: Number(l.precioUnitario) || 0,
        }))
      const montoTotal = itemsValidos.reduce((sum, l) => sum + l.cantidad * l.precioUnitario, 0)
      // Sin precioUnitario: el espejo público (seguimientoPublico) nunca
      // debe llevar montos — solo qué se está fabricando, no cuánto cuesta.
      const itemsPublicos = itemsValidos.map((l) => ({ modelo: l.modelo, cantidad: l.cantidad }))

      const data = {
        cliente: form.cliente,
        items: itemsValidos,
        monto: montoTotal,
        condicionPago: form.condicionPago,
        porcentajeAnticipo:
          form.condicionPago === CONDICION_PAGO.ANTICIPO ? Number(form.porcentajeAnticipo) : null,
        diasCredito:
          form.condicionPago === CONDICION_PAGO.FUDECO ? Number(form.diasCredito) : null,
        entregaSemanas: Number(form.entregaSemanas),
      }

      if (isEdit) {
        await updateDoc(doc(db, 'cotizaciones', cotizacion.id), data)
        actualizarSeguimiento(cotizacion.id, {
          cliente: data.cliente,
          entregaSemanas: data.entregaSemanas,
          items: itemsPublicos,
        })
        toast(`Cotización de ${form.cliente} actualizada`)
        registrarAuditoria({ entidad: 'cotizacion', entidadId: cotizacion.id, accion: 'Editada' })
      } else {
        const ref = await addDoc(collection(db, 'cotizaciones'), {
          ...data,
          estado: 'Cotizado',
          fecha: serverTimestamp(),
        })
        actualizarSeguimiento(ref.id, {
          cliente: data.cliente,
          estado: 'Cotizado',
          entregaSemanas: data.entregaSemanas,
          items: itemsPublicos,
        })
        toast(`Cotización creada para ${form.cliente}`)
        crearNotificacion({
          mensaje: `Nueva cotización: ${form.cliente}`,
          tipo: 'success',
          link: `/ventas/${ref.id}`,
          areas: ['ventas', 'compras'],
        })
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
      <label className="text-sm font-medium text-ink-dim">
        Cliente
        <input
          required
          value={form.cliente}
          onChange={update('cliente')}
          className={inputClass}
          placeholder="Industrias Reyna"
        />
      </label>

      <div>
        <span className="text-sm font-medium text-ink-dim">Transformadores cotizados</span>
        <div className="mt-1 flex flex-col gap-2">
          {items.map((linea, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                required
                value={linea.modelo}
                onChange={actualizarLinea(index, 'modelo')}
                placeholder="Modelo, p. ej. TDD-75-13.2"
                className={`flex-[2] ${inputClassInline}`}
              />
              <input
                required
                type="number"
                min="1"
                value={linea.cantidad}
                onChange={actualizarLinea(index, 'cantidad')}
                placeholder="Cant."
                title="Cantidad"
                className={`w-16 ${inputClassInline}`}
              />
              <input
                required
                type="number"
                min="0"
                value={linea.precioUnitario}
                onChange={actualizarLinea(index, 'precioUnitario')}
                placeholder="Precio c/u"
                title="Precio unitario (MXN)"
                className={`flex-1 ${inputClassInline}`}
              />
              {items.length > 1 && (
                <IconButton
                  type="button"
                  icon={X}
                  variant="danger"
                  onClick={() => quitarLinea(index)}
                  title="Quitar línea"
                />
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={agregarLinea}
          className="mt-1.5 text-xs font-medium text-brand-700 transition-colors hover:text-brand-800 hover:underline"
        >
          + Agregar transformador
        </button>
      </div>

      <div className="flex items-center justify-between rounded-md bg-surface-2 px-3 py-2 text-sm">
        <span className="font-medium text-ink-dim">Total</span>
        <span className="font-mono text-base font-semibold text-ink">{currency.format(total)}</span>
      </div>

      <label className="text-sm font-medium text-ink-dim">
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

      <fieldset className="text-sm font-medium text-ink-dim">
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
            Crédito Fudeco
          </label>
        </div>
      </fieldset>

      {form.condicionPago === CONDICION_PAGO.ANTICIPO && (
        <label className="text-sm font-medium text-ink-dim">
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

      {form.condicionPago === CONDICION_PAGO.FUDECO && (
        <label className="text-sm font-medium text-ink-dim">
          Días de crédito
          <input
            type="number"
            min="1"
            value={form.diasCredito}
            onChange={update('diasCredito')}
            className={inputClass}
          />
        </label>
      )}

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear cotización'}
        </Button>
      </div>
    </form>
  )
}

export default function NuevaCotizacionModal({ open, onClose, cotizacion = null }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={cotizacion ? 'Editar cotización' : 'Nueva cotización'}
      maxWidth="max-w-lg"
    >
      <CotizacionForm key={cotizacion?.id ?? 'new'} onClose={onClose} cotizacion={cotizacion} />
    </Modal>
  )
}
