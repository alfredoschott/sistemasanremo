import { X } from 'lucide-react'
import { useState } from 'react'
import Button from '../../components/Button'
import IconButton from '../../components/IconButton'
import Modal from '../../components/Modal'
import { mensajeError } from '../../lib/firestoreErrors'
import { useToast } from '../../lib/ToastContext'
import { inputClass, inputClassInline } from '../../lib/ui'
import MaterialPicker from '../almacen/MaterialPicker'
import { actualizarListaMateriales, crearListaMateriales } from './listaMaterialesActions'

const lineaVacia = { materialId: '', cantidad: '1' }

function lineasFromLista(lista) {
  return lista.materiales?.length
    ? lista.materiales.map((l) => ({ materialId: l.materialId, cantidad: String(l.cantidad) }))
    : [{ ...lineaVacia }]
}

function ListaMaterialesForm({ onClose, lista }) {
  const [modelo, setModelo] = useState(lista?.modelo ?? '')
  const [notas, setNotas] = useState(lista?.notas ?? '')
  const [materiales, setMateriales] = useState(() =>
    lista ? lineasFromLista(lista) : [{ ...lineaVacia }],
  )
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const isEdit = Boolean(lista)

  const updateLinea = (index, field) => (value) => {
    setMateriales((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)))
  }
  const addLinea = () => setMateriales((prev) => [...prev, { ...lineaVacia }])
  const removeLinea = (index) => setMateriales((prev) => prev.filter((_, i) => i !== index))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = {
        modelo: modelo.trim(),
        notas: notas.trim(),
        materiales: materiales
          .filter((l) => l.materialId)
          .map((l) => ({ materialId: l.materialId, cantidad: Number(l.cantidad) || 1 })),
      }
      if (isEdit) {
        await actualizarListaMateriales(lista, data)
        toast('Lista de materiales actualizada')
      } else {
        await crearListaMateriales(data)
        toast('Lista de materiales creada')
      }
      onClose()
    } catch (err) {
      toast(
        err.message === 'modelo-duplicado'
          ? 'Ya existe una lista de materiales para ese modelo.'
          : mensajeError(err, 'No se pudo guardar. Intenta de nuevo.'),
        'error',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="text-sm font-medium text-ink-dim">
        Modelo de transformador
        <input
          required
          autoFocus
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          placeholder="Ej. TDD-300-23"
          className={inputClass}
        />
      </label>

      <div>
        <span className="text-sm font-medium text-ink-dim">Materiales estándar</span>
        <div className="mt-1 flex flex-col gap-2">
          {materiales.map((linea, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <MaterialPicker
                  inline
                  value={linea.materialId}
                  onChange={updateLinea(index, 'materialId')}
                />
              </div>
              <input
                type="number"
                min="1"
                value={linea.cantidad}
                onChange={(e) => updateLinea(index, 'cantidad')(e.target.value)}
                className={`w-20 ${inputClassInline}`}
              />
              {materiales.length > 1 && (
                <IconButton type="button" icon={X} variant="danger" onClick={() => removeLinea(index)} />
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

      <label className="text-sm font-medium text-ink-dim">
        Notas (opcional)
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
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear lista'}
        </Button>
      </div>
    </form>
  )
}

export default function ListaMaterialesModal({ open, onClose, lista = null }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lista ? 'Editar lista de materiales' : 'Nueva lista de materiales'}
      subtitle="Los materiales y cantidades estándar para fabricar un modelo"
      maxWidth="max-w-lg"
    >
      <ListaMaterialesForm key={lista?.id ?? 'new'} onClose={onClose} lista={lista} />
    </Modal>
  )
}
