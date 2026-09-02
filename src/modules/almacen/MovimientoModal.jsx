import { useState } from 'react'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { useToast } from '../../lib/ToastContext'
import { inputClass } from '../../lib/ui'
import MaterialPicker from './MaterialPicker'
import { registrarMovimientoManual } from './stockActions'

export default function MovimientoModal({ open, onClose }) {
  const [materialId, setMaterialId] = useState('')
  const [tipo, setTipo] = useState('entrada')
  const [cantidad, setCantidad] = useState('1')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await registrarMovimientoManual({ materialId, tipo, cantidad: Number(cantidad) })
      setMaterialId('')
      setCantidad('1')
      onClose()
      toast(`Movimiento de ${tipo} registrado`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Movimiento de almacén" maxWidth="max-w-sm">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="text-sm font-medium text-slate-600">
          Material
          <div className="mt-1">
            <MaterialPicker value={materialId} onChange={setMaterialId} />
          </div>
        </label>

        <fieldset className="text-sm font-medium text-slate-600">
          Tipo
          <div className="mt-1 flex gap-4">
            <label className="flex items-center gap-1.5 font-normal">
              <input
                type="radio"
                name="tipo"
                value="entrada"
                checked={tipo === 'entrada'}
                onChange={(e) => setTipo(e.target.value)}
              />
              Entrada
            </label>
            <label className="flex items-center gap-1.5 font-normal">
              <input
                type="radio"
                name="tipo"
                value="salida"
                checked={tipo === 'salida'}
                onChange={(e) => setTipo(e.target.value)}
              />
              Salida
            </label>
          </div>
        </fieldset>

        <label className="text-sm font-medium text-slate-600">
          Cantidad
          <input
            required
            type="number"
            min="1"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            className={inputClass}
          />
        </label>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || !materialId}>
            {saving ? 'Guardando…' : 'Registrar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
