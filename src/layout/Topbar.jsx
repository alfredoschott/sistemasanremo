export default function Topbar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-brand-800 px-4 text-white">
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold tracking-tight">SRM Telsa</span>
        <span className="text-sm text-brand-50/80">Transformadores</span>
      </div>
      <span className="text-sm text-brand-50/70">Sanremo de México</span>
    </header>
  )
}
