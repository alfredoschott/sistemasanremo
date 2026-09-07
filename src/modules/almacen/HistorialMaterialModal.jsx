import { ArrowDownCircle, ArrowUpCircle, Undo2 } from 'lucide-react'
import { useState } from 'react'
import IconButton from '../../components/IconButton'
import Modal from '../../components/Modal'
import { useToast } from '../../lib/ToastContext'
import { revertirMovimientoManual } from './stockActions'
import { useMovimientosMaterial } from './useMovimientosMaterial'

function formatFecha(fecha) {
  const ms = fecha?.toMillis?.()
  if (!ms) return ''
  return new Date(ms).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function HistorialMaterialModal({ material, onClose }) {
  const movimientos = useMovimientosMaterial(material?.id)
  const [revirtiendoId, setRevirtiendoId] = useState(null)
  const toast = useToast()

  const revertir = async (m) => {
    if (
      !window.confirm(
        `¿Deshacer esta ${m.tipo === 'entrada' ? 'entrada' : 'salida'} de ${m.cantidad}? Ajustará el stock actual.`,
      )
    )
      return
    setRevirtiendoId(m.id)
    try {
      await revertirMovimientoManual({
        movimientoId: m.id,
        materialId: m.materialId,
        tipo: m.tipo,
        cantidad: m.cantidad,
      })
      toast('Movimiento revertido')
    } catch {
      toast('No se pudo revertir el movimiento.', 'error')
    } finally {
      setRevirtiendoId(null)
    }
  }

  return (
    <Modal
      open={Boolean(material)}
      onClose={onClose}
      title="Historial de movimientos"
      subtitle={material?.nombre}
      maxWidth="max-w-md"
    >
      {movimientos.length === 0 ? (
        <p className="text-sm text-ink-faint">Sin movimientos registrados todavía.</p>
      ) : (
        <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto">
          {movimientos.map((m) => (
            <li key={m.id} className="flex items-center gap-2.5 text-sm">
              {m.tipo === 'entrada' ? (
                <ArrowDownCircle className="h-4 w-4 shrink-0 text-brand-600" />
              ) : (
                <ArrowUpCircle className="h-4 w-4 shrink-0 text-amber-600" />
              )}
              <span className="flex-1 text-ink">
                {m.tipo === 'entrada' ? 'Entrada' : 'Salida'} de {m.cantidad}
                {m.referencia?.tipo === 'ordenCompra' && (
                  <span className="text-ink-faint"> · O.C.</span>
                )}
              </span>
              <span className="shrink-0 text-xs text-ink-faint">{formatFecha(m.fecha)}</span>
              {!m.referencia && (
                <IconButton
                  icon={Undo2}
                  disabled={revirtiendoId === m.id}
                  onClick={() => revertir(m)}
                  title="Deshacer este movimiento"
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
