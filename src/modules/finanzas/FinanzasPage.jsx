import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Check, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import { MetricCard, MetricsRow } from '../../components/Metric'
import { useToast } from '../../lib/ToastContext'
import ProveedorNombre from '../compras/ProveedorNombre'
import { useOrdenesCompra } from '../compras/useOrdenesCompra'
import { useProveedores } from '../compras/useProveedores'
import { useCotizaciones } from '../ventas/useCotizaciones'
import { deshacerCobrado, deshacerPagado, marcarCobrado, marcarPagado } from './finanzasActions'

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const DIA_MS = 24 * 60 * 60 * 1000

function fechaVencimiento(base, dias) {
  const ms = base?.toMillis?.()
  // dias puede ser 0 (pago/cobro de contado) — es un valor válido, no "sin dato".
  if (!ms || dias == null) return null
  return ms + dias * DIA_MS
}

function formatFecha(ms) {
  if (!ms) return '—'
  return new Date(ms).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function FinanzasPage() {
  const { cotizaciones } = useCotizaciones()
  const { ordenes } = useOrdenesCompra()
  const proveedores = useProveedores()
  const toast = useToast()
  const [busyId, setBusyId] = useState(null)

  const proveedorPlazo = useMemo(() => {
    const map = new Map(proveedores.map((p) => [p.id, p.plazoPagoDias ?? 0]))
    return (id) => map.get(id) ?? 0
  }, [proveedores])

  const porCobrar = useMemo(() => {
    return cotizaciones
      .filter((c) => c.estado === 'Facturado' && c.condicionPago === 'fudeco' && !c.cobrado)
      .map((c) => ({
        ...c,
        vencimiento: fechaVencimiento(c.fechaFacturado ?? c.fecha, c.diasCredito ?? 60),
      }))
      .sort((a, b) => (a.vencimiento ?? 0) - (b.vencimiento ?? 0))
  }, [cotizaciones])

  const porPagar = useMemo(() => {
    return ordenes
      .filter((o) => o.estado === 'recibida' && !o.pagado && o.montoTotal)
      .map((o) => ({
        ...o,
        vencimiento: fechaVencimiento(o.fechaRecibida ?? o.fecha, proveedorPlazo(o.proveedorId)),
      }))
      .sort((a, b) => (a.vencimiento ?? 0) - (b.vencimiento ?? 0))
  }, [ordenes, proveedorPlazo])

  const metrics = useMemo(() => {
    const totalCobrar = porCobrar.reduce((sum, c) => sum + (c.monto ?? 0), 0)
    const totalPagar = porPagar.reduce((sum, o) => sum + (o.montoTotal ?? 0), 0)
    const en30dias = Date.now() + 30 * DIA_MS
    const cobrarPronto = porCobrar
      .filter((c) => c.vencimiento && c.vencimiento <= en30dias)
      .reduce((sum, c) => sum + (c.monto ?? 0), 0)
    const pagarPronto = porPagar
      .filter((o) => o.vencimiento && o.vencimiento <= en30dias)
      .reduce((sum, o) => sum + (o.montoTotal ?? 0), 0)
    return { totalCobrar, totalPagar, saldoProyectado30: cobrarPronto - pagarPronto }
  }, [porCobrar, porPagar])

  const accionCobrar = async (cotizacion) => {
    setBusyId(cotizacion.id)
    try {
      await marcarCobrado(cotizacion)
      toast(`Cobro de ${cotizacion.cliente} registrado`, 'success', {
        onUndo: () => deshacerCobrado(cotizacion),
      })
    } catch {
      toast('No se pudo registrar el cobro. Intenta de nuevo.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const accionPagar = async (oc) => {
    setBusyId(oc.id)
    try {
      await marcarPagado(oc)
      toast('Pago registrado', 'success', { onUndo: () => deshacerPagado(oc) })
    } catch {
      toast('No se pudo registrar el pago. Intenta de nuevo.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-800">Finanzas</h1>
      <p className="mb-4 text-sm text-slate-500">
        Cuentas por cobrar y por pagar, para ver qué entra y qué sale antes de que llegue la fecha.
      </p>

      <MetricsRow>
        <MetricCard label="Por cobrar" value={currency.format(metrics.totalCobrar)} variant="accent" />
        <MetricCard label="Por pagar" value={currency.format(metrics.totalPagar)} variant="warn" />
        <MetricCard
          label="Saldo proyectado (30 días)"
          value={currency.format(metrics.saldoProyectado30)}
          variant={metrics.saldoProyectado30 < 0 ? 'danger' : 'default'}
        />
      </MetricsRow>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <ArrowDownCircle className="h-4 w-4 text-brand-600" />
            Por cobrar (crédito Fudeco)
          </h2>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {porCobrar.length === 0 ? (
              <EmptyState icon={Wallet} title="Nada pendiente de cobro" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {porCobrar.map((c) => {
                  const vencida = c.vencimiento && c.vencimiento < Date.now()
                  return (
                    <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-700">{c.cliente}</p>
                        <p className={`text-xs ${vencida ? 'text-red-600' : 'text-slate-400'}`}>
                          {vencida && <AlertTriangle className="mr-1 inline h-3 w-3" />}
                          Vence {formatFecha(c.vencimiento)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-medium text-slate-700">
                          {currency.format(c.monto ?? 0)}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          loading={busyId === c.id}
                          onClick={() => accionCobrar(c)}
                          className="inline-flex items-center gap-1"
                        >
                          {busyId !== c.id && <Check className="h-3.5 w-3.5" />}
                          Cobrado
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <ArrowUpCircle className="h-4 w-4 text-amber-600" />
            Por pagar (proveedores)
          </h2>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {porPagar.length === 0 ? (
              <EmptyState icon={Wallet} title="Nada pendiente de pago" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {porPagar.map((o) => {
                  const vencida = o.vencimiento && o.vencimiento < Date.now()
                  return (
                    <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-700">
                          <ProveedorNombre proveedorId={o.proveedorId} />
                        </p>
                        <p className={`text-xs ${vencida ? 'text-red-600' : 'text-slate-400'}`}>
                          {vencida && <AlertTriangle className="mr-1 inline h-3 w-3" />}
                          Vence {formatFecha(o.vencimiento)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-medium text-slate-700">
                          {currency.format(o.montoTotal ?? 0)}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          loading={busyId === o.id}
                          onClick={() => accionPagar(o)}
                          className="inline-flex items-center gap-1"
                        >
                          {busyId !== o.id && <Check className="h-3.5 w-3.5" />}
                          Pagado
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
