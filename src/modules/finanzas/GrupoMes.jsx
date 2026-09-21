import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { currency } from '../../lib/currency'

export default function GrupoMes({ label, total, count, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-line last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 bg-surface-2 px-4 py-2 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? '' : '-rotate-90'}`} />
          {label}
          <span className="font-normal normal-case text-ink-faint">({count})</span>
        </span>
        <span className="text-xs font-semibold text-ink">{currency.format(total)}</span>
      </button>
      {open && <ul className="stagger divide-y divide-line">{children}</ul>}
    </div>
  )
}
