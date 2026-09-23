import { useMemo, useState } from 'react'
import BarraGrafica from '../../components/BarraGrafica'
import { currencyCompact as currency } from '../../lib/currency'
import { useCotizaciones } from '../ventas/useCotizaciones'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MESES_A_MOSTRAR = 6

// Últimos N meses (incluyendo el actual), más viejo primero — así la
// barra de la derecha siempre es "ahora", como se lee un timeline.
function ultimosMeses(n) {
  const hoy = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - (n - 1 - i), 1)
    return { anio: d.getFullYear(), mes: d.getMonth() }
  })
}

export default function VentasTrendChart() {
  const { cotizaciones } = useCotizaciones()
  const [hover, setHover] = useState(null)

  const datos = useMemo(() => {
    const meses = ultimosMeses(MESES_A_MOSTRAR)
    const totales = meses.map(() => 0)

    cotizaciones
      .filter((c) => c.estado === 'Facturado')
      .forEach((c) => {
        const ms = (c.fechaFacturado ?? c.fecha)?.toMillis?.()
        if (!ms) return
        const fecha = new Date(ms)
        const idx = meses.findIndex(
          (m) => m.anio === fecha.getFullYear() && m.mes === fecha.getMonth(),
        )
        if (idx !== -1) totales[idx] += c.monto ?? 0
      })

    return meses.map((m, i) => ({ label: MESES[m.mes], anio: m.anio, total: totales[i] }))
  }, [cotizaciones])

  const max = Math.max(...datos.map((d) => d.total), 1)
  const total = datos.reduce((sum, d) => sum + d.total, 0)

  if (total === 0) return null

  return (
    <div className="mt-6 rounded-lg border border-line bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">Facturado por mes</h2>
        <p className="font-mono text-xs text-ink-faint">
          {currency.format(total)} · últimos {MESES_A_MOSTRAR} meses
        </p>
      </div>

      <div className="flex h-36 items-end gap-3 pt-5">
        {datos.map((d, i) => (
          <div
            key={`${d.anio}-${d.label}`}
            className="flex h-full flex-1 flex-col items-center gap-1.5"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <BarraGrafica
              valor={d.total}
              max={max}
              activo={hover === i}
              colorClass={hover === i ? 'bg-brand-700' : 'bg-brand-600'}
              titulo={`${d.label} ${d.anio}: ${currency.format(d.total)}`}
            />
            <span className="font-mono text-[0.6875rem] uppercase text-ink-faint">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
