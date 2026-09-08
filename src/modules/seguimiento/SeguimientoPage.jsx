import { doc, onSnapshot } from 'firebase/firestore'
import { Ban, ClipboardCheck, Factory, FileSearch, FileText, PackageCheck, SearchX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import BrandMark from '../../components/BrandMark'
import { db } from '../../lib/firebase'

// Página pública, fuera de RequireAuth (ver App.jsx) — la abre el cliente
// con un link (/seguimiento/<id de su cotización>), sin cuenta ni
// contraseña. Lee de `seguimientoPublico`, el espejo mínimo que las
// acciones de negocio (crear cotización, abrir OF, avanzar producción,
// facturar) van actualizando — nunca toca `cotizaciones` directamente,
// esa sigue protegida solo para gente autorizada.
//
// Diseño propio (no reutiliza <Timeline>, el de la vista interna): esto
// lo ve un cliente real desde un link de WhatsApp, casi siempre en el
// celular — más grande, con íconos por paso en vez de solo números, y
// un héroe de marca arriba en vez de la tabla compacta del panel admin.
const PASOS = [
  { estado: 'Cotizado', label: 'Cotizado', icon: FileText },
  { estado: 'OF abierta', label: 'En preparación', icon: ClipboardCheck },
  { estado: 'Producción', label: 'En producción', icon: Factory },
  { estado: 'Facturado', label: 'Listo', icon: PackageCheck },
]

function timeAgo(ms) {
  if (!ms) return null
  const diffMin = Math.round((Date.now() - ms) / 60000)
  if (diffMin < 1) return 'justo ahora'
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `hace ${diffH} h`
  return `hace ${Math.round(diffH / 24)} d`
}

function EstadoStepper({ estadoActual }) {
  const currentIndex = PASOS.findIndex((p) => p.estado === estadoActual)

  return (
    <ol className="flex items-start">
      {PASOS.map((paso, index) => {
        const done = index < currentIndex
        const active = index === currentIndex
        const isLast = index === PASOS.length - 1
        const Icon = paso.icon
        return (
          <li key={paso.estado} className={`flex items-start ${isLast ? '' : 'flex-1'}`}>
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-500 ${
                  done
                    ? 'bg-brand-700 text-white'
                    : active
                      ? 'bg-brand-700 text-white shadow-[0_0_0_5px] shadow-brand-100'
                      : 'bg-surface-2 text-ink-faint'
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <span
                className={`w-16 text-center text-[0.6875rem] leading-tight transition-colors ${
                  done || active ? 'font-semibold text-brand-800' : 'text-ink-faint'
                }`}
              >
                {paso.label}
              </span>
            </div>
            {!isLast && (
              <div className="mx-1 mt-5 h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all duration-700 ease-out"
                  style={{ width: done ? '100%' : '0%' }}
                />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export default function SeguimientoPage() {
  const { id } = useParams()
  const [seguimiento, setSeguimiento] = useState(undefined)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'seguimientoPublico', id),
      (snap) => setSeguimiento(snap.exists() ? snap.data() : null),
      () => setSeguimiento(null),
    )
    return unsubscribe
  }, [id])

  const cancelado = seguimiento?.estado === 'Cancelado'
  const actualizado = timeAgo(seguimiento?.actualizado?.toMillis?.())

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      {/* Héroe de marca: mismo degradado verde que el header del panel
          interno, para que se sienta parte de la misma empresa incluso
          en una página sin login. */}
      <div
        className="flex flex-col items-center gap-3 bg-gradient-to-b from-brand-900 to-brand-800 px-4 pb-16 pt-[max(2.5rem,calc(env(safe-area-inset-top)+1.5rem))] text-center"
      >
        <div className="rounded-lg border border-white/10 bg-surface px-3 py-1.5 shadow-lg">
          <BrandMark compact className="h-9 w-auto" />
        </div>
        <div>
          <p className="font-display text-lg uppercase tracking-wide text-white">SRM · Telsa</p>
          <p className="font-mono text-[0.625rem] uppercase tracking-widest text-brand-100/70">
            Sanremo de México
          </p>
        </div>
      </div>

      {/* La tarjeta sube encima del héroe (margen negativo) para dar esa
          sensación de "tarjeta flotando", en vez de dos bloques pegados. */}
      <div className="flex flex-1 justify-center px-4 pb-10">
        <div className="-mt-10 w-full max-w-md">
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-2xl animate-scale-in sm:p-7">
            {seguimiento === undefined && (
              <div className="flex flex-col items-center gap-3 py-14 text-ink-faint">
                <FileSearch className="h-9 w-9 animate-pulse" />
                <p className="text-sm">Buscando tu pedido…</p>
              </div>
            )}

            {seguimiento === null && (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
                  <SearchX className="h-7 w-7" />
                </div>
                <p className="text-sm font-semibold text-ink-dim">No encontramos este pedido</p>
                <p className="max-w-[26ch] text-xs text-ink-faint">
                  Revisa que el link esté completo, o pide uno nuevo a tu asesor.
                </p>
              </div>
            )}

            {seguimiento && (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Estatus de tu pedido
                </p>
                <h1 className="mt-0.5 text-xl font-semibold text-ink">{seguimiento.cliente}</h1>

                {cancelado ? (
                  <div className="mt-5 flex items-center gap-3 rounded-lg bg-red-50 px-4 py-3.5 text-red-700">
                    <Ban className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-medium">Este pedido fue cancelado.</p>
                  </div>
                ) : (
                  <>
                    <div className="mt-6 overflow-x-auto pb-1">
                      <EstadoStepper estadoActual={seguimiento.estado} />
                    </div>

                    {seguimiento.estado === 'Producción' && (
                      <div className="mt-6 rounded-lg bg-brand-50/60 px-4 py-3.5">
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="font-medium text-brand-800">Avance de producción</span>
                          <span className="font-mono font-semibold text-brand-800">
                            {seguimiento.avance ?? 0}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white">
                          <div
                            className="h-full rounded-full bg-brand-600 transition-all duration-700 ease-out"
                            style={{ width: `${seguimiento.avance ?? 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-sm">
                  <div>
                    <dt className="text-xs text-ink-faint">Entrega comprometida</dt>
                    <dd className="font-medium text-ink">
                      {seguimiento.entregaSemanas ?? '—'} semanas
                    </dd>
                  </div>
                  {actualizado && (
                    <p className="text-xs text-ink-faint">Actualizado {actualizado}</p>
                  )}
                </div>
              </>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-ink-faint">
            ¿Dudas sobre tu pedido? Contacta a tu asesor de SRM Telsa.
          </p>
        </div>
      </div>
    </div>
  )
}
