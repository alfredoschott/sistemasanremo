import { ESTADOS_COTIZACION } from '../lib/estados'

export default function Timeline({ estadoActual }) {
  const currentIndex = ESTADOS_COTIZACION.indexOf(estadoActual)

  return (
    <ol className="flex items-center">
      {ESTADOS_COTIZACION.map((estado, index) => {
        const done = index <= currentIndex
        const isLast = index === ESTADOS_COTIZACION.length - 1
        return (
          <li key={estado} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  done ? 'bg-brand-700 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`text-xs whitespace-nowrap ${done ? 'text-brand-800 font-medium' : 'text-slate-400'}`}
              >
                {estado}
              </span>
            </div>
            {!isLast && (
              <div className={`mx-2 h-0.5 flex-1 ${done ? 'bg-brand-700' : 'bg-slate-200'}`} />
            )}
          </li>
        )
      })}
    </ol>
  )
}
