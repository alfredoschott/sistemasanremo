import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { useState } from 'react'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { registrarAuditoria } from '../../lib/audit'
import { db } from '../../lib/firebase'
import { crearNotificacion } from '../../lib/notify'
import { useToast } from '../../lib/ToastContext'
import ProveedorMaterialesFila from './ProveedorMaterialesFila'

function generarNumeroSerie() {
  const year = new Date().getFullYear()
  const suffix = Date.now().toString().slice(-6)
  return `OF-${year}-${suffix}`
}

function filaVacia() {
  return { proveedorId: '', plazoEntregaDias: '20', fechaCompromiso: '', materiales: [] }
}

export default function AbrirOFModal({ cotizacion, onClose }) {
  const [proveedores, setProveedores] = useState([])
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  if (!cotizacion) return null

  const agregarProveedor = () => setProveedores((prev) => [...prev, filaVacia()])
  const quitarProveedor = (i) => setProveedores((prev) => prev.filter((_, idx) => idx !== i))
  const actualizarProveedor = (i) => (fila) =>
    setProveedores((prev) => prev.map((f, idx) => (idx === i ? fila : f)))

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
          fechaCompromiso: f.fechaCompromiso || null,
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
          fechaCompromiso: prov.fechaCompromiso,
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
          <ProveedorMaterialesFila
            key={i}
            label={`Proveedor ${i + 1}`}
            fila={fila}
            onChange={actualizarProveedor(i)}
            onRemove={() => quitarProveedor(i)}
          />
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
