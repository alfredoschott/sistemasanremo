export default function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      {Icon && <Icon className="mb-1 h-8 w-8 text-line-strong" strokeWidth={1.5} />}
      <p className="text-sm font-medium text-ink-faint">{title}</p>
      {subtitle && <p className="text-xs text-ink-faint">{subtitle}</p>}
    </div>
  )
}
