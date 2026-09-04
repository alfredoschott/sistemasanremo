import { doc, updateDoc, writeBatch } from 'firebase/firestore'
import { AlertTriangle, Bell, CheckCircle2, Info } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../lib/firebase'
import { useNotificaciones } from '../lib/useNotificaciones'

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
}

const ICON_COLOR = {
  success: 'text-brand-600',
  warning: 'text-amber-600',
  info: 'text-ink-faint',
}

function timeAgo(fecha) {
  const ms = fecha?.toMillis?.()
  if (!ms) return ''
  const diffMin = Math.round((Date.now() - ms) / 60000)
  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `hace ${diffH} h`
  return `hace ${Math.round(diffH / 24)} d`
}

export default function NotificationBell() {
  const { notificaciones, noLeidas } = useNotificaciones()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const marcarTodasLeidas = async () => {
    const pendientes = notificaciones.filter((n) => !n.leida)
    if (pendientes.length === 0) return
    const batch = writeBatch(db)
    pendientes.forEach((n) => batch.update(doc(db, 'notificaciones', n.id), { leida: true }))
    await batch.commit()
  }

  const handleClick = (n) => {
    setOpen(false)
    if (!n.leida) updateDoc(doc(db, 'notificaciones', n.id), { leida: true }).catch(() => {})
    if (n.link) navigate(n.link)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-brand-50/90 transition-colors hover:bg-surface/10"
      >
        <Bell className="h-4.5 w-4.5" />
        {noLeidas > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[0.625rem] font-semibold text-white">
            <span className="animate-pulse-ring absolute inset-0 rounded-full" />
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-scale-in absolute right-0 top-11 w-80 overflow-hidden rounded-lg border border-line bg-surface text-ink shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="text-sm font-semibold text-ink">Notificaciones</span>
            {noLeidas > 0 && (
              <button
                onClick={marcarTodasLeidas}
                className="text-xs font-medium text-brand-700 hover:underline"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notificaciones.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-ink-faint">Sin notificaciones</p>
            )}
            {notificaciones.map((n) => {
              const Icon = ICONS[n.tipo] ?? Info
              return (
                <button
                  key={n.id}
                  onMouseDown={() => handleClick(n)}
                  className={`flex w-full items-start gap-2.5 border-b border-line px-4 py-2.5 text-left text-sm transition-colors last:border-0 hover:bg-surface-2 ${
                    n.leida ? '' : 'bg-brand-50/50'
                  }`}
                >
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${ICON_COLOR[n.tipo] ?? ICON_COLOR.info}`} />
                  <div className="min-w-0">
                    <p className="text-ink">{n.mensaje}</p>
                    <p className="text-xs text-ink-faint">{timeAgo(n.fecha)}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
