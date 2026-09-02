const VARIANTS = {
  default: 'bg-slate-50',
  accent: 'bg-brand-50',
  warn: 'bg-amber-50',
  danger: 'bg-red-50',
}

const LABEL_COLOR = {
  default: 'text-slate-500',
  accent: 'text-brand-700',
  warn: 'text-amber-700',
  danger: 'text-red-700',
}

const VALUE_COLOR = {
  default: 'text-slate-800',
  accent: 'text-brand-800',
  warn: 'text-amber-800',
  danger: 'text-red-800',
}

export function MetricCard({ label, value, variant = 'default' }) {
  return (
    <div className={`rounded-lg p-3.5 transition-transform duration-150 hover:-translate-y-0.5 ${VARIANTS[variant]}`}>
      <p className={`mb-1 text-xs ${LABEL_COLOR[variant]}`}>{label}</p>
      <p className={`text-lg font-semibold ${VALUE_COLOR[variant]}`}>{value}</p>
    </div>
  )
}

export function MetricsRow({ children }) {
  return <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{children}</div>
}
