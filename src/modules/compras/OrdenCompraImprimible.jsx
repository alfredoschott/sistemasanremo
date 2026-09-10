import DocumentoMembrete from '../../components/DocumentoMembrete'
import { currency } from '../../lib/currency'
import { folioCorto, formatoFechaLarga } from '../../lib/imprimir'

const ESTADO_BADGE = {
  pendiente: 'bg-amber-100 text-amber-700',
  recibida: 'bg-brand-50 text-brand-800',
}

// Oculto en pantalla, visible solo al imprimir (ver botón Printer en
// ComprasPage) — mismo patrón que la cotización en VentasDetalle, pero
// como aquí no hay página de detalle por O.C., el documento se arma al
// vuelo con la O.C. que se mandó a imprimir.
//
// nombreProveedor/nombreMaterial llegan ya resueltos desde ComprasPage (que
// ya tiene proveedores/materiales cargados): un <ProveedorNombre>/
// <MaterialNombre> que se suscribe de nuevo a Firestore aquí corre una
// carrera contra window.print() y el PDF sale con el nombre en blanco la
// primera vez que se imprime en la sesión.
export default function OrdenCompraImprimible({ oc, numeroSerieOF, nombreProveedor, nombreMaterial }) {
  if (!oc) return null
  const of = oc.ofId ? numeroSerieOF(oc.ofId) : null

  return (
    <div className="hidden print:block">
      <DocumentoMembrete
        className="mb-8 flex"
        titulo="Orden de compra"
        folio={folioCorto('OC', oc.id)}
        fecha={formatoFechaLarga(oc.fecha)}
      />

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Proveedor</p>
          <h1 className="text-2xl font-semibold text-ink">{nombreProveedor(oc.proveedorId)}</h1>
        </div>
        {of && (
          <span className="shrink-0 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-800">
            OF {of}
          </span>
        )}
      </div>

      <dl className="mb-8 grid grid-cols-2 gap-4 rounded-lg border border-line-strong bg-surface-2 p-4 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Plazo de entrega</dt>
          <dd className="mt-1 font-medium text-ink">
            {oc.fechaCompromiso
              ? new Date(`${oc.fechaCompromiso}T12:00:00`).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'long',
                })
              : `${oc.plazoEntregaDias} días`}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Estado</dt>
          <dd className="mt-1">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                ESTADO_BADGE[oc.estado] ?? 'bg-surface text-ink'
              }`}
            >
              {oc.estado}
            </span>
          </dd>
        </div>
      </dl>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">Materiales</h2>
        <div className="overflow-hidden rounded-lg border border-line-strong">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-[0.625rem] font-mono uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-3 py-2.5">Material</th>
                <th className="px-3 py-2.5 text-right">Cantidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(oc.materiales ?? []).map((linea, i) => (
                <tr key={i} className={i % 2 === 1 ? 'bg-surface-2/40' : ''}>
                  <td className="px-3 py-2.5 font-medium text-ink">{nombreMaterial(linea.materialId)}</td>
                  <td className="px-3 py-2.5 text-right text-ink-dim">{linea.cantidad}</td>
                </tr>
              ))}
            </tbody>
            {oc.montoTotal ? (
              <tfoot>
                <tr className="border-t border-line-strong bg-surface-2">
                  <td className="px-3 py-2.5 text-right font-semibold text-ink">Monto total</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-ink">
                    {currency.format(oc.montoTotal)}
                  </td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </div>
    </div>
  )
}
