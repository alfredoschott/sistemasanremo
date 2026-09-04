import { History } from 'lucide-react'
import { useAuditoria } from '../../lib/useAuditoria'

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

export default function Auditoria({ cotizacionId }) {
  const eventos = useAuditoria(cotizacionId)

  if (eventos.length === 0) return null

  return (
    <div className="mt-6 border-t border-line pt-6">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink">
        <History className="h-4 w-4" />
        Historial
      </h2>
      <ul className="flex flex-col gap-2 text-sm">
        {eventos.map((e) => (
          <li key={e.id} className="flex items-start justify-between gap-3 text-ink-dim">
            <span>
              <span className="font-medium text-ink">{e.accion}</span>
              {e.detalle && <span className="text-ink-faint"> · {e.detalle}</span>}
              <span className="text-ink-faint"> — {e.usuario}</span>
            </span>
            <span className="shrink-0 text-xs text-ink-faint">{formatFecha(e.fecha)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
