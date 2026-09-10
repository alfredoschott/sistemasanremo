import DocumentoMembrete from '../../components/DocumentoMembrete'
import { formatoFechaLarga } from '../../lib/imprimir'
import { proveedoresDe } from './proveedoresOF'

const ESTADO_BADGE = {
  Abierta: 'bg-amber-100 text-amber-700',
  'En producción': 'bg-blue-100 text-blue-700',
  Completada: 'bg-brand-50 text-brand-800',
}

// Oculto en pantalla, visible solo al imprimir (ver botón Printer en cada
// tarjeta de OrdenFabricacionCard) — mismo patrón que
// OrdenCompraImprimible: no hay página de detalle por OF, así que el
// documento se arma al vuelo con la que se mandó a imprimir.
//
// nombreProveedor llega ya resuelto desde ProduccionPage: un
// <ProveedorNombre> que se suscribe de nuevo a Firestore aquí corre una
// carrera contra window.print() y el PDF sale con el nombre en blanco la
// primera vez que se imprime en la sesión.
export default function OrdenFabricacionImprimible({ of, nombreProveedor }) {
  if (!of) return null
  const proveedores = proveedoresDe(of)

  return (
    <div className="hidden print:block">
      <DocumentoMembrete
        className="mb-8 flex"
        titulo="Orden de fabricación"
        folio={of.numeroSerie}
        fecha={formatoFechaLarga(of.fecha)}
      />

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Cliente</p>
          <h1 className="text-2xl font-semibold text-ink">{of.cliente}</h1>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${
            ESTADO_BADGE[of.estado] ?? 'bg-surface-2 text-ink'
          }`}
        >
          {of.estado}
        </span>
      </div>

      {of.estado === 'En producción' && (
        <dl className="mb-8 rounded-lg border border-line-strong bg-surface-2 p-4 text-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Avance</dt>
          <dd className="mt-1 font-medium text-ink">{of.avance ?? 0}%</dd>
        </dl>
      )}

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          {proveedores.length > 1 ? 'Proveedores' : 'Proveedor'}
        </h2>
        {proveedores.length === 0 ? (
          <p className="text-sm text-ink-dim">Sin proveedor asignado.</p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-sm">
            {proveedores.map((p, i) => (
              <li key={i} className="text-ink">
                <span className="font-medium">{nombreProveedor(p.proveedorId)}</span>
                {p.fechaCompromiso ? (
                  <span className="text-ink-faint">
                    {' '}
                    · llega{' '}
                    {new Date(`${p.fechaCompromiso}T12:00:00`).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'long',
                    })}
                  </span>
                ) : p.plazoEntregaDias ? (
                  <span className="text-ink-faint"> · {p.plazoEntregaDias} días</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
