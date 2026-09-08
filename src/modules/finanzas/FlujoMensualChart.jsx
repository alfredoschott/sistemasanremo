import { useMemo, useState } from 'react'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MESES_A_MOSTRAR = 6

const currency = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

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

      <div className="flex h-32 items-end gap-3">
        {datos.map((d, i) => {
          const activo = hover === i
          return (
            <div
              key={`${d.anio}-${d.label}`}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {activo && (d.cobrado > 0 || d.pagado > 0) && (
                <span className="mb-0.5 whitespace-nowrap font-mono text-[0.625rem] font-semibold text-ink-dim">
                  {currency.format(d.cobrado)} / {currency.format(d.pagado)}
                </span>
              )}
              <div className="flex w-full flex-1 items-end gap-1">
                <div
                  className={`w-full rounded-t-sm transition-colors ${activo ? 'bg-brand-700' : 'bg-brand-600'}`}
                  style={{ height: `${d.cobrado > 0 ? Math.max((d.cobrado / max) * 100, 4) : 2}%` }}
                  title={`Cobrado ${d.label} ${d.anio}: ${currency.format(d.cobrado)}`}
                />
                <div
                  className="w-full rounded-t-sm bg-copper transition-opacity"
                  style={{
                    height: `${d.pagado > 0 ? Math.max((d.pagado / max) * 100, 4) : 2}%`,
                    opacity: activo ? 1 : 0.85,
                  }}
                  title={`Pagado ${d.label} ${d.anio}: ${currency.format(d.pagado)}`}
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
