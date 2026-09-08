import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { X } from 'lucide-react'
import { useState } from 'react'
import MaterialNombre from '../almacen/MaterialNombre'
import MaterialPicker from '../almacen/MaterialPicker'
import Button from '../../components/Button'
import IconButton from '../../components/IconButton'
import Modal from '../../components/Modal'
import { db } from '../../lib/firebase'
import { crearNotificacion } from '../../lib/notify'
import { useToast } from '../../lib/ToastContext'
import { inputClass, inputClassInline } from '../../lib/ui'
import ProveedorPicker from './ProveedorPicker'

const lineaVacia = { materialId: '', cantidad: '1' }

function lineasFromOc(oc) {
  return oc.materiales?.length
    ? oc.materiales.map((l) => ({ materialId: l.materialId, cantidad: String(l.cantidad) }))
    : [{ ...lineaVacia }]
}

function OrdenCompraForm({ onClose, oc, lineaInicial }) {
  const [proveedorId, setProveedorId] = useState(oc?.proveedorId ?? '')
  const [plazoEntregaDias, setPlazoEntregaDias] = useState(String(oc?.plazoEntregaDias ?? '20'))
  const [fechaCompromiso, setFechaCompromiso] = useState(oc?.fechaCompromiso ?? '')
  const [montoTotal, setMontoTotal] = useState(String(oc?.montoTotal ?? ''))
  const [materiales, setMateriales] = useState(() => {
    if (oc) return lineasFromOc(oc)
    if (lineaInicial) return [lineaInicial]
    return [{ ...lineaVacia }]
  })
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const isEdit = Boolean(oc)
  const materialesBloqueados = isEdit && oc.estado !== 'pendiente'

  const updateLinea = (index, field) => (value) => {
    setMateriales((prev) =>
      prev.map((linea, i) => (i === index ? { ...linea, [field]: value } : linea)),
    )
  }

  const addLinea = () => setMateriales((prev) => [...prev, { ...lineaVacia }])
  const removeLinea = (index) =>
    setMateriales((prev) => prev.filter((_, i) => i !== index))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = {
        proveedorId,
        plazoEntregaDias: Number(plazoEntregaDias),
        fechaCompromiso: fechaCompromiso || null,
        montoTotal: montoTotal ? Number(montoTotal) : null,
        // Si ya se recibió, los materiales quedan fijos: el stock ya se sumó
        // con esas cantidades y editarlas aquí lo dejaría descuadrado.
        materiales: materialesBloqueados
          ? oc.materiales
          : materiales
              .filter((l) => l.materialId)
              .map((l) => ({ materialId: l.materialId, cantidad: Number(l.cantidad) || 1 })),
      }

      if (isEdit) {
        await updateDoc(doc(db, 'ordenesCompra', oc.id), data)
        toast('Orden de compra actualizada')
      } else {
        await addDoc(collection(db, 'ordenesCompra'), {
          ...data,
          estado: 'pendiente',
          fecha: serverTimestamp(),
        })
        toast('Orden de compra creada')
        crearNotificacion({ mensaje: 'Nueva orden de compra creada', tipo: 'info', link: '/compras' })
      }

      onClose()
    } catch {
      toast('No se pudo guardar la orden de compra. Intenta de nuevo.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="text-sm font-medium text-ink-dim">
        Proveedor
        <ProveedorPicker value={proveedorId} onChange={setProveedorId} />
      </label>

      <div className="flex gap-3">
        <label className="flex-1 text-sm font-medium text-ink-dim">
          Plazo de entrega (días)
          <input
            required
            type="number"
            min="1"
            value={plazoEntregaDias}
            onChange={(e) => setPlazoEntregaDias(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex-1 text-sm font-medium text-ink-dim">
          Fecha comprometida (opcional)
          <input
            type="date"
            value={fechaCompromiso}
            onChange={(e) => setFechaCompromiso(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <label className="text-sm font-medium text-ink-dim">
        Monto total (MXN) — opcional, para el flujo de caja
        <input
          type="number"
          min="0"
          value={montoTotal}
          onChange={(e) => setMontoTotal(e.target.value)}
          className={inputClass}
          placeholder="Costo de esta O.C."
        />
      </label>

      <div>
        <span className="text-sm font-medium text-ink-dim">Materiales</span>

        {materialesBloqueados ? (
          <div className="mt-1 rounded-md bg-surface-2 p-3">
            <ul className="flex flex-col gap-1 text-sm text-ink-dim">
              {oc.materiales.map((linea, i) => (
                <li key={i}>
                  {linea.cantidad}× <MaterialNombre materialId={linea.materialId} />
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-ink-faint">
              No editable: esta O.C. ya fue recibida y el stock se ajustó con estas cantidades.
            </p>
          </div>
        ) : (
          <>
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
                    <IconButton
                      type="button"
                      icon={X}
                      variant="danger"
                      onClick={() => removeLinea(index)}
                    />
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
          </>
        )}
      </div>

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving} disabled={!proveedorId}>
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear O.C.'}
        </Button>
      </div>
    </form>
  )
}

export default function NuevaOrdenCompraModal({ open, onClose, oc = null, lineaInicial = null }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={oc ? 'Editar orden de compra' : 'Nueva orden de compra'}
      maxWidth="max-w-lg"
    >
      <OrdenCompraForm
        key={oc?.id ?? lineaInicial?.materialId ?? 'new'}
        onClose={onClose}
        oc={oc}
        lineaInicial={lineaInicial}
      />
    </Modal>
  )
}
