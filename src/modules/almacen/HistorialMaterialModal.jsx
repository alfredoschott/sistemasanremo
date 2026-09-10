import { ArrowDownCircle, ArrowUpCircle, ChevronDown, Undo2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import IconButton from '../../components/IconButton'
import Modal from '../../components/Modal'
import { claveMes, nombreMes } from '../../lib/meses'
import { useToast } from '../../lib/ToastContext'
import { revertirMovimientoManual } from './stockActions'
import { useMovimientosMaterial } from './useMovimientosMaterial'

function formatFecha(fecha) {
  const ms = fecha?.toMillis?.()
  if (!ms) return ''
  return new Date(ms).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Agrupa el historial (ya viene ordenado del más al menos reciente) por
// mes calendario, para no mostrar de golpe meses de movimientos cuando un
// material se usa seguido — mismo patrón que "Por cobrar/pagar" en Finanzas.
function agruparPorMes(movimientos) {
  const grupos = new Map()
  for (const m of movimientos) {
    const ms = m.fecha?.toMillis?.()
    const clave = ms ? claveMes(ms) : 'sin-fecha'
    const previo = grupos.get(clave) ?? {
      clave,
      label: ms ? nombreMes(ms) : 'Sin fecha',
      items: [],
    }
    previo.items.push(m)
    grupos.set(clave, previo)
  }
  return [...grupos.values()]
}

function GrupoMes({ label, count, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-faint"
      >
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? '' : '-rotate-90'}`} />
        {label}
        <span className="font-normal normal-case text-ink-faint">({count})</span>
      </button>
      {open && <ul className="flex flex-col gap-2 pb-1 pl-5">{children}</ul>}
    </div>
  )
}

export default function HistorialMaterialModal({ material, onClose }) {
  const movimientos = useMovimientosMaterial(material?.id)
  const [revirtiendoId, setRevirtiendoId] = useState(null)
  const toast = useToast()

  // Los dos meses más recientes con movimientos empiezan expandidos; el
  // resto (historial más viejo) empieza colapsado.
  const grupos = useMemo(() => agruparPorMes(movimientos), [movimientos])
  const clavesRecientes = useMemo(() => new Set(grupos.slice(0, 2).map((g) => g.clave)), [grupos])

  const revertir = async (m) => {
    if (
      !window.confirm(
        `¿Deshacer esta ${m.tipo === 'entrada' ? 'entrada' : 'salida'} de ${m.cantidad}? Ajustará el stock actual.`,
      )
    )
      return
    setRevirtiendoId(m.id)
    try {
      await revertirMovimientoManual({
        movimientoId: m.id,
        materialId: m.materialId,
        tipo: m.tipo,
        cantidad: m.cantidad,
      })
      toast('Movimiento revertido')
    } catch {
      toast('No se pudo revertir el movimiento.', 'error')
    } finally {
      setRevirtiendoId(null)
    }
  }

  return (
    <Modal
      open={Boolean(material)}
      onClose={onClose}
      title="Historial de movimientos"
      subtitle={material?.nombre}
      maxWidth="max-w-md"
    >
      {movimientos.length === 0 ? (
        <p className="text-sm text-ink-faint">Sin movimientos registrados todavía.</p>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          {grupos.map((g) => (
            <GrupoMes
              key={g.clave}
              label={g.label}
              count={g.items.length}
              defaultOpen={clavesRecientes.has(g.clave)}
            >
              {g.items.map((m) => (
                <li key={m.id} className="flex items-center gap-2.5 text-sm">
                  {m.tipo === 'entrada' ? (
                    <ArrowDownCircle className="h-4 w-4 shrink-0 text-brand-600" />
                  ) : (
                    <ArrowUpCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  )}
                  <span className="flex-1 text-ink">
                    {m.tipo === 'entrada' ? 'Entrada' : 'Salida'} de {m.cantidad}
                    {m.referencia?.tipo === 'ordenCompra' && (
                      <span className="text-ink-faint"> · O.C.</span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-ink-faint">{formatFecha(m.fecha)}</span>
                  {!m.referencia && (
                    <IconButton
                      icon={Undo2}
                      disabled={revirtiendoId === m.id}
                      onClick={() => revertir(m)}
                      title="Deshacer este movimiento"
                    />
                  )}
                </li>
              ))}
            </GrupoMes>
          ))}
        </div>
      )}
    </Modal>
  )
}
