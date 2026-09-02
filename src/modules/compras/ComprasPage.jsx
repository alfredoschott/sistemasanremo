import { ClipboardList, PackageCheck, Pencil, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import { MetricCard, MetricsRow } from '../../components/Metric'
import { TableSkeleton } from '../../components/Skeleton'
import MaterialNombre from '../almacen/MaterialNombre'
import { recibirOrdenCompra } from '../almacen/stockActions'
import { useToast } from '../../lib/ToastContext'
import AbrirOFModal from './AbrirOFModal'
import NuevaOrdenCompraModal from './NuevaOrdenCompraModal'
import ProveedorNombre from './ProveedorNombre'
import { useCotizacionesCotizadas } from './useCotizacionesCotizadas'
import { useOrdenesCompra } from './useOrdenesCompra'

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

const OC_BADGE = {
  pendiente: 'bg-amber-100 text-amber-700',
  recibida: 'bg-brand-50 text-brand-800',
}

function esEsteMes(fecha) {
  const ms = fecha?.toMillis?.()
  if (!ms) return false
  const d = new Date(ms)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

export default function ComprasPage() {
  const { cotizaciones, loading: loadingCotizaciones } = useCotizacionesCotizadas()
  const { ordenes, loading: loadingOrdenes } = useOrdenesCompra()
  const [cotizacionParaOF, setCotizacionParaOF] = useState(null)
  const [ocModalOpen, setOcModalOpen] = useState(false)
  const [ocParaEditar, setOcParaEditar] = useState(null)
  const [recibiendoId, setRecibiendoId] = useState(null)
  const toast = useToast()

  const metrics = useMemo(() => {
    const pendientes = ordenes.filter((o) => o.estado === 'pendiente').length
    const recibidasEsteMes = ordenes.filter(
      (o) => o.estado === 'recibida' && esEsteMes(o.fecha),
    ).length
    const proveedoresActivos = new Set(ordenes.map((o) => o.proveedorId)).size
    const materialesDistintos = new Set(
      ordenes.flatMap((o) => (o.materiales ?? []).map((l) => l.materialId)),
    ).size
    return { pendientes, recibidasEsteMes, proveedoresActivos, materialesDistintos }
  }, [ordenes])

  const marcarRecibida = async (oc) => {
    setRecibiendoId(oc.id)
    try {
      await recibirOrdenCompra(oc)
      toast('O.C. recibida — stock actualizado')
    } finally {
      setRecibiendoId(null)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <MetricsRow>
        <MetricCard label="O.C. pendientes" value={metrics.pendientes} variant="warn" />
        <MetricCard label="Recibidas este mes" value={metrics.recibidasEsteMes} variant="accent" />
        <MetricCard label="Proveedores activos" value={metrics.proveedoresActivos} />
        <MetricCard label="Materiales distintos" value={metrics.materialesDistintos} />
      </MetricsRow>

      <section>
        <h1 className="mb-3 text-xl font-semibold text-slate-800">Cotizaciones por abrir OF</h1>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Entrega comprometida</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingCotizaciones && <TableSkeleton rows={2} cols={4} />}
              {!loadingCotizaciones && cotizaciones.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      icon={ClipboardList}
                      title="No hay cotizaciones esperando OF"
                      subtitle="Aparecerán aquí cuando Ventas cotice a un cliente"
                    />
                  </td>
                </tr>
              )}
              {cotizaciones.map((cot) => (
                <tr key={cot.id} className="transition-colors hover:bg-brand-50/40">
                  <td className="px-4 py-3 font-medium text-slate-700">{cot.cliente}</td>
                  <td className="px-4 py-3 text-slate-600">{currency.format(cot.monto ?? 0)}</td>
                  <td className="px-4 py-3 text-slate-600">{cot.entregaSemanas} sem.</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" onClick={() => setCotizacionParaOF(cot)}>
                      Abrir OF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">Órdenes de compra</h2>
          <Button
            onClick={() => setOcModalOpen(true)}
            className="inline-flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Nueva O.C.
          </Button>
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Materiales</th>
                <th className="px-4 py-3">Plazo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingOrdenes && <TableSkeleton rows={2} cols={5} />}
              {!loadingOrdenes && ordenes.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={PackageCheck}
                      title="Sin órdenes de compra todavía"
                      subtitle='Crea la primera con "Nueva O.C."'
                    />
                  </td>
                </tr>
              )}
              {ordenes.map((oc) => (
                <tr key={oc.id} className="transition-colors hover:bg-brand-50/40">
                  <td className="px-4 py-3 font-medium text-slate-700">
                    <ProveedorNombre proveedorId={oc.proveedorId} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {(oc.materiales ?? []).map((linea, i) => (
                      <span key={i} className="mr-2">
                        {linea.cantidad}× <MaterialNombre materialId={linea.materialId} />
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{oc.plazoEntregaDias} días</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        OC_BADGE[oc.estado] ?? 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {oc.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {oc.estado === 'pendiente' && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setOcParaEditar(oc)}
                          className="text-slate-400 transition-colors hover:text-brand-700"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={recibiendoId === oc.id}
                          onClick={() => marcarRecibida(oc)}
                        >
                          {recibiendoId === oc.id ? 'Recibiendo…' : 'Marcar recibida'}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AbrirOFModal cotizacion={cotizacionParaOF} onClose={() => setCotizacionParaOF(null)} />
      <NuevaOrdenCompraModal open={ocModalOpen} onClose={() => setOcModalOpen(false)} />
      <NuevaOrdenCompraModal
        open={Boolean(ocParaEditar)}
        onClose={() => setOcParaEditar(null)}
        oc={ocParaEditar}
      />
    </div>
  )
}
