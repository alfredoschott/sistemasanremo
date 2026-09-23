import { useMemo, useState } from 'react'
import BarraGrafica from '../../components/BarraGrafica'
import { currencyCompact as currency } from '../../lib/currency'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MESES_A_MOSTRAR = 6

function ultimosMeses(n) {
  const hoy = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - (n - 1 - i), 1)
    return { anio: d.getFullYear(), mes: d.getMonth() }
  })
}

// Compara, mes a mes, lo que efectivamente entró (cobrado) contra lo que
// salió (pagado) — a diferencia de "por cobrar/por pagar" (lo pendiente),
// esto es el flujo real ya ocurrido, para ver el patrón en el tiempo.
export default function FlujoMensualChart({ cobrados, pagados }) {
  const [hover, setHover] = useState(null)

  const datos = useMemo(() => {
    const meses = ultimosMeses(MESES_A_MOSTRAR)
    const cobradoPorMes = meses.map(() => 0)
    const pagadoPorMes = meses.map(() => 0)

    cobrados.forEach((c) => {
      const ms = c.fechaCobro?.toMillis?.()
      if (!ms) return
      const fecha = new Date(ms)
      const idx = meses.findIndex((m) => m.anio === fecha.getFullYear() && m.mes === fecha.getMonth())
      if (idx !== -1) cobradoPorMes[idx] += c.monto ?? 0
    })

    pagados.forEach((o) => {
      const ms = o.fechaPago?.toMillis?.()
      if (!ms) return
      const fecha = new Date(ms)
      const idx = meses.findIndex((m) => m.anio === fecha.getFullYear() && m.mes === fecha.getMonth())
      if (idx !== -1) pagadoPorMes[idx] += o.montoTotal ?? 0
    })

    return meses.map((m, i) => ({
      label: MESES[m.mes],
      anio: m.anio,
      cobrado: cobradoPorMes[i],
      pagado: pagadoPorMes[i],
    }))
  }, [cobrados, pagados])

  const max = Math.max(...datos.flatMap((d) => [d.cobrado, d.pagado]), 1)
  const total = datos.reduce((sum, d) => sum + d.cobrado + d.pagado, 0)

  if (total === 0) return null

  return (
    <div className="mt-6 rounded-lg border border-line bg-surface p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">Cobrado vs. pagado por mes</h2>
        <div className="flex items-center gap-3 text-xs text-ink-faint">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-600" />
            Cobrado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-copper" />
            Pagado
          </span>
        </div>
      </div>

      <div className="flex h-36 items-end gap-3 pt-5">
        {datos.map((d, i) => {
          const activo = hover === i
          return (
            <div
              key={`${d.anio}-${d.label}`}
              className="flex h-full flex-1 flex-col items-center gap-1.5"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <div className="flex w-full flex-1 gap-1">
                <BarraGrafica
                  valor={d.cobrado}
                  max={max}
                  activo={activo}
                  colorClass={activo ? 'bg-brand-700' : 'bg-brand-600'}
                  titulo={`Cobrado ${d.label} ${d.anio}: ${currency.format(d.cobrado)}`}
                />
                <BarraGrafica
                  valor={d.pagado}
                  max={max}
                  activo={activo}
                  colorClass={activo ? 'bg-copper' : 'bg-copper/85'}
                  titulo={`Pagado ${d.label} ${d.anio}: ${currency.format(d.pagado)}`}
                />
              </div>
              <span className="font-mono text-[0.6875rem] uppercase text-ink-faint">{d.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
