import { LogOut, Minus, Plus, WifiOff } from 'lucide-react'
import { useState } from 'react'
import BrandMark from '../components/BrandMark'
import NotificationBell from '../components/NotificationBell'
import { useAuth } from '../lib/AuthContext'
import { useOnlineStatus } from '../lib/useOnlineStatus'
import { useUiScale } from '../lib/useUiScale'

function ZoomControl() {
  const { scale, increase, decrease, reset, canIncrease, canDecrease } = useUiScale()

  return (
    <div className="flex items-center gap-0.5 rounded border border-white/15 bg-white/5 p-0.5">
      <button
        type="button"
        onClick={decrease}
        disabled={!canDecrease}
        title="Reducir tamaño de texto"
        aria-label="Reducir tamaño de texto"
        className="flex h-6 w-6 items-center justify-center rounded text-white/80 transition-colors hover:bg-white/15 disabled:pointer-events-none disabled:opacity-30"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={reset}
        title="Restablecer tamaño de texto"
        aria-label="Restablecer tamaño de texto"
        className="rounded px-1 py-0.5 font-mono text-[0.625rem] text-white/60 transition-colors hover:bg-white/15 hover:text-white/90"
      >
        {Math.round(scale)}%
      </button>
      <button
        type="button"
        onClick={increase}
        disabled={!canIncrease}
        title="Aumentar tamaño de texto"
        aria-label="Aumentar tamaño de texto"
        className="flex h-6 w-6 items-center justify-center rounded text-white/80 transition-colors hover:bg-white/15 disabled:pointer-events-none disabled:opacity-30"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export default function Topbar() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const online = useOnlineStatus()

  return (
    <header className="relative grid h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-brand-950/60 bg-gradient-to-b from-brand-900 to-brand-800 px-4 text-white">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-400/60 to-transparent" />
      <div className="pointer-events-none absolute left-3 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-white/15" />
      <div className="pointer-events-none absolute right-3 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-white/15" />

      <div className="flex items-center gap-2">
        <ZoomControl />
        {!online && (
          <span className="flex items-center gap-1.5 rounded border border-copper/40 bg-copper-soft/20 px-2 py-1 font-mono text-[0.6875rem] font-medium uppercase tracking-wide text-copper-ink/90">
            <WifiOff className="h-3 w-3" />
            <span className="hidden sm:inline">Sin conexión</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="rounded border border-white/10 bg-surface px-2.5 py-1">
          <BrandMark compact className="h-7 w-auto" />
        </div>
        <div className="hidden leading-tight sm:block">
          <div className="font-display text-sm uppercase tracking-wide text-white">SRM · Telsa</div>
          <div className="font-mono text-[0.625rem] uppercase tracking-widest text-brand-100/60">
            Sanremo de México
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1">
        <NotificationBell />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            onBlur={() => setTimeout(() => setMenuOpen(false), 120)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm text-brand-50/90 transition-colors hover:bg-surface/10"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                referrerPolicy="no-referrer"
                className="h-6 w-6 rounded-full"
              />
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface/15 text-xs font-semibold">
                {user?.email?.[0]?.toUpperCase()}
              </span>
            )}
            <span className="hidden max-w-40 truncate sm:inline">{user?.email}</span>
          </button>

          {menuOpen && (
            <div className="animate-scale-in absolute right-0 top-11 w-48 overflow-hidden rounded-lg border border-line bg-surface text-ink shadow-xl">
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface-2"
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
