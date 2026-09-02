import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import Modal from '../../components/Modal'
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

  return (
    <Modal
      open={Boolean(material)}
      onClose={onClose}
      title="Historial de movimientos"
      subtitle={material?.nombre}
      maxWidth="max-w-md"
    >
      {movimientos.length === 0 ? (
        <p className="text-sm text-slate-400">Sin movimientos registrados todavía.</p>
      ) : (
        <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto">
          {movimientos.map((m) => (
            <li key={m.id} className="flex items-center gap-2.5 text-sm">
              {m.tipo === 'entrada' ? (
                <ArrowDownCircle className="h-4 w-4 shrink-0 text-brand-600" />
              ) : (
                <ArrowUpCircle className="h-4 w-4 shrink-0 text-amber-600" />
              )}
              <span className="flex-1 text-slate-700">
                {m.tipo === 'entrada' ? 'Entrada' : 'Salida'} de {m.cantidad}
                {m.referencia?.tipo === 'ordenCompra' && (
                  <span className="text-slate-400"> · O.C.</span>
                )}
              </span>
              <span className="shrink-0 text-xs text-slate-400">{formatFecha(m.fecha)}</span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
