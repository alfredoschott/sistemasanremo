import { ArrowLeft, Ban, Copy, Link2, Pencil, Printer, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Adjuntos from '../../components/Adjuntos'
import Button from '../../components/Button'
import DocumentoMembrete from '../../components/DocumentoMembrete'
import EstadoBadge from '../../components/EstadoBadge'
import IconButton from '../../components/IconButton'
import Modal from '../../components/Modal'
import Timeline from '../../components/Timeline'
import { currency } from '../../lib/currency'
import { folioCorto, formatoFechaLarga, imprimirComoPdf } from '../../lib/imprimir'
import { mensajeError } from '../../lib/firestoreErrors'
import { useToast } from '../../lib/ToastContext'
import Auditoria from './Auditoria'
import {
  cancelarCotizacion,
  deshacerCancelacion,
  duplicarCotizacion,
  eliminarCotizacion,
} from './cotizacionActions'
import NotasInternas from './NotasInternas'
import NuevaCotizacionModal from './NuevaCotizacionModal'
import { useCotizacion } from './useCotizacion'

// El id de Firestore es ilegible como folio de un documento impreso — si ya
// hay OF (numeroSerie) usamos ese, que la gente de Sanremo ya reconoce; si
// no, un folio corto derivado del id en vez del string completo.
function folioDe(cotizacion) {
  return cotizacion.numeroSerie ?? folioCorto('COT', cotizacion.id)
}

export default function VentasDetalle() {
  const { id } = useParams()
  const { cotizacion, loading } = useCotizacion(id)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [duplicando, setDuplicando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  if (loading) return <p className="text-ink-faint">Cargando…</p>
  if (!cotizacion) return <p className="text-ink-faint">Cotización no encontrada.</p>

  const puedeEditar = cotizacion.estado === 'Cotizado'
  const puedeCancelar = !['Facturado', 'Cancelado'].includes(cotizacion.estado)
  const puedeEliminar = ['Cotizado', 'Cancelado'].includes(cotizacion.estado)

  const confirmarCancelacion = async () => {
    setCancelando(true)
    try {
      await cancelarCotizacion(cotizacion)
      setConfirmCancelOpen(false)
      toast(`Cotización de ${cotizacion.cliente} cancelada`, 'success', {
        onUndo: () => deshacerCancelacion(cotizacion),
      })
    } catch (err) {
      toast(mensajeError(err, 'No se pudo cancelar. Intenta de nuevo.'), 'error')
    } finally {
      setCancelando(false)
    }
  }

  const eliminar = async () => {
    if (
      !window.confirm(`¿Eliminar definitivamente la cotización de ${cotizacion.cliente}? Esto no se puede deshacer.`)
    )
      return
    setEliminando(true)
    try {
      await eliminarCotizacion(cotizacion)
      toast(`Cotización de ${cotizacion.cliente} eliminada`)
      navigate('/ventas')
    } catch (err) {
      toast(mensajeError(err, 'No se pudo eliminar. Intenta de nuevo.'), 'error')
      setEliminando(false)
    }
  }

  const copiarLinkSeguimiento = async () => {
    const url = `${window.location.origin}/seguimiento/${cotizacion.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast('Link para el cliente copiado')
    } catch {
      toast(url, 'error')
    }
  }

  const duplicar = async () => {
    setDuplicando(true)
    try {
      const nuevaId = await duplicarCotizacion(cotizacion)
      toast(`Cotización duplicada para ${cotizacion.cliente}`)
      navigate(`/ventas/${nuevaId}`)
    } catch (err) {
      toast(mensajeError(err, 'No se pudo duplicar la cotización. Intenta de nuevo.'), 'error')
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

      <div className="mt-3 rounded-lg border border-line bg-surface p-6 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
        {/* Membrete: solo aparece al imprimir/exportar a PDF — en pantalla ya
            se ve la marca en el topbar, no hace falta repetirla aquí. */}
        <DocumentoMembrete
          className="mb-6 hidden print:flex"
          titulo="Cotización"
          folio={folioDe(cotizacion)}
          fecha={formatoFechaLarga(cotizacion.fecha)}
        />

        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ink">{cotizacion.cliente}</h1>
            <p className="text-sm text-ink-faint">{currency.format(cotizacion.monto ?? 0)}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Fuera de no-print a propósito: el estado también debe verse
                en el PDF, no solo en pantalla. */}
            <EstadoBadge estado={cotizacion.estado} />
            <div className="no-print flex items-center gap-3">
              <div className="flex items-center gap-1 border-r border-line pr-2">
                <IconButton
                  icon={Printer}
                  onClick={() => imprimirComoPdf(`Cotizacion ${cotizacion.cliente} ${folioDe(cotizacion)}`)}
                  title="Imprimir / guardar como PDF"
                />
                <IconButton
                  icon={Copy}
                  onClick={duplicar}
                  disabled={duplicando}
                  title="Duplicar cotización"
                />
                <IconButton
                  icon={Link2}
                  onClick={copiarLinkSeguimiento}
                  title="Copiar link de seguimiento para el cliente"
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
                {puedeEliminar && (
                  <IconButton
                    icon={Trash2}
                    variant="danger"
                    onClick={eliminar}
                    disabled={eliminando}
                    title="Eliminar cotización"
                  />
                )}
              </div>
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

        {cotizacion.items?.length > 0 && (
          <div className="mt-6 border-t border-line pt-6">
            <h2 className="mb-3 text-sm font-semibold text-ink">Transformadores cotizados</h2>
            <div className="overflow-x-auto rounded-md border border-line-strong">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-[0.625rem] font-mono uppercase tracking-wide text-ink-faint">
                  <tr>
                    <th className="px-3 py-2">Modelo</th>
                    <th className="px-3 py-2 text-right">Cantidad</th>
                    <th className="px-3 py-2 text-right">Precio unitario</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {cotizacion.items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-medium text-ink">{item.modelo}</td>
                      <td className="px-3 py-2 text-right text-ink-dim">{item.cantidad}</td>
                      <td className="px-3 py-2 text-right text-ink-dim">
                        {currency.format(item.precioUnitario ?? 0)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-ink">
                        {currency.format((item.cantidad ?? 0) * (item.precioUnitario ?? 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-line-strong bg-surface-2">
                    <td colSpan={3} className="px-3 py-2 text-right font-semibold text-ink">
                      Total
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-ink">
                      {currency.format(cotizacion.monto ?? 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

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
