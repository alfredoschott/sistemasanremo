import { ClipboardList } from 'lucide-react'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import { TableSkeleton } from '../../components/Skeleton'
import { currency } from '../../lib/currency'

export default function CotizacionesPorAbrirOF({ cotizaciones, loading, onAbrirOF }) {
  return (
    <section>
      <h1 className="mb-3 text-xl font-semibold text-ink">Cotizaciones por abrir OF</h1>
      <div className="overflow-x-auto border border-line-strong bg-surface">
        <table className="hidden w-full text-left text-sm lg:table">
          <thead className="bg-surface-2 text-[0.625rem] font-mono uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Monto</th>
              <th className="px-4 py-3">Entrega comprometida</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="stagger divide-y divide-line">
            {loading && <TableSkeleton rows={2} cols={4} />}
            {!loading && cotizaciones.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <EmptyState
                    icon={ClipboardList}
                    title="No hay cotizaciones esperando OF"
                    subtitle="Aparecerán aquí cuando Ventas cotice a un cliente"
                  />
                </td>
              </tr>
            )}
            {cotizaciones.map((cot) => (
              <tr key={cot.id} className="transition-colors hover:bg-surface-2">
                <td className="px-4 py-3 font-medium text-ink">{cot.cliente}</td>
                <td className="px-4 py-3 text-ink-dim">{currency.format(cot.monto ?? 0)}</td>
                <td className="px-4 py-3 text-ink-dim">{cot.entregaSemanas} sem.</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" onClick={() => onAbrirOF(cot)}>
                    Abrir OF
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="divide-y divide-line lg:hidden">
          {loading && (
            <div className="flex flex-col gap-2.5 p-4">
              <div className="skeleton h-4 w-2/3 rounded-md" />
              <div className="skeleton h-4 w-1/3 rounded-md" />
            </div>
          )}
          {!loading && cotizaciones.length === 0 && (
            <EmptyState
              icon={ClipboardList}
              title="No hay cotizaciones esperando OF"
              subtitle="Aparecerán aquí cuando Ventas cotice a un cliente"
            />
          )}
          {cotizaciones.map((cot) => (
            <div key={cot.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{cot.cliente}</p>
                <p className="text-sm text-ink-faint">
                  {currency.format(cot.monto ?? 0)} · {cot.entregaSemanas} sem.
                </p>
              </div>
              <Button size="sm" className="shrink-0" onClick={() => onAbrirOF(cot)}>
                Abrir OF
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
