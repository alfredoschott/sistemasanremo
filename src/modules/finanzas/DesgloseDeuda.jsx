import EmptyState from '../../components/EmptyState'
import { Wallet } from 'lucide-react'
import { currency } from '../../lib/currency'

export default function DesgloseDeuda({ titulo, grupos, emptyTitle, nombreDe, etiquetaConteo }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-ink">{titulo}</h2>
      <div className="overflow-x-auto border border-line-strong bg-surface">
        {grupos.length === 0 ? (
          <EmptyState icon={Wallet} title={emptyTitle} />
        ) : (
          <ul className="divide-y divide-line">
            {grupos.map((g) => (
              <li key={g.clave} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <p className="min-w-0 truncate font-medium text-ink">{nombreDe(g.clave)}</p>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-ink-faint">
                    {g.count} {g.count === 1 ? etiquetaConteo.singular : etiquetaConteo.plural}
                  </span>
                  <span className="font-medium text-ink">{currency.format(g.monto)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
