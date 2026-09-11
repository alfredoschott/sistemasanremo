import { addDoc, collection } from 'firebase/firestore'
import { useState } from 'react'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { db } from '../../lib/firebase'
import { mensajeError } from '../../lib/firestoreErrors'
import { useToast } from '../../lib/ToastContext'
import { inputClass } from '../../lib/ui'
import { CATEGORIAS, UNIDADES_SUGERIDAS } from './materialStatus'
import { useMateriales } from './useMateriales'

export default function NuevoMaterialModal({ open, onClose }) {
  const { materiales } = useMateriales()
  const toast = useToast()
  const [nombre, setNombre] = useState('')
  const [unidad, setUnidad] = useState('pza')
  const [categoria, setCategoria] = useState(CATEGORIAS[CATEGORIAS.length - 1])
  const [stock, setStock] = useState('0')
  const [minimo, setMinimo] = useState('0')
  const [saving, setSaving] = useState(false)

  const cerrar = () => {
    setNombre('')
    setUnidad('pza')
    setCategoria(CATEGORIAS[CATEGORIAS.length - 1])
    setStock('0')
    setMinimo('0')
    onClose()
  }

  const submit = async (e) => {
    e.preventDefault()
    const nombreLimpio = nombre.trim()
    if (!nombreLimpio) return

    const yaExiste = materiales.some((m) => m.nombre.trim().toUpperCase() === nombreLimpio.toUpperCase())
    if (yaExiste) {
      toast('Ya existe un material con ese nombre.', 'error')
      return
    }

    setSaving(true)
    try {
      await addDoc(collection(db, 'materiales'), {
        nombre: nombreLimpio,
        unidad: unidad.trim() || 'pza',
        categoria,
        stock: Number(stock) || 0,
        minimo: Number(minimo) || 0,
      })
      toast(`${nombreLimpio} agregado al catálogo`)
      cerrar()
    } catch (err) {
      toast(mensajeError(err, 'No se pudo agregar el material. Intenta de nuevo.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={cerrar} title="Nuevo material" maxWidth="max-w-sm">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="text-sm font-medium text-ink-dim">
          Nombre
          <input
            autoFocus
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. BOQUILLA CLASE 25"
            className={inputClass}
          />
        </label>

        <div className="flex gap-3">
          <label className="flex-1 text-sm font-medium text-ink-dim">
            Unidad
            <input
              list="unidades-sugeridas"
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
              className={inputClass}
            />
            <datalist id="unidades-sugeridas">
              {UNIDADES_SUGERIDAS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </label>
          <label className="flex-1 text-sm font-medium text-ink-dim">
            Categoría
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={inputClass}>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex gap-3">
          <label className="flex-1 text-sm font-medium text-ink-dim">
            Stock inicial
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex-1 text-sm font-medium text-ink-dim">
            Mínimo
            <input
              type="number"
              min="0"
              value={minimo}
              onChange={(e) => setMinimo(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={cerrar}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving} disabled={!nombre.trim()}>
            {saving ? 'Guardando…' : 'Agregar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
