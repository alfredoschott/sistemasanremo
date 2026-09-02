import { ArrowLeft, Ban, Pencil } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../../components/Button'
import EstadoBadge from '../../components/EstadoBadge'
import Modal from '../../components/Modal'
import Timeline from '../../components/Timeline'
import Adjuntos from './Adjuntos'
import Auditoria from './Auditoria'
import { cancelarCotizacion } from './cotizacionActions'
import NuevaCotizacionModal from './NuevaCotizacionModal'
import { useCotizacion } from './useCotizacion'

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export default function VentasDetalle() {
  const { id } = useParams()
  const { cotizacion, loading } = useCotizacion(id)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)
  const [cancelando, setCancelando] = useState(false)

  if (loading) return <p className="text-slate-400">Cargando…</p>
  if (!cotizacion) return <p className="text-slate-400">Cotización no encontrada.</p>

  const puedeEditar = cotizacion.estado === 'Cotizado'
  const puedeCancelar = !['Facturado', 'Cancelado'].includes(cotizacion.estado)

  const confirmarCancelacion = async () => {
    setCancelando(true)
    try {
      await cancelarCotizacion(cotizacion)
      setConfirmCancelOpen(false)
    } finally {
      setCancelando(false)
    }
  }

  return (
    <div>
      <Link
        to="/ventas"
        className="inline-flex items-center gap-1 text-sm text-brand-700 transition-colors hover:text-brand-800 hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver a cotizaciones
      </Link>

      <div className="mt-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">{cotizacion.cliente}</h1>
            <p className="text-sm text-slate-500">{currency.format(cotizacion.monto ?? 0)}</p>
          </div>
          <div className="flex items-center gap-2">
            <EstadoBadge estado={cotizacion.estado} />
            {puedeEditar && (
              <Button
                size="sm"
                variant="outline"
                className="inline-flex items-center gap-1"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Button>
            )}
            {puedeCancelar && (
              <Button
                size="sm"
                variant="ghost"
                className="inline-flex items-center gap-1"
                onClick={() => setConfirmCancelOpen(true)}
              >
                <Ban className="h-3.5 w-3.5" />
                Cancelar
              </Button>
            )}
          </div>
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

        <Adjuntos cotizacion={cotizacion} />
        <Auditoria cotizacionId={cotizacion.id} />
      </div>

      <NuevaCotizacionModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        cotizacion={cotizacion}
      />

      <Modal
        open={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        title="¿Cancelar esta cotización?"
        subtitle={`${cotizacion.cliente} — esta acción no se puede deshacer.`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmCancelOpen(false)}>
            No, mantener
          </Button>
          <Button variant="primary" disabled={cancelando} onClick={confirmarCancelacion}>
            {cancelando ? 'Cancelando…' : 'Sí, cancelar'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
