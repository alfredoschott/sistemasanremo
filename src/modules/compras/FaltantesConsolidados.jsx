import { ShoppingCart } from 'lucide-react'
import IconButton from '../../components/IconButton'
import MaterialNombre from '../almacen/MaterialNombre'

export default function FaltantesConsolidados({ faltantes, onGenerarOC }) {
  if (faltantes.length === 0) return null

  return (
    <section>
      <h2 className="mb-1 text-xl font-semibold text-ink">Faltantes entre todas las OF activas</h2>
      <p className="mb-3 text-sm text-ink-faint">
        Suma lo pendiente de todas las OF abiertas o en producción — si dos OF piden el mismo
        material por separado, aquí se ve si entre las dos alcanza el stock o no.
      </p>
      <div className="overflow-x-auto border border-line-strong bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2 text-[0.625rem] font-mono uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3">Material</th>
              <th className="px-4 py-3 text-right">Pendiente (todas las OF)</th>
              <th className="px-4 py-3 text-right">Disponible</th>
              <th className="px-4 py-3 text-right">Falta</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {faltantes.map((linea) => (
              <tr key={linea.materialId}>
                <td className="px-4 py-3 font-medium text-ink">
                  <MaterialNombre materialId={linea.materialId} />
                </td>
                <td className="px-4 py-3 text-right text-ink-dim">{linea.pendiente}</td>
                <td className="px-4 py-3 text-right text-ink-dim">{linea.disponible}</td>
                <td className="px-4 py-3 text-right font-medium text-red-700">{linea.falta}</td>
                <td className="px-4 py-3 text-right">
                  <IconButton
                    icon={ShoppingCart}
                    onClick={() => onGenerarOC(linea)}
                    title="Generar O.C. sugerida"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
