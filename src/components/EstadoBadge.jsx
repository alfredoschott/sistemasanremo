import { ESTADO_BADGE, ESTADO_DOT } from '../lib/estados'

export default function EstadoBadge({ estado }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-[0.6875rem] font-semibold uppercase tracking-wide transition-colors ${
        ESTADO_BADGE[estado] ?? 'bg-surface-2 text-ink'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${ESTADO_DOT[estado] ?? 'bg-ink-faint'} ${
          estado === 'Facturado' ? '' : 'animate-pulse'
        }`}
      />
      {estado}
    </span>
  )
}
