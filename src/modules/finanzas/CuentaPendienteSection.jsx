import { AlertTriangle, Check, Download, Undo2 } from 'lucide-react'
import EmptyState from '../../components/EmptyState'
import IconButton from '../../components/IconButton'
import Button from '../../components/Button'
import { currency } from '../../lib/currency'
import GrupoMes from './GrupoMes'

// Sección "Por cobrar / Cobrados" o "Por pagar / Pagados" de Finanzas —
// son un espejo casi exacto una de la otra (mismo layout, mismo patrón de
// alternar entre pendientes y ya resueltos), así que comparten este único
// componente en vez de repetir el JSX dos veces.
export default function CuentaPendienteSection({
  icon: Icon,
  iconColor,
  tituloActivo,
  tituloActivoCorto,
  tituloHistorico,
  pendientes,
  historicos,
  verHistorico,
  onToggleVer,
  onExportar,
  grupos,
  abiertoPorDefecto,
  renderNombre,
  montoDe,
  fechaHistoricaDe,
  labelFechaHistorica,
  busyId,
  onAccionPendiente,
  labelAccionPendiente,
  onAccionHistorica,
  labelAccionHistorica,
  formatFecha,
  textoVencimiento,
  emptyTitlePendiente,
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          {verHistorico ? tituloHistorico : tituloActivo}
        </h2>
        <div className="flex items-center gap-3">
          {(pendientes.length > 0 || historicos.length > 0) && (
            <IconButton icon={Download} onClick={onExportar} title="Exportar CSV" />
          )}
          {(historicos.length > 0 || verHistorico) && (
            <button onClick={onToggleVer} className="text-xs font-medium text-teal-700 hover:underline">
              {verHistorico ? `Ver ${tituloActivoCorto}` : `Ver ${tituloHistorico.toLowerCase()} (${historicos.length})`}
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto border border-line-strong bg-surface">
        {verHistorico ? (
          historicos.length === 0 ? (
            <EmptyState icon={Icon} title={`Nada ${tituloHistorico.toLowerCase()} todavía`} />
          ) : (
            <ul className="stagger divide-y divide-line">
              {historicos.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{renderNombre(item)}</p>
                    <p className="text-xs text-ink-faint">
                      {labelFechaHistorica} {formatFecha(fechaHistoricaDe(item)?.toMillis?.())}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-medium text-ink">{currency.format(montoDe(item) ?? 0)}</span>
                    <IconButton
                      icon={Undo2}
                      disabled={busyId === item.id}
                      onClick={() => onAccionHistorica(item)}
                      title={labelAccionHistorica}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : pendientes.length === 0 ? (
          <EmptyState icon={Icon} title={emptyTitlePendiente} />
        ) : (
          grupos.map((g) => (
            <GrupoMes
              key={g.clave}
              label={g.label}
              total={g.total}
              count={g.items.length}
              defaultOpen={abiertoPorDefecto(g.clave)}
            >
              {g.items.map((item) => {
                const vencida = item.vencimiento && item.vencimiento < Date.now()
                return (
                  <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{renderNombre(item)}</p>
                      <p className={`text-xs ${vencida ? 'text-red-600' : 'text-ink-faint'}`}>
                        {vencida && <AlertTriangle className="mr-1 inline h-3 w-3" />}
                        {textoVencimiento(item.vencimiento)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-medium text-ink">{currency.format(montoDe(item) ?? 0)}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        loading={busyId === item.id}
                        onClick={() => onAccionPendiente(item)}
                        className="inline-flex items-center gap-1"
                      >
                        {busyId !== item.id && <Check className="h-3.5 w-3.5" />}
                        {labelAccionPendiente}
                      </Button>
                    </div>
                  </li>
                )
              })}
            </GrupoMes>
          ))
        )}
      </div>
    </section>
  )
}
