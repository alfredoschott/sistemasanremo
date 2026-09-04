const VALUE_COLOR = {
  default: 'text-ink',
  accent: 'text-brand-700',
  warn: 'text-copper-ink',
  danger: 'text-red-700',
}

const BAR_COLOR = {
  default: 'bg-line-strong',
  accent: 'bg-brand-600',
  warn: 'bg-copper',
  danger: 'bg-red-600',
}

export function MetricCard({ label, value, variant = 'default' }) {
  return (
    <div className="border border-line bg-surface p-3.5 transition-transform duration-200 hover:-translate-y-0.5">
      <div className={`animate-grow-x mb-2.5 h-0.5 w-6 origin-left ${BAR_COLOR[variant]}`} />
      <p className="mb-1 font-mono text-[0.6875rem] uppercase tracking-wide text-ink-faint">{label}</p>
      <p className={`font-mono text-xl font-semibold tabular-nums ${VALUE_COLOR[variant]}`}>{value}</p>
    </div>
  )
}

export function MetricsRow({ children }) {
  return (
    <div className="stagger mb-5 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line sm:grid-cols-4 [&>*]:border-0">
      {children}
    </div>
  )
}
