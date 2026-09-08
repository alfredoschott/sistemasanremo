import { addDoc, collection, doc, updateDoc } from 'firebase/firestore'
import { MapPin } from 'lucide-react'
import { useState } from 'react'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { db } from '../../lib/firebase'
import { useToast } from '../../lib/ToastContext'
import { inputClass } from '../../lib/ui'
import { googleMapsUrl } from '../../lib/maps'

function TransformadorForm({ onClose, transformador }) {
  const isEdit = Boolean(transformador)
  const [modelo, setModelo] = useState(transformador?.modelo ?? '')
  const [capacidadKva, setCapacidadKva] = useState(String(transformador?.capacidadKva ?? ''))
  const [voltaje, setVoltaje] = useState(transformador?.voltaje ?? '')
  const [cantidad, setCantidad] = useState(String(transformador?.cantidad ?? '1'))
  const [ubicacion, setUbicacion] = useState(transformador?.ubicacion ?? '')
  const [destino, setDestino] = useState(transformador?.destino ?? '')
  const [notas, setNotas] = useState(transformador?.notas ?? '')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = {
        modelo: modelo.trim(),
        capacidadKva: capacidadKva ? Number(capacidadKva) : null,
        voltaje: voltaje.trim(),
        cantidad: Number(cantidad) || 0,
        ubicacion: ubicacion.trim(),
        destino: destino.trim(),
        notas: notas.trim(),
      }

      if (isEdit) {
        await updateDoc(doc(db, 'transformadoresTerminados', transformador.id), data)
        toast('Transformador actualizado')
      } else {
        await addDoc(collection(db, 'transformadoresTerminados'), data)
        toast('Transformador agregado al inventario')
      }
      onClose()
    } catch {
      toast('No se pudo guardar. Intenta de nuevo.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="text-sm font-medium text-ink-dim">
        Modelo
        <input
          required
          autoFocus
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          placeholder="p. ej. TDD-75-13.2"
          className={inputClass}
        />
      </label>

      <div className="flex gap-3">
        <label className="flex-1 text-sm font-medium text-ink-dim">
          Capacidad (kVA)
          <input
            type="number"
            min="0"
            step="0.1"
            value={capacidadKva}
            onChange={(e) => setCapacidadKva(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex-1 text-sm font-medium text-ink-dim">
          Voltaje
          <input
            value={voltaje}
            onChange={(e) => setVoltaje(e.target.value)}
            placeholder="13200/220-127"
            className={inputClass}
          />
        </label>
      </div>

      <div className="flex gap-3">
        <label className="flex-1 text-sm font-medium text-ink-dim">
          Cantidad en inventario
          <input
            required
            type="number"
            min="0"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex-1 text-sm font-medium text-ink-dim">
          Ubicación
          <input
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            placeholder="p. ej. Patio A"
            className={inputClass}
          />
        </label>
      </div>

      <label className="text-sm font-medium text-ink-dim">
        Destino (dirección de entrega)
        <input
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          placeholder="Calle, número, ciudad…"
          className={inputClass}
        />
        {destino.trim() && (
          <a
            href={googleMapsUrl(destino.trim())}
            target="_blank"
            rel="noreferrer"
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800 hover:underline"
          >
            <MapPin className="h-3.5 w-3.5" />
            Ver en Google Maps
          </a>
        )}
      </label>

      <label className="text-sm font-medium text-ink-dim">
        Notas
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          className={inputClass}
        />
      </label>

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving} disabled={!modelo.trim()}>
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Agregar transformador'}
        </Button>
      </div>
    </form>
  )
}

export default function TransformadorModal({ open, onClose, transformador = null }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={transformador ? 'Editar transformador' : 'Nuevo transformador'}
      subtitle="Transformadores terminados en inventario"
      maxWidth="max-w-lg"
    >
      <TransformadorForm key={transformador?.id ?? 'new'} onClose={onClose} transformador={transformador} />
    </Modal>
  )
}
