import { useAuth } from '../lib/AuthContext'

export default function Topbar() {
  const { user, logout } = useAuth()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-brand-800 px-4 text-white">
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold tracking-tight">SRM Telsa</span>
        <span className="text-sm text-brand-50/80">Transformadores</span>
      </div>
      <div className="flex items-center gap-3 text-sm text-brand-50/80">
        <span>{user?.email}</span>
        <button onClick={logout} className="rounded-md px-2 py-1 hover:bg-white/10">
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}
