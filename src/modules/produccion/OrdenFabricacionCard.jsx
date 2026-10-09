import {
  Archive,
  AlertTriangle,
  ArchiveRestore,
  Boxes,
  Plus,
  Printer,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import { useRef, useState } from 'react'
import Button from '../../components/Button'
import IconButton from '../../components/IconButton'
import { mensajeError } from '../../lib/firestoreErrors'
import { useToast } from '../../lib/ToastContext'
import ProveedorNombre from '../compras/ProveedorNombre'
import AgregarProveedorOFModal from './AgregarProveedorOFModal'
import {
  actualizarAvance,
  archivarOF,
  completarYFacturar,
  desarchivarOF,
  deshacerCompletarYFacturar,
  deshacerIniciarProduccion,
  eliminarOF,
  iniciarProduccion,
  quitarProveedorDeOF,
} from './ofActions'
import { ofVencida, proveedoresDe } from './proveedoresOF'

const ESTADO_OF_BADGE = {
  Abierta: 'bg-amber-100 text-amber-700',
  'En producción': 'bg-blue-100 text-blue-700',
  Completada: 'bg-brand-50 text-brand-800',
}

export default function OrdenFabricacionCard({ of, viendoArchivadas, onImprimir, onVerMateriales, materiales }) {
  const [busy, setBusy] = useState(false)
  // Valor del deslizador mientras se arrastra: se guarda en Firestore hasta
  // soltar, no en cada paso (varias escrituras seguidas y el gesto táctil
  // se sentía trabado).
  const [avancePendiente, setAvancePendiente] = useState(null)
  const ultimoGuardado = useRef(null)
  const [agregandoProveedor, setAgregandoProveedor] = useState(false)
  const toast = useToast()
  const proveedoresOF = proveedoresDe(of)
  const puedeEditarProveedores = of.estado !== 'Completada'
  const materialesRequeridos = of.materialesRequeridos ?? []
  const materialesFaltantes = materialesRequeridos.filter((l) => {
    const pendiente = Math.max(0, l.cantidadPlan - (l.cantidadConsumida ?? 0))
    const disponible = materiales.find((m) => m.id === l.materialId)?.stock ?? 0
    return pendiente > disponible
  }).length

  // Solo de referencia junto al slider de avance — no lo reemplaza, porque
  // tener todo el material en planta no es lo mismo que estar terminado
  // (falta armar/soldar/probar), y hay OF sin lista de materiales donde
  // no hay nada que calcular.
  const totalPlaneado = materialesRequeridos.reduce((sum, l) => sum + l.cantidadPlan, 0)
  const avanceMaterial =
    totalPlaneado > 0
      ? Math.round(
          (materialesRequeridos.reduce((sum, l) => sum + Math.min(l.cantidadConsumida ?? 0, l.cantidadPlan), 0) /
            totalPlaneado) *
            100,
        )
      : null

  const runAction = async (action, message, onUndo) => {
    setBusy(true)
    try {
      await action()
      if (message) toast(message, 'success', { onUndo })
    } catch (err) {
      toast(mensajeError(err, 'No se pudo completar la acción. Intenta de nuevo.'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const archivar = () =>
    runAction(
      () => archivarOF(of),
      `${of.numeroSerie} archivada`,
      () => desarchivarOF(of),
    )

  const desarchivar = () => runAction(() => desarchivarOF(of), `${of.numeroSerie} restaurada`)

  const quitarProveedor = (index) => {
    if (!window.confirm('¿Quitar este proveedor de la OF? Si ya tenía una O.C. generada, esa no se toca.'))
      return
    runAction(() => quitarProveedorDeOF(of, index), 'Proveedor quitado')
  }

  const eliminar = () => {
    if (
      !window.confirm(
        `¿Eliminar definitivamente la OF ${of.numeroSerie}? La cotización de ${of.cliente} regresará a "Cotizado". Esto no se puede deshacer.`,
      )
    )
      return
    runAction(() => eliminarOF(of), `${of.numeroSerie} eliminada`)
  }

  const regresarAAbierta = () => {
    if (!window.confirm(`¿Regresar ${of.numeroSerie} a "Abierta"? Se perderá el avance registrado.`))
      return
    runAction(() => deshacerIniciarProduccion(of), `${of.numeroSerie} regresada a "Abierta"`)
  }

  const regresarAProduccion = async () => {
    if (!window.confirm(`¿Regresar ${of.numeroSerie} a "En producción"? Deshace la facturación.`))
      return
    setBusy(true)
    try {
      await deshacerCompletarYFacturar(of)
      toast(`${of.numeroSerie} regresada a "En producción"`)
    } catch (err) {
      if (err.message === 'ya-cobrada') {
        toast('Primero deshaz el cobro de esta cotización en Finanzas.', 'error')
      } else {
        toast(mensajeError(err, 'No se pudo completar la acción. Intenta de nuevo.'), 'error')
      }
    } finally {
      setBusy(false)
    }
  }

  // El valor pendiente solo vale mientras Firestore no cambie el avance
  // (base); en cuanto llega el valor guardado, manda el de la base de datos.
  const avanceActual = of.avance ?? 0
  const avanceMostrado =
    avancePendiente && avancePendiente.base === avanceActual ? avancePendiente.valor : avanceActual

  const guardarAvance = () => {
    if (!avancePendiente || avancePendiente.base !== avanceActual) return
    const { valor } = avancePendiente
    if (valor === avanceActual || ultimoGuardado.current === valor) return
    ultimoGuardado.current = valor
    actualizarAvance(of, valor).catch((err) => {
      ultimoGuardado.current = null
      setAvancePendiente(null)
      toast(mensajeError(err, 'No se pudo actualizar el avance.'), 'error')
    })
  }

  return (
    <div className="group rounded-lg border border-line bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-ink-faint">{of.numeroSerie}</p>
          <h3 className="text-lg font-semibold text-ink">{of.cliente}</h3>
          {of.modelos?.length > 0 && (
            <p className="text-xs text-ink-faint">{of.modelos.join(', ')}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <span
              className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                ESTADO_OF_BADGE[of.estado] ?? 'bg-surface-2 text-ink'
              }`}
            >
              {of.estado}
            </span>
            <IconButton
              icon={Boxes}
              badge={materialesFaltantes}
              onClick={onVerMateriales}
              title="Materiales de la OF"
            />
            <IconButton
              icon={Printer}
              onClick={onImprimir}
              title="Imprimir / guardar como PDF"
            />
            {of.estado !== 'Completada' && (
              <IconButton
                icon={Trash2}
                variant="danger"
                onClick={eliminar}
                disabled={busy}
                title="Eliminar OF"
              />
            )}
          </div>
          {of.estado !== 'Completada' && ofVencida(of) && (
            <span
              title="Plazo del proveedor vencido"
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
            >
              <AlertTriangle className="h-3 w-3" />
              Vencida
            </span>
          )}
        </div>
      </div>

      <div className="mb-4 text-sm">
        <dt className="text-ink-faint">{proveedoresOF.length > 1 ? 'Proveedores' : 'Proveedor'}</dt>
        {proveedoresOF.length === 0 ? (
          <dd className="text-ink-dim">Sin proveedor asignado</dd>
        ) : (
          <dd className="mt-1 flex flex-col gap-1 text-ink">
            {proveedoresOF.map((p, i) => (
              <span key={i} className="flex items-center gap-1">
                <span>
                  <ProveedorNombre proveedorId={p.proveedorId} />
                  {p.fechaCompromiso ? (
                    <span className="text-ink-faint">
                      {' '}
                      · llega {new Date(`${p.fechaCompromiso}T12:00:00`).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  ) : p.plazoEntregaDias ? (
                    <span className="text-ink-faint"> · {p.plazoEntregaDias} días</span>
                  ) : null}
                </span>
                {puedeEditarProveedores && (
                  <IconButton
                    icon={X}
                    variant="danger"
                    onClick={() => quitarProveedor(i)}
                    disabled={busy}
                    title="Quitar proveedor"
                    className="h-5 w-5 p-0.5"
                  />
                )}
              </span>
            ))}
          </dd>
        )}
        {puedeEditarProveedores && (
          <button
            type="button"
            onClick={() => setAgregandoProveedor(true)}
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-green-700 transition-colors hover:text-green-800 hover:underline"
          >
            <Plus className="h-3 w-3" />
            Agregar proveedor
          </button>
        )}
      </div>

      <AgregarProveedorOFModal
        of={agregandoProveedor ? of : null}
        onClose={() => setAgregandoProveedor(false)}
      />

      {of.estado === 'Abierta' && (
        <Button
          className="w-full"
          loading={busy}
          onClick={() =>
            runAction(
              () => iniciarProduccion(of),
              `${of.numeroSerie} en producción`,
              () => deshacerIniciarProduccion(of),
            )
          }
        >
          Iniciar producción
        </Button>
      )}

      {of.estado === 'En producción' && (
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-ink-faint">
            <span>Avance</span>
            <div className="flex items-center gap-1">
              <span>{avanceMostrado}%</span>
              <IconButton
                icon={Undo2}
                disabled={busy}
                onClick={regresarAAbierta}
                title='Regresar a "Abierta"'
                className="h-5 w-5 p-0.5"
              />
            </div>
          </div>
          <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full bg-green-600 transition-all duration-300 ease-out"
              style={{ width: `${avanceMostrado}%` }}
            />
          </div>
          {avanceMaterial !== null && (
            <p className="mb-2 text-xs text-ink-faint">
              Material consumido: <span className="font-medium text-ink-dim">{avanceMaterial}%</span>
              {' '}— referencia, tú decides el avance real
            </p>
          )}
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={avanceMostrado}
            disabled={busy}
            onChange={(e) => {
              ultimoGuardado.current = null
              setAvancePendiente({ valor: Number(e.target.value), base: avanceActual })
            }}
            onPointerUp={guardarAvance}
            onKeyUp={guardarAvance}
            onBlur={guardarAvance}
            className="mb-3 w-full"
          />
          <Button
            className="w-full"
            loading={busy}
            onClick={() =>
              runAction(
                () => completarYFacturar(of),
                `${of.numeroSerie} completada y facturada`,
                () => deshacerCompletarYFacturar(of),
              )
            }
          >
            Completar y facturar
          </Button>
        </div>
      )}

      {of.estado === 'Completada' && (
        <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
          <p className="text-sm text-ink-faint">Facturada — proceso completo.</p>
          <div className="flex items-center gap-1">
            <IconButton
              icon={Undo2}
              disabled={busy}
              onClick={regresarAProduccion}
              title='Regresar a "En producción"'
            />
            {viendoArchivadas ? (
              <IconButton
                icon={ArchiveRestore}
                onClick={desarchivar}
                disabled={busy}
                title="Restaurar a la lista principal"
              />
            ) : (
              <IconButton icon={Archive} onClick={archivar} disabled={busy} title="Archivar" />
            )}
            <IconButton
              icon={Trash2}
              variant="danger"
              onClick={eliminar}
              disabled={busy}
              title="Eliminar definitivamente"
            />
          </div>
        </div>
      )}
    </div>
  )
}
