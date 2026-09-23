import { Children } from 'react'

// accent = verde marca (Ventas); el resto son el mismo matiz asignado a
// cada área en el dashboard (ver ACCENTS en DashboardPage.jsx), para que
// la identidad de color sea consistente entre el panorama general y la
// página propia de cada módulo.
const VALUE_COLOR = {
  default: 'text-ink',
  accent: 'text-brand-700',
  brandLight: 'text-brand-500',
  green: 'text-green-700',
  emerald: 'text-emerald-700',
  lime: 'text-lime-800',
  teal: 'text-teal-700',
  warn: 'text-copper-ink',
  danger: 'text-red-700',
}

const BAR_COLOR = {
  default: 'bg-line-strong',
  accent: 'bg-brand-600',
  brandLight: 'bg-brand-400',
  green: 'bg-green-600',
  emerald: 'bg-emerald-600',
  lime: 'bg-lime-600',
  teal: 'bg-teal-600',
  warn: 'bg-copper',
  danger: 'bg-red-600',
}

export function MetricCard({ label, value, variant = 'default', onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`border border-line bg-surface p-3.5 text-left transition-transform duration-200 hover:-translate-y-0.5 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`animate-grow-x mb-2.5 h-0.5 w-6 origin-left ${BAR_COLOR[variant]}`} />
      <p className="mb-1 font-mono text-[0.6875rem] uppercase tracking-wide text-ink-faint">{label}</p>
      {/* text-base en móvil: montos como "MXN 410,000.00" no caben a text-xl
          en media pantalla de celular y se cortaban. break-words como red de
          seguridad para montos aún más largos (parte en el espacio). */}
      <p className={`break-words font-mono text-base font-semibold tabular-nums sm:text-xl ${VALUE_COLOR[variant]}`}>{value}</p>
    </Tag>
  )
}

// Clases literales (no interpoladas) para que Tailwind las detecte al compilar.
const SM_COLS = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
}

// Las columnas se ajustan a cuántas tarjetas hay: con una rejilla fija de 4,
// una fila de 3 dejaba una celda vacía que se veía como un bloque gris (es
// el color del `gap-px`). En móvil (2 columnas), una última tarjeta impar se
// estira a lo ancho por la misma razón.
export function MetricsRow({ children }) {
  const count = Children.toArray(children).length
  return (
    <div
      className={`stagger mb-5 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line ${SM_COLS[count] ?? 'sm:grid-cols-4'} [&>*]:border-0 [&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:col-span-1`}
    >
      {children}
    </div>
  )
}
