import BrandMark from './BrandMark'

// Encabezado de documento (logo + datos) para lo que se imprime/exporta a
// PDF: cotizaciones, órdenes de compra, órdenes de fabricación. Oculto en
// pantalla a propósito — la marca ya está en el topbar — y solo visible
// al imprimir (el caller decide con className, ej. "hidden print:flex").
export default function DocumentoMembrete({ titulo, folio, fecha, className = '' }) {
  return (
    <div className={`items-start justify-between border-b border-line pb-5 ${className}`}>
      <div className="flex items-center gap-3">
        <BrandMark className="h-14 w-auto" />
        <div>
          <p className="font-display text-base font-bold uppercase tracking-wide text-ink">
            SRM Telsa Transformadores
          </p>
          <p className="text-xs text-ink-faint">Sanremo de México</p>
        </div>
      </div>
      <div className="text-right text-xs text-ink-faint">
        <p className="mb-0.5 font-display text-base font-bold uppercase tracking-wide text-ink">
          {titulo}
        </p>
        <p>Folio {folio}</p>
        {fecha && <p>{fecha}</p>}
      </div>
    </div>
  )
}
