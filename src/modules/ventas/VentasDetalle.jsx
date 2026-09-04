import { ArrowLeft, Ban, Copy, Pencil, Printer } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Adjuntos from '../../components/Adjuntos'
import Button from '../../components/Button'
import EstadoBadge from '../../components/EstadoBadge'
import IconButton from '../../components/IconButton'
import Modal from '../../components/Modal'
import Timeline from '../../components/Timeline'
import { useToast } from '../../lib/ToastContext'
import Auditoria from './Auditoria'
import { cancelarCotizacion, deshacerCancelacion, duplicarCotizacion } from './cotizacionActions'
import NotasInternas from './NotasInternas'
import NuevaCotizacionModal from './NuevaCotizacionModal'
import { useCotizacion } from './useCotizacion'

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export default function VentasDetalle() {
  const { id } = useParams()
  const { cotizacion, loading } = useCotizacion(id)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [duplicando, setDuplicando] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  if (loading) return <p className="text-ink-faint">Cargando…</p>
  if (!cotizacion) return <p className="text-ink-faint">Cotización no encontrada.</p>

  const puedeEditar = cotizacion.estado === 'Cotizado'
  const puedeCancelar = !['Facturado', 'Cancelado'].includes(cotizacion.estado)

  const confirmarCancelacion = async () => {
    setCancelando(true)
    try {
      await cancelarCotizacion(cotizacion)
      setConfirmCancelOpen(false)
      toast(`Cotización de ${cotizacion.cliente} cancelada`, 'success', {
        onUndo: () => deshacerCancelacion(cotizacion),
      })
    } catch {
      toast('No se pudo cancelar. Intenta de nuevo.', 'error')
    } finally {
      setCancelando(false)
    }
  }

  const duplicar = async () => {
    setDuplicando(true)
    try {
      const nuevaId = await duplicarCotizacion(cotizacion)
      toast(`Cotización duplicada para ${cotizacion.cliente}`)
      navigate(`/ventas/${nuevaId}`)
    } catch {
      toast('No se pudo duplicar la cotización. Intenta de nuevo.', 'error')
    } finally {
      setDuplicando(false)
    }
  }

  return (
    <div>
      <Link
        to="/ventas"
        className="no-print inline-flex items-center gap-1 text-sm text-brand-700 transition-colors hover:text-brand-800 hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver a cotizaciones
      </Link>

      <div className="mt-3 rounded-lg border border-line bg-surface p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ink">{cotizacion.cliente}</h1>
            <p className="text-sm text-ink-faint">{currency.format(cotizacion.monto ?? 0)}</p>
          </div>
          <div className="no-print flex items-center gap-3">
            <EstadoBadge estado={cotizacion.estado} />
            <div className="flex items-center gap-1 border-r border-line pr-2">
              <IconButton icon={Printer} onClick={() => window.print()} title="Imprimir" />
              <IconButton
                icon={Copy}
                onClick={duplicar}
                disabled={duplicando}
                title="Duplicar cotización"
              />
            </div>
            <div className="flex items-center gap-2">
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
        </div>

        <div className="mb-8">
          <Timeline estadoActual={cotizacion.estado} />
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-ink-faint">Condición de pago</dt>
            <dd className="text-ink">
              {cotizacion.condicionPago === 'anticipo'
                ? `Anticipo ${cotizacion.porcentajeAnticipo ?? ''}%`
                : `Crédito Fudeco (${cotizacion.diasCredito ?? '60'} días)`}
            </dd>
          </div>
          <div>
            <dt className="text-ink-faint">Entrega comprometida</dt>
            <dd className="text-ink">{cotizacion.entregaSemanas} semanas</dd>
          </div>
          {cotizacion.numeroSerie && (
            <div>
              <dt className="text-ink-faint">Orden de fabricación</dt>
              <dd className="text-ink">{cotizacion.numeroSerie}</dd>
            </div>
          )}
        </dl>

        <div className="no-print mt-6 border-t border-line pt-6">
          <Adjuntos
            coleccion="cotizaciones"
            docId={cotizacion.id}
            adjuntos={cotizacion.adjuntos}
          />
        </div>
        <NotasInternas cotizacionId={cotizacion.id} />
        <div className="no-print">
          <Auditoria cotizacionId={cotizacion.id} />
        </div>
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
          <Button variant="primary" loading={cancelando} onClick={confirmarCancelacion}>
            {cancelando ? 'Cancelando…' : 'Sí, cancelar'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
