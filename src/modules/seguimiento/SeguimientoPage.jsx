import { doc, onSnapshot } from 'firebase/firestore'
import { PackageSearch, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import BrandMark from '../../components/BrandMark'
import Timeline from '../../components/Timeline'
import { db } from '../../lib/firebase'

// Página pública, fuera de RequireAuth (ver App.jsx) — la abre el cliente
// con un link (/seguimiento/<id de su cotización>), sin cuenta ni
// contraseña. Lee de `seguimientoPublico`, el espejo mínimo que las
// acciones de negocio (crear cotización, abrir OF, avanzar producción,
// facturar) van actualizando — nunca toca `cotizaciones` directamente,
// esa sigue protegida solo para gente autorizada.
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

  return (
    <div className="flex min-h-dvh flex-col items-center bg-paper px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <BrandMark className="h-16 w-auto" />
        <div>
          <p className="font-display text-lg uppercase tracking-wide text-ink">SRM · Telsa</p>
          <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">
            Sanremo de México
          </p>
        </div>
      </div>

      <div className="w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-sm">
        {seguimiento === undefined && (
          <div className="flex flex-col items-center gap-3 py-10 text-ink-faint">
            <div className="skeleton h-8 w-8 rounded-full" />
            <p className="text-sm">Cargando…</p>
          </div>
        )}

        {seguimiento === null && (
          <div className="flex flex-col items-center gap-3 py-10 text-center text-ink-faint">
            <X className="h-8 w-8" />
            <p className="text-sm font-medium text-ink-dim">No encontramos este pedido.</p>
            <p className="text-xs">Revisa que el link esté completo, o pide uno nuevo.</p>
          </div>
        )}

        {seguimiento && (
          <>
            <div className="mb-6 flex items-center gap-2.5">
              <PackageSearch className="h-5 w-5 text-brand-700" />
              <div>
                <h1 className="text-base font-semibold text-ink">{seguimiento.cliente}</h1>
                <p className="text-xs text-ink-faint">Estatus de tu pedido</p>
              </div>
            </div>

            <Timeline estadoActual={seguimiento.estado} />

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
              <div>
                <dt className="text-xs text-ink-faint">Entrega comprometida</dt>
                <dd className="font-medium text-ink">{seguimiento.entregaSemanas ?? '—'} semanas</dd>
              </div>
              {seguimiento.estado === 'Producción' && (
                <div>
                  <dt className="text-xs text-ink-faint">Avance de producción</dt>
                  <dd className="font-medium text-ink">{seguimiento.avance ?? 0}%</dd>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <p className="mt-6 text-xs text-ink-faint">
        ¿Dudas sobre tu pedido? Contacta a tu asesor de SRM Telsa.
      </p>
    </div>
  )
}
