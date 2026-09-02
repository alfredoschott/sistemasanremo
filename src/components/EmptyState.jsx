export default function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      {Icon && <Icon className="mb-1 h-8 w-8 text-slate-300" strokeWidth={1.5} />}
      <p className="text-sm font-medium text-slate-500">{title}</p>
      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
    </div>
  )
}
