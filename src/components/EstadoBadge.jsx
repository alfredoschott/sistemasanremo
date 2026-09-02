import { ESTADO_BADGE, ESTADO_DOT } from '../lib/estados'

export default function EstadoBadge({ estado }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
        ESTADO_BADGE[estado] ?? 'bg-slate-100 text-slate-700'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${ESTADO_DOT[estado] ?? 'bg-slate-400'} ${
          estado === 'Facturado' ? '' : 'animate-pulse'
        }`}
      />
      {estado}
    </span>
  )
}
