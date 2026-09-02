import { Link, useParams } from 'react-router-dom'
import EstadoBadge from '../../components/EstadoBadge'
import Timeline from '../../components/Timeline'
import { useCotizacion } from './useCotizacion'

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export default function VentasDetalle() {
  const { id } = useParams()
  const { cotizacion, loading } = useCotizacion(id)

  if (loading) return <p className="text-slate-400">Cargando…</p>
  if (!cotizacion) return <p className="text-slate-400">Cotización no encontrada.</p>

  return (
    <div>
      <Link to="/ventas" className="text-sm text-brand-700 hover:underline">
        ← Volver a cotizaciones
      </Link>

      <div className="mt-3 rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">{cotizacion.cliente}</h1>
            <p className="text-sm text-slate-500">{currency.format(cotizacion.monto ?? 0)}</p>
          </div>
          <EstadoBadge estado={cotizacion.estado} />
        </div>

        <div className="mb-8">
          <Timeline estadoActual={cotizacion.estado} />
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-400">Condición de pago</dt>
            <dd className="text-slate-700">
              {cotizacion.condicionPago === 'anticipo'
                ? `Anticipo ${cotizacion.porcentajeAnticipo ?? ''}%`
                : 'Crédito Fudeco (60-90 días)'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Entrega comprometida</dt>
            <dd className="text-slate-700">{cotizacion.entregaSemanas} semanas</dd>
          </div>
          {cotizacion.numeroSerie && (
            <div>
              <dt className="text-slate-400">Orden de fabricación</dt>
              <dd className="text-slate-700">{cotizacion.numeroSerie}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}
