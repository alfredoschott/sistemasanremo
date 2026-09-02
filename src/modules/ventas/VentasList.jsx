import { AlertTriangle, Download, FileText, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import EstadoBadge from '../../components/EstadoBadge'
import { MetricCard, MetricsRow } from '../../components/Metric'
import SearchInput from '../../components/SearchInput'
import { TableSkeleton } from '../../components/Skeleton'
import { exportCsv } from '../../lib/exportCsv'
import { estaVencido } from '../../lib/plazos'
import NuevaCotizacionModal from './NuevaCotizacionModal'
import { useCotizaciones } from './useCotizaciones'

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export default function VentasList() {
  const { cotizaciones, loading } = useCotizaciones()
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const metrics = useMemo(() => {
    const cotizado = cotizaciones
      .filter((c) => c.estado === 'Cotizado')
      .reduce((sum, c) => sum + (c.monto ?? 0), 0)
    const enProduccion = cotizaciones.filter((c) => c.estado === 'Producción').length
    const facturado = cotizaciones
      .filter((c) => c.estado === 'Facturado')
      .reduce((sum, c) => sum + (c.monto ?? 0), 0)
    const anticipos = cotizaciones
      .filter((c) => c.condicionPago === 'anticipo' && c.estado !== 'Facturado')
      .reduce((sum, c) => sum + ((c.monto ?? 0) * (c.porcentajeAnticipo ?? 0)) / 100, 0)
    return { cotizado, enProduccion, facturado, anticipos }
  }, [cotizaciones])

  const filtradas = useMemo(
    () =>
      cotizaciones.filter((c) => c.cliente?.toLowerCase().includes(search.toLowerCase().trim())),
    [cotizaciones, search],
  )

  const exportar = () => {
    exportCsv(
      `cotizaciones_${new Date().toISOString().slice(0, 10)}.csv`,
      filtradas,
      [
        { label: 'Cliente', value: (c) => c.cliente },
        { label: 'Monto', value: (c) => c.monto },
        { label: 'Condición de pago', value: (c) => c.condicionPago },
        { label: 'Entrega (semanas)', value: (c) => c.entregaSemanas },
        { label: 'Estado', value: (c) => c.estado },
        { label: 'Número de serie', value: (c) => c.numeroSerie ?? '' },
      ],
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Cotizaciones</h1>
          <p className="text-sm text-slate-500">{cotizaciones.length} en total</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={exportar}
            className="gap-1.5 inline-flex items-center"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button onClick={() => setModalOpen(true)} className="gap-1.5 inline-flex items-center">
            <Plus className="h-4 w-4" />
            Nueva cotización
          </Button>
        </div>
      </div>

      <MetricsRow>
        <MetricCard label="Cotizado" value={currency.format(metrics.cotizado)} />
        <MetricCard label="En producción" value={`${metrics.enProduccion} OF`} variant="warn" />
        <MetricCard label="Facturado" value={currency.format(metrics.facturado)} variant="accent" />
        <MetricCard label="Anticipos pendientes" value={currency.format(metrics.anticipos)} />
      </MetricsRow>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar por cliente…" />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Monto</th>
              <th className="px-4 py-3">Condición de pago</th>
              <th className="px-4 py-3">Entrega</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <TableSkeleton rows={3} cols={5} />}
            {!loading && filtradas.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon={FileText}
                    title={search ? 'Sin resultados' : 'Sin cotizaciones todavía'}
                    subtitle={search ? 'Prueba con otro nombre' : 'Crea la primera con "Nueva cotización"'}
                  />
                </td>
              </tr>
            )}
            {filtradas.map((cot) => (
              <tr
                key={cot.id}
                onClick={() => navigate(`/ventas/${cot.id}`)}
                className="cursor-pointer transition-colors hover:bg-brand-50/40"
              >
                <td className="px-4 py-3 font-medium text-slate-700">{cot.cliente}</td>
                <td className="px-4 py-3 text-slate-600">{currency.format(cot.monto ?? 0)}</td>
                <td className="px-4 py-3 text-slate-600">
                  {cot.condicionPago === 'anticipo'
                    ? `Anticipo ${cot.porcentajeAnticipo ?? ''}%`
                    : 'Crédito Fudeco'}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    {cot.entregaSemanas} sem.
                    {!['Facturado', 'Cancelado'].includes(cot.estado) &&
                      estaVencido(cot.fecha, (cot.entregaSemanas ?? 0) * 7) && (
                        <AlertTriangle
                          className="h-3.5 w-3.5 text-red-500"
                          title="Entrega comprometida vencida"
                        />
                      )}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <EstadoBadge estado={cot.estado} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NuevaCotizacionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
