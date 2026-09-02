import { useState } from 'react'
import MaterialNombre from '../almacen/MaterialNombre'
import { recibirOrdenCompra } from '../almacen/stockActions'
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

export default function ComprasPage() {
  const { cotizaciones, loading: loadingCotizaciones } = useCotizacionesCotizadas()
  const { ordenes, loading: loadingOrdenes } = useOrdenesCompra()
  const [cotizacionParaOF, setCotizacionParaOF] = useState(null)
  const [ocModalOpen, setOcModalOpen] = useState(false)
  const [recibiendoId, setRecibiendoId] = useState(null)

  const marcarRecibida = async (oc) => {
    setRecibiendoId(oc.id)
    try {
      await recibirOrdenCompra(oc)
    } finally {
      setRecibiendoId(null)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="mb-3 text-xl font-semibold text-slate-800">
          Cotizaciones por abrir OF
        </h1>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
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
              {loadingCotizaciones && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    Cargando…
                  </td>
                </tr>
              )}
              {!loadingCotizaciones && cotizaciones.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No hay cotizaciones esperando OF.
                  </td>
                </tr>
              )}
              {cotizaciones.map((cot) => (
                <tr key={cot.id}>
                  <td className="px-4 py-3 font-medium text-slate-700">{cot.cliente}</td>
                  <td className="px-4 py-3 text-slate-600">{currency.format(cot.monto ?? 0)}</td>
                  <td className="px-4 py-3 text-slate-600">{cot.entregaSemanas} sem.</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setCotizacionParaOF(cot)}
                      className="rounded-md bg-brand-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-800"
                    >
                      Abrir OF
                    </button>
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
          <button
            onClick={() => setOcModalOpen(true)}
            className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
          >
            + Nueva O.C.
          </button>
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
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
              {loadingOrdenes && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    Cargando…
                  </td>
                </tr>
              )}
              {!loadingOrdenes && ordenes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    Sin órdenes de compra todavía.
                  </td>
                </tr>
              )}
              {ordenes.map((oc) => (
                <tr key={oc.id}>
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
                      <button
                        disabled={recibiendoId === oc.id}
                        onClick={() => marcarRecibida(oc)}
                        className="rounded-md border border-brand-700 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-60"
                      >
                        {recibiendoId === oc.id ? 'Recibiendo…' : 'Marcar recibida'}
                      </button>
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
    </div>
  )
}
