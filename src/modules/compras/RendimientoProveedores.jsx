import { useMemo } from 'react'
import { TrendingUp } from 'lucide-react'
import EmptyState from '../../components/EmptyState'
import ProveedorNombre from './ProveedorNombre'
import { calcularRendimientoProveedores } from './proveedorRendimiento'

const COLOR_PCT = (pct) => {
  if (pct === null) return 'text-ink-faint'
  if (pct >= 80) return 'text-brand-700'
  if (pct >= 50) return 'text-amber-600'
  return 'text-red-600'
}

export default function RendimientoProveedores({ ordenes }) {
  const rendimiento = useMemo(() => calcularRendimientoProveedores(ordenes), [ordenes])

  return (
    <section>
      <h2 className="mb-1 text-xl font-semibold text-ink">Rendimiento de proveedores</h2>
      <p className="mb-3 text-sm text-ink-faint">
        % de O.C. recibidas dentro del plazo comprometido — solo cuenta las que ya tienen fecha
        límite capturada (plazo en días o fecha comprometida).
      </p>
      <div className="overflow-x-auto border border-line-strong bg-surface">
        {rendimiento.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="Sin datos todavía"
            subtitle="Aparece aquí en cuanto haya O.C. recibidas con plazo o fecha comprometida"
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-[0.625rem] font-mono uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3 text-right">O.C. recibidas</th>
                <th className="px-4 py-3 text-right">A tiempo</th>
                <th className="px-4 py-3 text-right">Tarde</th>
                <th className="px-4 py-3 text-right">% a tiempo</th>
                <th className="px-4 py-3 text-right">Atraso promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rendimiento.map((r) => (
                <tr key={r.proveedorId}>
                  <td className="px-4 py-3 font-medium text-ink">
                    <ProveedorNombre proveedorId={r.proveedorId} />
                  </td>
                  <td className="px-4 py-3 text-right text-ink-dim">{r.total}</td>
                  <td className="px-4 py-3 text-right text-ink-dim">{r.aTiempo}</td>
                  <td className="px-4 py-3 text-right text-ink-dim">{r.tarde}</td>
                  <td className={`px-4 py-3 text-right font-medium ${COLOR_PCT(r.pctATiempo)}`}>
                    {r.pctATiempo === null ? '—' : `${r.pctATiempo}%`}
                  </td>
                  <td className="px-4 py-3 text-right text-ink-dim">
                    {r.promedioDiasAtraso === null ? '—' : `${r.promedioDiasAtraso} días`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
