import { LogOut, WifiOff } from 'lucide-react'
import { useState } from 'react'
import BrandMark from '../components/BrandMark'
import NotificationBell from '../components/NotificationBell'
import { useAuth } from '../lib/AuthContext'
import { useOnlineStatus } from '../lib/useOnlineStatus'

export default function Topbar() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const online = useOnlineStatus()

  return (
    <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-brand-900/40 bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 px-4 text-white shadow-sm">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-400/60 to-transparent" />
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-white/95 px-2.5 py-1 shadow-sm">
          <BrandMark compact className="h-7 w-auto" />
        </div>
        <span className="hidden text-xs tracking-wide text-brand-100/70 sm:inline">
          Sanremo de México
        </span>
        {!online && (
          <span className="flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-1 text-xs font-medium text-amber-200">
            <WifiOff className="h-3 w-3" />
            <span className="hidden sm:inline">Sin conexión</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <NotificationBell />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            onBlur={() => setTimeout(() => setMenuOpen(false), 120)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm text-brand-50/90 transition-colors hover:bg-white/10"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                referrerPolicy="no-referrer"
                className="h-6 w-6 rounded-full"
              />
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-xs font-semibold">
                {user?.email?.[0]?.toUpperCase()}
              </span>
            )}
            <span className="hidden max-w-40 truncate sm:inline">{user?.email}</span>
          </button>

          {menuOpen && (
            <div className="animate-scale-in absolute right-0 top-11 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xl">
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
