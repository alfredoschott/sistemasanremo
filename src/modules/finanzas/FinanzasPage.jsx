import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
  Download,
  Undo2,
  Wallet,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import IconButton from '../../components/IconButton'
import { MetricCard, MetricsRow } from '../../components/Metric'
import { exportCsv } from '../../lib/exportCsv'
import { useToast } from '../../lib/ToastContext'
import ProveedorNombre from '../compras/ProveedorNombre'
import { useOrdenesCompra } from '../compras/useOrdenesCompra'
import { useProveedores } from '../compras/useProveedores'
import { useCotizaciones } from '../ventas/useCotizaciones'
import { deshacerCobrado, deshacerPagado, marcarCobrado, marcarPagado } from './finanzasActions'
import FlujoMensualChart from './FlujoMensualChart'

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

function textoVencimiento(vencimientoMs) {
  if (!vencimientoMs) return `Vence ${formatFecha(vencimientoMs)}`
  const diasAtraso = Math.round((Date.now() - vencimientoMs) / DIA_MS)
  if (diasAtraso <= 0) return `Vence ${formatFecha(vencimientoMs)}`
  return diasAtraso === 1 ? 'Vencida hace 1 día' : `Vencida hace ${diasAtraso} días`
}

// Agrupa una lista de pendientes (por cliente o por proveedor) sumando su
// monto, para saber de un vistazo quién concentra más deuda — no solo la
// lista suelta renglón por renglón.
function agruparPorDeuda(lista, claveDe, montoDe) {
  const grupos = new Map()
  for (const item of lista) {
    const clave = claveDe(item)
    const previo = grupos.get(clave) ?? { clave, monto: 0, count: 0 }
    previo.monto += montoDe(item) ?? 0
    previo.count += 1
    grupos.set(clave, previo)
  }
  return [...grupos.values()].sort((a, b) => b.monto - a.monto)
}

