import { X } from 'lucide-react'
import IconButton from '../../components/IconButton'
import { inputClass, inputClassInline } from '../../lib/ui'
import MaterialPicker from '../almacen/MaterialPicker'
import ProveedorPicker from './ProveedorPicker'

// Bloque de "un proveedor + su plazo + los materiales que se le van a
// comprar", reutilizado tanto al abrir una OF (AbrirOFModal, varias filas)
// como al agregarle un proveedor después (AgregarProveedorOFModal, una
// fila sola) — mismo diseño, mismo comportamiento en los dos lugares.
export default function ProveedorMaterialesFila({ fila, onChange, onRemove, label }) {
  const set = (campo) => (valor) => onChange({ ...fila, [campo]: valor })

  const addMaterial = () =>
    onChange({ ...fila, materiales: [...fila.materiales, { materialId: '', cantidad: '1' }] })
  const removeMaterial = (j) =>
    onChange({ ...fila, materiales: fila.materiales.filter((_, i) => i !== j) })
  const setMaterial = (j, campo) => (valor) =>
    onChange({
      ...fila,
      materiales: fila.materiales.map((l, i) => (i === j ? { ...l, [campo]: valor } : l)),
    })

  return (
    <div className="rounded-md border border-line-strong p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[0.625rem] uppercase tracking-wide text-ink-faint">
          {label}
        </span>
        {onRemove && (
          <IconButton type="button" icon={X} variant="danger" onClick={onRemove} title="Quitar proveedor" />
        )}
      </div>

      <label className="text-sm font-medium text-ink-dim">
        Proveedor
        <ProveedorPicker value={fila.proveedorId} onChange={set('proveedorId')} />
      </label>

      <div className="mt-2 flex gap-3">
        <label className="flex-1 text-sm font-medium text-ink-dim">
          Plazo de entrega (días)
          <input
            required
            type="number"
            min="1"
            value={fila.plazoEntregaDias}
            onChange={(e) => set('plazoEntregaDias')(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex-1 text-sm font-medium text-ink-dim">
          Fecha comprometida (opcional)
          <input
            type="date"
            value={fila.fechaCompromiso ?? ''}
            onChange={(e) => set('fechaCompromiso')(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      <p className="mt-0.5 text-xs text-ink-faint">
        Si el proveedor ya dio una fecha exacta, ponla aquí — manda sobre el plazo en días.
      </p>

      <div className="mt-2">
        <span className="text-sm font-medium text-ink-dim">Materiales a comprar</span>
        <div className="mt-1 flex flex-col gap-2">
          {fila.materiales.map((linea, j) => (
            <div key={j} className="flex items-center gap-2">
              <div className="flex-1">
                <MaterialPicker inline value={linea.materialId} onChange={setMaterial(j, 'materialId')} />
              </div>
              <input
                type="number"
                min="1"
                value={linea.cantidad}
                onChange={(e) => setMaterial(j, 'cantidad')(e.target.value)}
                className={`w-16 ${inputClassInline}`}
              />
              <IconButton type="button" icon={X} variant="danger" onClick={() => removeMaterial(j)} />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addMaterial}
          className="mt-1.5 text-xs font-medium text-brand-700 transition-colors hover:text-brand-800 hover:underline"
        >
          + Agregar material
        </button>
      </div>
    </div>
  )
}
