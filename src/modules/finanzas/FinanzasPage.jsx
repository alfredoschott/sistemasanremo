import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { MetricCard, MetricsRow } from '../../components/Metric'
import { exportCsv } from '../../lib/exportCsv'
import { claveMes, nombreMes } from '../../lib/meses'
import { mensajeError } from '../../lib/firestoreErrors'
import { useToast } from '../../lib/ToastContext'
import ProveedorNombre from '../compras/ProveedorNombre'
import { useOrdenesCompra } from '../compras/useOrdenesCompra'
import { useProveedores } from '../compras/useProveedores'
import { currency } from '../../lib/currency'
import { useCotizaciones } from '../ventas/useCotizaciones'
import CuentaPendienteSection from './CuentaPendienteSection'
import DesgloseDeuda from './DesgloseDeuda'
import { deshacerCobrado, deshacerPagado, marcarCobrado, marcarPagado } from './finanzasActions'
import FlujoMensualChart from './FlujoMensualChart'
import { calcularPorCobrar, calcularPorPagar, calcularResumenFinanzas } from './resumenFinanzas'

const DIA_MS = 24 * 60 * 60 * 1000

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

// Agrupa una lista de pendientes (ya viene ordenada por vencimiento) en
// bloques por mes, para no mostrar todo de golpe en una sola lista larga.
function agruparPorMes(lista, montoDe) {
  const grupos = new Map()
  for (const item of lista) {
    const ms = item.vencimiento
    const clave = ms ? claveMes(ms) : 'sin-fecha'
    const previo = grupos.get(clave) ?? {
      clave,
      label: ms ? nombreMes(ms) : 'Sin fecha de vencimiento',
      items: [],
      total: 0,
    }
    previo.items.push(item)
    previo.total += montoDe(item) ?? 0
    grupos.set(clave, previo)
  }
  return [...grupos.values()]
}

