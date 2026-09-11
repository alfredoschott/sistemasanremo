import { useState } from 'react'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import ProveedorMaterialesFila from '../compras/ProveedorMaterialesFila'
import { mensajeError } from '../../lib/firestoreErrors'
import { useToast } from '../../lib/ToastContext'
import { agregarProveedorAOF } from './ofActions'

function filaVacia() {
  return { proveedorId: '', plazoEntregaDias: '20', fechaCompromiso: '', materiales: [] }
}

export default function AgregarProveedorOFModal({ of, onClose }) {
  const [fila, setFila] = useState(filaVacia)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  if (!of) return null

  const submit = async (e) => {
    e.preventDefault()
    if (!fila.proveedorId) return
    setSaving(true)
    try {
      await agregarProveedorAOF(of, {
        proveedorId: fila.proveedorId,
        plazoEntregaDias: Number(fila.plazoEntregaDias) || 20,
        fechaCompromiso: fila.fechaCompromiso || null,
        materiales: fila.materiales
          .filter((l) => l.materialId)
          .map((l) => ({ materialId: l.materialId, cantidad: Number(l.cantidad) || 1 })),
      })
      onClose()
      toast(`Proveedor agregado a ${of.numeroSerie}`)
    } catch (err) {
      toast(mensajeError(err, 'No se pudo agregar el proveedor. Intenta de nuevo.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open title="Agregar proveedor" subtitle={of.numeroSerie} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <ProveedorMaterialesFila label="Nuevo proveedor" fila={fila} onChange={setFila} />

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving} disabled={!fila.proveedorId}>
            {saving ? 'Agregando…' : 'Agregar proveedor'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
