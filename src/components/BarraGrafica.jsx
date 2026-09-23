import { currencyCompact, montoCorto } from '../lib/currency'

// Una barra vertical con su monto encima, siempre visible (en celular no
// hay "hover" para descubrirlo). La etiqueta se posiciona justo arriba de
// la barra; el contenedor de la gráfica reserva espacio arriba (pt-5) para
// que la barra más alta no corte su etiqueta. Al pasar el mouse muestra el
// monto completo en vez del abreviado.
export default function BarraGrafica({ valor, max, colorClass, activo, titulo }) {
  const altura = valor > 0 ? Math.max((valor / max) * 100, 4) : 2
  return (
    <div className="relative h-full w-full">
      {valor > 0 && (
        <span
          className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[0.625rem] ${
            activo ? 'z-10 rounded bg-surface px-1 font-semibold text-ink shadow-sm' : 'text-ink-faint'
          }`}
          style={{ bottom: `calc(${altura}% + 2px)` }}
        >
          {activo ? currencyCompact.format(valor) : montoCorto(valor)}
        </span>
      )}
      <div
        className={`absolute inset-x-0 bottom-0 rounded-t-sm transition-colors ${valor > 0 ? colorClass : 'bg-line'}`}
        style={{ height: `${altura}%` }}
        title={titulo}
      />
    </div>
  )
}
