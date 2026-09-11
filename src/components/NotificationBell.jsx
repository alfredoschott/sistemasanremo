import { deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore'
import { AlertTriangle, Bell, CheckCircle2, Info, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../lib/firebase'
import { useNotificaciones } from '../lib/useNotificaciones'

const DIA_MS = 24 * 60 * 60 * 1000

// Agrupa por antigüedad para que el panel no se vea como una sola lista
// plana sin importar si llegó hace un minuto o hace tres semanas.
function grupoDe(fecha) {
  const ms = fecha?.toMillis?.()
  if (!ms) return 'Más antiguas'
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const inicioDia = hoy.getTime()
  const diffDias = Math.floor((inicioDia - ms) / DIA_MS)
  if (diffDias <= 0) return 'Hoy'
  if (diffDias <= 7) return 'Esta semana'
  return 'Más antiguas'
}

const ORDEN_GRUPOS = ['Hoy', 'Esta semana', 'Más antiguas']

function agruparPorFecha(notificaciones) {
  const grupos = new Map()
  for (const n of notificaciones) {
    const g = grupoDe(n.fecha)
    if (!grupos.has(g)) grupos.set(g, [])
    grupos.get(g).push(n)
  }
  return ORDEN_GRUPOS.filter((g) => grupos.has(g)).map((g) => [g, grupos.get(g)])
}

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
  const [filtro, setFiltro] = useState('Todas')
  const navigate = useNavigate()
  const grupos = useMemo(() => agruparPorFecha(notificaciones), [notificaciones])
  const gruposFiltrados = filtro === 'Todas' ? grupos : grupos.filter(([g]) => g === filtro)

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

  const eliminarNotificacion = (e, n) => {
    e.stopPropagation()
    deleteDoc(doc(db, 'notificaciones', n.id)).catch(() => {})
  }

  return (
    <div className="relative">
      {/* Botón en px fijos a propósito: es parte de la barra verde, que no
          debe crecer con el zoom de accesibilidad (ver nota en Topbar.jsx).
          El panel de notificaciones que abre sí escala normal, como
          cualquier otro contenido. */}
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="relative flex h-[32px] w-[32px] items-center justify-center rounded-full text-brand-50/90 transition-colors hover:bg-surface/10"
      >
        <Bell className="h-[18px] w-[18px]" />
        {noLeidas > 0 && (
          <span className="absolute right-[2px] top-[2px] flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-500 px-[4px] text-[10px] font-semibold text-white">
            <span className="animate-pulse-ring absolute inset-0 rounded-full" />
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-scale-in absolute right-0 top-[44px] w-72 overflow-hidden rounded-lg border border-line bg-surface text-ink shadow-xl sm:w-80">
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

          {notificaciones.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto border-b border-line px-3 py-2">
              {['Todas', ...ORDEN_GRUPOS].map((g) => (
                <button
                  key={g}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setFiltro(g)
                  }}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    filtro === g
                      ? 'bg-brand-700 text-white'
                      : 'bg-surface-2 text-ink-dim hover:bg-line'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          <div className="max-h-80 overflow-y-auto">
            {notificaciones.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-ink-faint">Sin notificaciones</p>
            )}
            {notificaciones.length > 0 && gruposFiltrados.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-ink-faint">
                Sin notificaciones en "{filtro}"
              </p>
            )}
            {gruposFiltrados.map(([grupo, items]) => (
              <div key={grupo}>
                {filtro === 'Todas' && (
                  <p className="sticky top-0 bg-surface-2 px-4 py-1 text-[0.625rem] font-mono uppercase tracking-wide text-ink-faint">
                    {grupo}
                  </p>
                )}
                {items.map((n) => {
                  const Icon = ICONS[n.tipo] ?? Info
                  return (
                    <div
                      key={n.id}
                      className={`group flex w-full items-start gap-2.5 border-b border-line px-4 py-2.5 text-sm transition-colors last:border-0 hover:bg-surface-2 ${
                        n.leida ? '' : 'bg-brand-50/50'
                      }`}
                    >
                      <button
                        onMouseDown={() => handleClick(n)}
                        className="flex flex-1 items-start gap-2.5 text-left"
                      >
                        <Icon
                          className={`mt-0.5 h-4 w-4 shrink-0 ${ICON_COLOR[n.tipo] ?? ICON_COLOR.info}`}
                        />
                        <div className="min-w-0">
                          <p className="text-ink">{n.mensaje}</p>
                          <p className="text-xs text-ink-faint">{timeAgo(n.fecha)}</p>
                        </div>
                      </button>
                      <button
                        onMouseDown={(e) => eliminarNotificacion(e, n)}
                        title="Eliminar notificación"
                        className="shrink-0 rounded-md p-1 text-ink-faint opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
