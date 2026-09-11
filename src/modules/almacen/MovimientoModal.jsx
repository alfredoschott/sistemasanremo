import { useState } from 'react'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { mensajeError } from '../../lib/firestoreErrors'
import { useToast } from '../../lib/ToastContext'
import { inputClass } from '../../lib/ui'
import MaterialPicker from './MaterialPicker'
import { registrarMovimientoManual, revertirMovimientoManual } from './stockActions'
import { useMateriales } from './useMateriales'

export default function MovimientoModal({ open, onClose }) {
  const [materialId, setMaterialId] = useState('')
  const [tipo, setTipo] = useState('entrada')
  const [cantidad, setCantidad] = useState('1')
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const { materiales } = useMateriales()

  const submit = async (e) => {
    e.preventDefault()
    const cantidadNum = Number(cantidad)
    const material = materiales.find((m) => m.id === materialId)
    if (tipo === 'salida' && material && cantidadNum > (material.stock ?? 0)) {
      toast(`Solo hay ${material.stock ?? 0} disponibles de ${material.nombre}`, 'error')
      return
    }

    setSaving(true)
    try {
      const registrado = await registrarMovimientoManual({
        materialId,
        tipo,
        cantidad: cantidadNum,
      })
      setMaterialId('')
      setCantidad('1')
      onClose()
      toast(`Movimiento de ${tipo} registrado`, 'success', {
        onUndo: () => revertirMovimientoManual(registrado),
      })
    } catch (err) {
      if (err.message === 'stock-insuficiente') {
        toast('Ya no hay suficiente stock: alguien más registró un movimiento primero.', 'error')
      } else {
        toast(mensajeError(err, 'No se pudo registrar el movimiento. Intenta de nuevo.'), 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Movimiento de almacén" maxWidth="max-w-sm">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="text-sm font-medium text-ink-dim">
          Material
          <div className="mt-1">
            <MaterialPicker value={materialId} onChange={setMaterialId} />
          </div>
        </label>

        <fieldset className="text-sm font-medium text-ink-dim">
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

        <label className="text-sm font-medium text-ink-dim">
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
          <Button type="submit" loading={saving} disabled={!materialId}>
            {saving ? 'Guardando…' : 'Registrar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