export default function FinanzasPage() {
  const { cotizaciones } = useCotizaciones()
  const { ordenes } = useOrdenesCompra()
  const proveedores = useProveedores()
  const toast = useToast()
  const [busyId, setBusyId] = useState(null)
  const [verCobrados, setVerCobrados] = useState(false)
  const [verPagados, setVerPagados] = useState(false)
  // Se fija una vez al abrir la página (no en cada render) para que las
  // cuentas y los grupos por mes sean estables mientras se usa la pantalla.
  const [ahora] = useState(Date.now)

  const proveedorPlazo = useMemo(() => {
    const map = new Map(proveedores.map((p) => [p.id, p.plazoPagoDias ?? 0]))
    return (id) => map.get(id) ?? 0
  }, [proveedores])

  const porCobrar = useMemo(() => calcularPorCobrar(cotizaciones), [cotizaciones])
  const porPagar = useMemo(() => calcularPorPagar(ordenes, proveedorPlazo), [ordenes, proveedorPlazo])

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

  const metrics = useMemo(
    () => calcularResumenFinanzas(porCobrar, porPagar, ahora),
    [porCobrar, porPagar, ahora],
  )

  // Mes actual y siguiente empiezan expandidos; el resto (más lejano o ya
  // vencido de meses pasados) empieza colapsado para no saturar la pantalla.
  const mesActualClave = useMemo(() => claveMes(ahora), [ahora])
  const mesSiguienteClave = useMemo(() => {
    const d = new Date(ahora)
    d.setMonth(d.getMonth() + 1)
    return claveMes(d.getTime())
  }, [ahora])
  const abiertoPorDefecto = (clave) =>
    clave === mesActualClave || clave === mesSiguienteClave || clave === 'sin-fecha'

  const gruposPorCobrar = useMemo(
    () => agruparPorMes(porCobrar, (c) => c.monto),
    [porCobrar],
  )
  const gruposPorPagar = useMemo(
    () => agruparPorMes(porPagar, (o) => o.montoTotal),
    [porPagar],
  )

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
    } catch (err) {
      toast(mensajeError(err, 'No se pudo registrar el cobro. Intenta de nuevo.'), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const deshacerCobro = async (cotizacion) => {
    setBusyId(cotizacion.id)
    try {
      await deshacerCobrado(cotizacion)
      toast(`Cobro de ${cotizacion.cliente} deshecho`)
    } catch (err) {
      toast(mensajeError(err, 'No se pudo deshacer. Intenta de nuevo.'), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const deshacerPago = async (oc) => {
    setBusyId(oc.id)
    try {
      await deshacerPagado(oc)
      toast('Pago deshecho')
    } catch (err) {
      toast(mensajeError(err, 'No se pudo deshacer. Intenta de nuevo.'), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const accionPagar = async (oc) => {
    setBusyId(oc.id)
    try {
      await marcarPagado(oc, proveedorNombrePorId.get(oc.proveedorId))
      toast('Pago registrado', 'success', { onUndo: () => deshacerPagado(oc) })
    } catch (err) {
      toast(mensajeError(err, 'No se pudo registrar el pago. Intenta de nuevo.'), 'error')
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
        <CuentaPendienteSection
          icon={ArrowDownCircle}
          iconColor="text-brand-600"
          tituloActivo="Por cobrar (crédito Fudeco)"
          tituloActivoCorto="por cobrar"
          tituloHistorico="Cobrados"
          pendientes={porCobrar}
          historicos={cobrados}
          verHistorico={verCobrados}
          onToggleVer={() => setVerCobrados((v) => !v)}
          onExportar={exportarCobrar}
          grupos={gruposPorCobrar}
          abiertoPorDefecto={abiertoPorDefecto}
          renderNombre={(c) => c.cliente}
          montoDe={(c) => c.monto}
          fechaHistoricaDe={(c) => c.fechaCobro}
          labelFechaHistorica="Cobrado"
          busyId={busyId}
          onAccionPendiente={accionCobrar}
          labelAccionPendiente="Cobrado"
          onAccionHistorica={deshacerCobro}
          labelAccionHistorica="Deshacer cobro"
          formatFecha={formatFecha}
          textoVencimiento={textoVencimiento}
          emptyTitlePendiente="Nada pendiente de cobro"
        />

        <CuentaPendienteSection
          icon={ArrowUpCircle}
          iconColor="text-amber-600"
          tituloActivo="Por pagar (proveedores)"
          tituloActivoCorto="por pagar"
          tituloHistorico="Pagados"
          pendientes={porPagar}
          historicos={pagados}
          verHistorico={verPagados}
          onToggleVer={() => setVerPagados((v) => !v)}
          onExportar={exportarPagar}
          grupos={gruposPorPagar}
          abiertoPorDefecto={abiertoPorDefecto}
          renderNombre={(o) => <ProveedorNombre proveedorId={o.proveedorId} />}
          montoDe={(o) => o.montoTotal}
          fechaHistoricaDe={(o) => o.fechaPago}
          labelFechaHistorica="Pagado"
          busyId={busyId}
          onAccionPendiente={accionPagar}
          labelAccionPendiente="Pagado"
          onAccionHistorica={deshacerPago}
          labelAccionHistorica="Deshacer pago"
          formatFecha={formatFecha}
          textoVencimiento={textoVencimiento}
          emptyTitlePendiente="Nada pendiente de pago"
        />
      </div>

      {(desglosePorCliente.length > 0 || desglosePorProveedor.length > 0) && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DesgloseDeuda
            titulo="Quién debe más"
            grupos={desglosePorCliente}
            emptyTitle="Nada pendiente de cobro"
            nombreDe={(clave) => clave}
            etiquetaConteo={{ singular: 'cotización', plural: 'cotizaciones' }}
          />
          <DesgloseDeuda
            titulo="A quién le debemos más"
            grupos={desglosePorProveedor}
            emptyTitle="Nada pendiente de pago"
            nombreDe={(clave) => proveedorNombrePorId.get(clave) ?? '—'}
            etiquetaConteo={{ singular: 'orden', plural: 'órdenes' }}
          />
        </div>
      )}

      <FlujoMensualChart cobrados={cobrados} pagados={pagados} />
    </div>
  )
}
