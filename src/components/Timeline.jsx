import { Check, X } from 'lucide-react'
import { ESTADOS_COTIZACION } from '../lib/estados'

export default function Timeline({ estadoActual }) {
  const currentIndex = ESTADOS_COTIZACION.indexOf(estadoActual)

  if (estadoActual === 'Cancelado') {
    return (
      <div className="flex items-center gap-2 rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        <X className="h-4 w-4" />
        Cotización cancelada
      </div>
    )
  }

  return (
    <ol className="flex items-center">
      {ESTADOS_COTIZACION.map((estado, index) => {
        const done = index < currentIndex
        const active = index === currentIndex
        const isLast = index === ESTADOS_COTIZACION.length - 1
        return (
          <li key={estado} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                  done
                    ? 'bg-brand-700 text-white'
                    : active
                      ? 'bg-brand-700 text-white shadow-[0_0_0_4px] shadow-brand-100'
                      : 'bg-line text-ink-faint'
                }`}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : index + 1}
              </div>
              <span
                className={`text-xs whitespace-nowrap transition-colors ${
                  done || active ? 'font-medium text-brand-800' : 'text-ink-faint'
                }`}
              >
                {estado}
              </span>
            </div>
            {!isLast && (
              <div className="mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full bg-brand-700 transition-all duration-500 ease-out"
                  style={{ width: done ? '100%' : '0%' }}
                />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
