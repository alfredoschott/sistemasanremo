import { ESTADO_BADGE } from '../lib/estados'

export default function EstadoBadge({ estado }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        ESTADO_BADGE[estado] ?? 'bg-slate-100 text-slate-700'
      }`}
    >
      {estado}
    </span>
  )
}
