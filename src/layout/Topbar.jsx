import { LogOut, Minus, Plus, ShieldCheck, WifiOff } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import GlobalSearch from '../components/GlobalSearch'
import NotificationBell from '../components/NotificationBell'
import { useAuth } from '../lib/AuthContext'
import { useOnlineStatus } from '../lib/useOnlineStatus'
import { useRoles } from '../lib/RolesContext'
import { useUiScale } from '../lib/useUiScale'

// Todo este archivo usa tamaños fijos en px (h-[16px], no h-4) a propósito:
// el control de zoom de abajo escala el tamaño de texto de <html> (rem) para
// agrandar el CONTENIDO de cada página — la barra verde y sus botones deben
// quedarse del mismo tamaño siempre, así que no pueden depender de rem.
function ZoomControl() {
  const { scale, increase, decrease, reset, canIncrease, canDecrease } = useUiScale()

  return (
    <div className="flex items-center gap-[2px] rounded border border-white/15 bg-white/5 p-[2px]">
      <button
        type="button"
        onClick={decrease}
        disabled={!canDecrease}
        title="Reducir tamaño de texto"
        aria-label="Reducir tamaño de texto"
        className="flex h-[24px] w-[24px] items-center justify-center rounded text-white/80 transition-colors hover:bg-white/15 disabled:pointer-events-none disabled:opacity-30"
      >
        <Minus className="h-[14px] w-[14px]" />
      </button>
      <button
        type="button"
        onClick={reset}
        title="Restablecer tamaño de texto"
        aria-label="Restablecer tamaño de texto"
        className="rounded px-[4px] py-[2px] font-mono text-[10px] text-white/60 transition-colors hover:bg-white/15 hover:text-white/90"
      >
        {Math.round(scale)}%
      </button>
      <button
        type="button"
        onClick={increase}
        disabled={!canIncrease}
        title="Aumentar tamaño de texto"
        aria-label="Aumentar tamaño de texto"
        className="flex h-[24px] w-[24px] items-center justify-center rounded text-white/80 transition-colors hover:bg-white/15 disabled:pointer-events-none disabled:opacity-30"
      >
        <Plus className="h-[14px] w-[14px]" />
      </button>
    </div>
  )
}

export default function Topbar() {
  const { user, logout } = useAuth()
  const { esAdmin } = useRoles()
  const [menuOpen, setMenuOpen] = useState(false)
  const online = useOnlineStatus()

  return (
    <header
      className="relative z-10 grid min-h-[64px] shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-brand-950/60 bg-gradient-to-b from-brand-900 to-brand-800 pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] pt-[env(safe-area-inset-top)] text-white"
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-400/60 to-transparent" />
      <div className="pointer-events-none absolute left-[12px] top-1/2 h-[4px] w-[4px] -translate-y-1/2 rounded-full bg-white/15" />
      <div className="pointer-events-none absolute right-[12px] top-1/2 h-[4px] w-[4px] -translate-y-1/2 rounded-full bg-white/15" />

      <div className="flex items-center gap-[8px]">
        <ZoomControl />
        {!online && (
          <span className="flex items-center gap-[6px] rounded border border-copper/40 bg-copper-soft/20 px-[8px] py-[4px] font-mono text-[11px] font-medium uppercase tracking-wide text-copper-ink/90">
            <WifiOff className="h-[12px] w-[12px]" />
            <span className="hidden sm:inline">Sin conexión</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-[12px]">
        <div className="rounded border border-white/10 bg-surface px-[10px] py-[4px]">
          <BrandMark compact className="h-[28px] w-auto" />
        </div>
        <div className="hidden leading-tight sm:block">
          <div className="font-display text-[14px] uppercase tracking-wide text-white">SRM · Telsa</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-brand-100/60">
            Sanremo de México
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-[4px]">
        <GlobalSearch />
        <NotificationBell />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            onBlur={() => setTimeout(() => setMenuOpen(false), 120)}
            className="flex items-center gap-[8px] rounded-full py-[4px] pl-[4px] pr-[12px] text-[14px] text-brand-50/90 transition-colors hover:bg-surface/10"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                referrerPolicy="no-referrer"
                className="h-[24px] w-[24px] rounded-full"
              />
            ) : (
              <span className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-surface/15 text-[12px] font-semibold">
                {user?.email?.[0]?.toUpperCase()}
              </span>
            )}
            <span className="hidden max-w-[160px] truncate sm:inline">{user?.email}</span>
          </button>

          {menuOpen && (
            <div className="animate-scale-in absolute right-0 top-[44px] w-48 overflow-hidden rounded-lg border border-line bg-surface text-ink shadow-xl">
              {esAdmin && (
                <Link
                  to="/usuarios"
                  className="flex w-full items-center gap-2 border-b border-line px-4 py-2.5 text-sm hover:bg-surface-2"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Administradores
                </Link>
              )}
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
