import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { AlertTriangle, ShoppingCart } from 'lucide-react'
import { useMemo, useState } from 'react'
import Button from '../../components/Button'
import IconButton from '../../components/IconButton'
import Modal from '../../components/Modal'
import { registrarAuditoria } from '../../lib/audit'
import { db } from '../../lib/firebase'
import { crearNotificacion } from '../../lib/notify'
import { actualizarSeguimiento } from '../../lib/seguimientoPublico'
import { useToast } from '../../lib/ToastContext'
import MaterialNombre from '../almacen/MaterialNombre'
import { useMateriales } from '../almacen/useMateriales'
import { calcularMaterialesRequeridos } from '../produccion/materialesRequeridos'
import { useListasMateriales } from '../produccion/useListasMateriales'
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
  const { listas: listasMateriales } = useListasMateriales()
  const { materiales } = useMateriales()

  const modelos = useMemo(
    () => [...new Set((cotizacion?.items ?? []).map((i) => i.modelo).filter(Boolean))],
    [cotizacion],
  )

  // Se muestra antes de abrir la OF —para que Compras vea de una vez qué
  // necesita este pedido y qué falta— y es el mismo cálculo que queda
  // guardado en la OF al confirmar (ver materialesRequeridos.js).
  const materialesRequeridos = useMemo(
    () => calcularMaterialesRequeridos(cotizacion?.items, listasMateriales),
    [cotizacion, listasMateriales],
  )
  const stockDe = (id) => materiales.find((m) => m.id === id)?.stock ?? 0

  if (!cotizacion) return null

  const agregarProveedor = () => setProveedores((prev) => [...prev, filaVacia()])
  const quitarProveedor = (i) => setProveedores((prev) => prev.filter((_, idx) => idx !== i))
  const actualizarProveedor = (i) => (fila) =>
    setProveedores((prev) => prev.map((f, idx) => (idx === i ? fila : f)))

  // Atajo desde la tabla de "Materiales para este pedido": manda el
  // material directo al último proveedor de la lista (se crea uno si no
  // hay ninguno todavía) en vez de tener que volver a buscarlo a mano en
  // "+ Agregar material". Si ya estaba en ese proveedor, suma la cantidad
  // en vez de duplicar la línea.
  const agregarMaterialAProveedor = (materialId, cantidadSugerida) => {
    setProveedores((prev) => {
      const base = prev.length > 0 ? prev : [filaVacia()]
      const ultimo = base.length - 1
      const fila = base[ultimo]
      const yaExiste = fila.materiales.some((l) => l.materialId === materialId)
      const materiales = yaExiste
        ? fila.materiales.map((l) =>
            l.materialId === materialId
              ? { ...l, cantidad: String((Number(l.cantidad) || 0) + cantidadSugerida) }
              : l,
          )
        : [...fila.materiales, { materialId, cantidad: String(cantidadSugerida) }]
      return base.map((f, i) => (i === ultimo ? { ...f, materiales } : f))
    })
    toast('Agregado al proveedor para su O.C.')
  }

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
        // Modelos cotizados, sin duplicados — para que en Producción/Compras
        // se vea de una vez qué se va a fabricar sin tener que ir a Ventas.
        modelos,
        proveedores: proveedoresValidos,
        // Mismo cálculo que ya se muestra arriba en el modal (lista de
        // materiales del modelo cotizado × cantidad) — queda como copia
        // propia de esta OF, editable después sin tocar el estándar.
        materialesRequeridos,
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
      actualizarSeguimiento(cotizacion.id, { estado: 'OF abierta' })

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
        areas: ['ventas', 'compras', 'produccion'],
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
    <Modal
      open
      title="Abrir orden de fabricación"
      subtitle={modelos.length > 0 ? `${cotizacion.cliente} — ${modelos.join(', ')}` : cotizacion.cliente}
      onClose={onClose}
    >
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium text-ink-dim">Materiales para este pedido</p>
          {materialesRequeridos.length === 0 ? (
            <p className="mt-1 text-xs text-ink-faint">
              Ninguno de los modelos cotizados tiene lista de materiales capturada — se puede
              agregar después desde la OF.
            </p>
          ) : (
            <div className="mt-1 overflow-hidden rounded-md border border-line-strong">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-[0.625rem] font-mono uppercase tracking-wide text-ink-faint">
                  <tr>
                    <th className="px-3 py-2">Material</th>
                    <th className="px-3 py-2 text-right">Necesario</th>
                    <th className="px-3 py-2 text-right">Disponible</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {materialesRequeridos.map((linea) => {
                    const disponible = stockDe(linea.materialId)
                    const falta = Math.max(0, linea.cantidadPlan - disponible)
                    return (
                      <tr key={linea.materialId}>
                        <td className="px-3 py-2 font-medium text-ink">
                          <MaterialNombre materialId={linea.materialId} />
                          {falta > 0 && (
                            <span className="ml-2 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-red-100 px-2 py-0.5 text-[0.6875rem] font-medium text-red-700">
                              <AlertTriangle className="h-3 w-3" />
                              Falta {falta}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-ink-dim">{linea.cantidadPlan}</td>
                        <td className="px-3 py-2 text-right text-ink-dim">{disponible}</td>
                        <td className="px-3 py-2 text-right">
                          <IconButton
                            type="button"
                            icon={ShoppingCart}
                            onClick={() =>
                              agregarMaterialAProveedor(linea.materialId, falta > 0 ? falta : 1)
                            }
                            title="Agregar a un proveedor para generar su O.C."
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