export default function FinanzasPage() {
  const { cotizaciones } = useCotizaciones()
  const { ordenes } = useOrdenesCompra()
  const proveedores = useProveedores()
  const toast = useToast()
  const [busyId, setBusyId] = useState(null)
  const [verCobrados, setVerCobrados] = useState(false)
  const [verPagados, setVerPagados] = useState(false)

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

  const cobrados = useMemo(
    () =>
      cotizaciones
        .filter((c) => c.condicionPago === 'fudeco' && c.cobrado)
        .sort((a, b) => (b.fechaCobro?.toMillis?.() ?? 0) - (a.fechaCobro?.toMillis?.() ?? 0)),
    [cotizaciones],
  )

  const pagados = useMemo(
    () =>
      ordenes
        .filter((o) => o.pagado)
        .sort((a, b) => (b.fechaPago?.toMillis?.() ?? 0) - (a.fechaPago?.toMillis?.() ?? 0)),
    [ordenes],
  )

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

  const desglosePorCliente = useMemo(
    () => agruparPorDeuda(porCobrar, (c) => c.cliente, (c) => c.monto),
    [porCobrar],
  )

  const desglosePorProveedor = useMemo(
    () => agruparPorDeuda(porPagar, (o) => o.proveedorId, (o) => o.montoTotal),
    [porPagar],
  )

  const proveedorNombrePorId = useMemo(
    () => new Map(proveedores.map((p) => [p.id, p.nombre])),
    [proveedores],
  )

  const exportarCobrar = () => {
    const lista = verCobrados ? cobrados : porCobrar
    exportCsv(
      `${verCobrados ? 'cobrados' : 'por-cobrar'}_${new Date().toISOString().slice(0, 10)}.csv`,
      lista,
      [
        { label: 'Cliente', value: (c) => c.cliente },
        { label: 'Monto', value: (c) => c.monto ?? 0 },
        verCobrados
          ? { label: 'Cobrado', value: (c) => formatFecha(c.fechaCobro?.toMillis?.()) }
          : { label: 'Vence', value: (c) => formatFecha(c.vencimiento) },
      ],
    )
  }

  const exportarPagar = () => {
    const lista = verPagados ? pagados : porPagar
    exportCsv(
      `${verPagados ? 'pagados' : 'por-pagar'}_${new Date().toISOString().slice(0, 10)}.csv`,
      lista,
      [
        { label: 'Proveedor', value: (o) => proveedorNombrePorId.get(o.proveedorId) ?? '—' },
        { label: 'Monto', value: (o) => o.montoTotal ?? 0 },
        verPagados
          ? { label: 'Pagado', value: (o) => formatFecha(o.fechaPago?.toMillis?.()) }
          : { label: 'Vence', value: (o) => formatFecha(o.vencimiento) },
      ],
    )
  }

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

  const deshacerCobro = async (cotizacion) => {
    setBusyId(cotizacion.id)
    try {
      await deshacerCobrado(cotizacion)
      toast(`Cobro de ${cotizacion.cliente} deshecho`)
    } catch {
      toast('No se pudo deshacer. Intenta de nuevo.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const deshacerPago = async (oc) => {
    setBusyId(oc.id)
    try {
      await deshacerPagado(oc)
      toast('Pago deshecho')
    } catch {
      toast('No se pudo deshacer. Intenta de nuevo.', 'error')
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
      <h1 className="mb-1 text-xl font-semibold text-ink">Finanzas</h1>
      <p className="mb-4 text-sm text-ink-faint">
        Cuentas por cobrar y por pagar, para ver qué entra y qué sale antes de que llegue la fecha.
      </p>

      <MetricsRow>
        <MetricCard label="Por cobrar" value={currency.format(metrics.totalCobrar)} variant="teal" />
        <MetricCard label="Por pagar" value={currency.format(metrics.totalPagar)} variant="warn" />
        <MetricCard
          label="Saldo proyectado (30 días)"
          value={currency.format(metrics.saldoProyectado30)}
          variant={metrics.saldoProyectado30 < 0 ? 'danger' : 'default'}
        />
      </MetricsRow>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <ArrowDownCircle className="h-4 w-4 text-brand-600" />
              {verCobrados ? 'Cobrados' : 'Por cobrar (crédito Fudeco)'}
            </h2>
            <div className="flex items-center gap-3">
              {(porCobrar.length > 0 || cobrados.length > 0) && (
                <IconButton icon={Download} onClick={exportarCobrar} title="Exportar CSV" />
              )}
              {(cobrados.length > 0 || verCobrados) && (
                <button
                  onClick={() => setVerCobrados((v) => !v)}
                  className="text-xs font-medium text-teal-700 hover:underline"
                >
                  {verCobrados ? 'Ver por cobrar' : `Ver cobrados (${cobrados.length})`}
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto border border-line-strong bg-surface">
            {verCobrados ? (
              cobrados.length === 0 ? (
                <EmptyState icon={Wallet} title="Nada cobrado todavía" />
              ) : (
                <ul className="stagger divide-y divide-line">
                  {cobrados.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{c.cliente}</p>
                        <p className="text-xs text-ink-faint">
                          Cobrado {formatFecha(c.fechaCobro?.toMillis?.())}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-medium text-ink">{currency.format(c.monto ?? 0)}</span>
                        <IconButton
                          icon={Undo2}
                          disabled={busyId === c.id}
                          onClick={() => deshacerCobro(c)}
                          title="Deshacer cobro"
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )
            ) : porCobrar.length === 0 ? (
              <EmptyState icon={Wallet} title="Nada pendiente de cobro" />
            ) : (
              <ul className="stagger divide-y divide-line">
                {porCobrar.map((c) => {
                  const vencida = c.vencimiento && c.vencimiento < Date.now()
                  return (
                    <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{c.cliente}</p>
                        <p className={`text-xs ${vencida ? 'text-red-600' : 'text-ink-faint'}`}>
                          {vencida && <AlertTriangle className="mr-1 inline h-3 w-3" />}
                          {textoVencimiento(c.vencimiento)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-medium text-ink">
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
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <ArrowUpCircle className="h-4 w-4 text-amber-600" />
              {verPagados ? 'Pagados' : 'Por pagar (proveedores)'}
            </h2>
            <div className="flex items-center gap-3">
              {(porPagar.length > 0 || pagados.length > 0) && (
                <IconButton icon={Download} onClick={exportarPagar} title="Exportar CSV" />
              )}
              {(pagados.length > 0 || verPagados) && (
                <button
                  onClick={() => setVerPagados((v) => !v)}
                  className="text-xs font-medium text-teal-700 hover:underline"
                >
                  {verPagados ? 'Ver por pagar' : `Ver pagados (${pagados.length})`}
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto border border-line-strong bg-surface">
            {verPagados ? (
              pagados.length === 0 ? (
                <EmptyState icon={Wallet} title="Nada pagado todavía" />
              ) : (
                <ul className="stagger divide-y divide-line">
                  {pagados.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">
                          <ProveedorNombre proveedorId={o.proveedorId} />
                        </p>
                        <p className="text-xs text-ink-faint">
                          Pagado {formatFecha(o.fechaPago?.toMillis?.())}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-medium text-ink">
                          {currency.format(o.montoTotal ?? 0)}
                        </span>
                        <IconButton
                          icon={Undo2}
                          disabled={busyId === o.id}
                          onClick={() => deshacerPago(o)}
                          title="Deshacer pago"
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )
            ) : porPagar.length === 0 ? (
              <EmptyState icon={Wallet} title="Nada pendiente de pago" />
            ) : (
              <ul className="stagger divide-y divide-line">
                {porPagar.map((o) => {
                  const vencida = o.vencimiento && o.vencimiento < Date.now()
                  return (
                    <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">
                          <ProveedorNombre proveedorId={o.proveedorId} />
                        </p>
                        <p className={`text-xs ${vencida ? 'text-red-600' : 'text-ink-faint'}`}>
                          {vencida && <AlertTriangle className="mr-1 inline h-3 w-3" />}
                          {textoVencimiento(o.vencimiento)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-medium text-ink">
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

      {(desglosePorCliente.length > 0 || desglosePorProveedor.length > 0) && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink">Quién debe más</h2>
            <div className="overflow-x-auto border border-line-strong bg-surface">
              {desglosePorCliente.length === 0 ? (
                <EmptyState icon={Wallet} title="Nada pendiente de cobro" />
              ) : (
                <ul className="divide-y divide-line">
                  {desglosePorCliente.map((g) => (
                    <li key={g.clave} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <p className="min-w-0 truncate font-medium text-ink">{g.clave}</p>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-ink-faint">
                          {g.count} {g.count === 1 ? 'cotización' : 'cotizaciones'}
                        </span>
                        <span className="font-medium text-ink">{currency.format(g.monto)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink">A quién le debemos más</h2>
            <div className="overflow-x-auto border border-line-strong bg-surface">
              {desglosePorProveedor.length === 0 ? (
                <EmptyState icon={Wallet} title="Nada pendiente de pago" />
              ) : (
                <ul className="divide-y divide-line">
                  {desglosePorProveedor.map((g) => (
                    <li key={g.clave} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <p className="min-w-0 truncate font-medium text-ink">
                        {proveedorNombrePorId.get(g.clave) ?? '—'}
                      </p>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-ink-faint">
                          {g.count} {g.count === 1 ? 'orden' : 'órdenes'}
                        </span>
                        <span className="font-medium text-ink">{currency.format(g.monto)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}

      <FlujoMensualChart cobrados={cobrados} pagados={pagados} />
    </div>
  )
}
