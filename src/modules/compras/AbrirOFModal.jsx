import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { X } from 'lucide-react'
import { useState } from 'react'
import Button from '../../components/Button'
import IconButton from '../../components/IconButton'
import Modal from '../../components/Modal'
import { registrarAuditoria } from '../../lib/audit'
import { db } from '../../lib/firebase'
import { crearNotificacion } from '../../lib/notify'
import { useToast } from '../../lib/ToastContext'
import { inputClass, inputClassInline } from '../../lib/ui'
import MaterialPicker from '../almacen/MaterialPicker'
import ProveedorPicker from './ProveedorPicker'

function generarNumeroSerie() {
  const year = new Date().getFullYear()
  const suffix = Date.now().toString().slice(-6)
  return `OF-${year}-${suffix}`
}

function filaVacia() {
  return { proveedorId: '', plazoEntregaDias: '20', materiales: [] }
}

export default function AbrirOFModal({ cotizacion, onClose }) {
  const [proveedores, setProveedores] = useState([])
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  if (!cotizacion) return null

  const agregarProveedor = () => setProveedores((prev) => [...prev, filaVacia()])
  const quitarProveedor = (i) => setProveedores((prev) => prev.filter((_, idx) => idx !== i))
  const actualizarProveedor = (i, campo) => (valor) =>
    setProveedores((prev) => prev.map((f, idx) => (idx === i ? { ...f, [campo]: valor } : f)))

  const agregarMaterial = (i) =>
    setProveedores((prev) =>
      prev.map((f, idx) =>
        idx === i ? { ...f, materiales: [...f.materiales, { materialId: '', cantidad: '1' }] } : f,
      ),
    )
  const quitarMaterial = (i, j) =>
    setProveedores((prev) =>
      prev.map((f, idx) =>
        idx === i ? { ...f, materiales: f.materiales.filter((_, jdx) => jdx !== j) } : f,
      ),
    )
  const actualizarMaterial = (i, j, campo) => (valor) =>
    setProveedores((prev) =>
      prev.map((f, idx) =>
        idx === i
          ? {
              ...f,
              materiales: f.materiales.map((l, jdx) => (jdx === j ? { ...l, [campo]: valor } : l)),
            }
          : f,
      ),
    )

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const numeroSerie = generarNumeroSerie()
      const cotizacionRef = doc(db, 'cotizaciones', cotizacion.id)
      const ofRef = doc(collection(db, 'ordenesFabricacion'))

      const proveedoresValidos = proveedores
        .filter((f) => f.proveedorId)
        .map((f) => ({
          proveedorId: f.proveedorId,
          plazoEntregaDias: Number(f.plazoEntregaDias) || 20,
          materiales: f.materiales
            .filter((l) => l.materialId)
            .map((l) => ({ materialId: l.materialId, cantidad: Number(l.cantidad) || 1 })),
        }))

      const batch = writeBatch(db)
      batch.set(ofRef, {
        numeroSerie,
        cotizacionId: cotizacion.id,
        cliente: cotizacion.cliente,
        proveedores: proveedoresValidos,
        estado: 'Abierta',
        fecha: serverTimestamp(),
      })
      batch.update(cotizacionRef, { estado: 'OF abierta', ofId: ofRef.id, numeroSerie })

      // Por cada proveedor con materiales, se genera de una vez su O.C.
      // (enlazada a esta OF con ofId) — así Producción abre la compra de
      // materiales directamente, y al marcarla "recibida" en Compras el
      // stock entra solo a Almacén (recibirOrdenCompra ya hace eso).
      let ocCreadas = 0
      for (const prov of proveedoresValidos) {
        if (prov.materiales.length === 0) continue
        const ocRef = doc(collection(db, 'ordenesCompra'))
        batch.set(ocRef, {
          ofId: ofRef.id,
          proveedorId: prov.proveedorId,
          plazoEntregaDias: prov.plazoEntregaDias,
          montoTotal: null,
          materiales: prov.materiales,
          estado: 'pendiente',
          fecha: serverTimestamp(),
        })
        ocCreadas += 1
      }

      await batch.commit()

      onClose()
      toast(
        ocCreadas > 0
          ? `OF ${numeroSerie} abierta con ${ocCreadas} O.C. generada${ocCreadas > 1 ? 's' : ''}`
          : `OF ${numeroSerie} abierta para ${cotizacion.cliente}`,
      )
      crearNotificacion({
        mensaje: `OF ${numeroSerie} abierta para ${cotizacion.cliente}`,
        tipo: 'success',
        link: `/ventas/${cotizacion.id}`,
      })
      registrarAuditoria({
        entidad: 'cotizacion',
        entidadId: cotizacion.id,
        accion: 'OF abierta',
        detalle: numeroSerie,
      })
    } catch {
      toast('No se pudo abrir la OF. Intenta de nuevo.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open title="Abrir orden de fabricación" subtitle={cotizacion.cliente} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium text-ink-dim">Proveedores de materiales (opcional)</p>
          <p className="text-xs text-ink-faint">
            Agrega uno o varios proveedores; si les asignas materiales, se crea su O.C. de una vez.
          </p>
        </div>

        {proveedores.map((fila, i) => (
          <div key={i} className="rounded-md border border-line-strong p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[0.625rem] uppercase tracking-wide text-ink-faint">
                Proveedor {i + 1}
              </span>
              <IconButton
                type="button"
                icon={X}
                variant="danger"
                onClick={() => quitarProveedor(i)}
                title="Quitar proveedor"
              />
            </div>

            <label className="text-sm font-medium text-ink-dim">
              Proveedor
              <ProveedorPicker value={fila.proveedorId} onChange={actualizarProveedor(i, 'proveedorId')} />
            </label>

            <label className="mt-2 block text-sm font-medium text-ink-dim">
              Plazo de entrega (días)
              <input
                required
                type="number"
                min="1"
                value={fila.plazoEntregaDias}
                onChange={(e) => actualizarProveedor(i, 'plazoEntregaDias')(e.target.value)}
                className={inputClass}
              />
            </label>

            <div className="mt-2">
              <span className="text-sm font-medium text-ink-dim">Materiales a comprar</span>
              <div className="mt-1 flex flex-col gap-2">
                {fila.materiales.map((linea, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <div className="flex-1">
                      <MaterialPicker
                        inline
                        value={linea.materialId}
                        onChange={actualizarMaterial(i, j, 'materialId')}
                      />
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={linea.cantidad}
                      onChange={(e) => actualizarMaterial(i, j, 'cantidad')(e.target.value)}
                      className={`w-16 ${inputClassInline}`}
                    />
                    <IconButton
                      type="button"
                      icon={X}
                      variant="danger"
                      onClick={() => quitarMaterial(i, j)}
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => agregarMaterial(i)}
                className="mt-1.5 text-xs font-medium text-brand-700 transition-colors hover:text-brand-800 hover:underline"
              >
                + Agregar material
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={agregarProveedor}
          className="text-sm font-medium text-brand-700 transition-colors hover:text-brand-800 hover:underline"
        >
          + Agregar proveedor
        </button>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            {saving ? 'Abriendo…' : 'Abrir OF'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
