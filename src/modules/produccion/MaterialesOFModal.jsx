import { AlertTriangle, Plus, RefreshCw, ShoppingCart, Trash2 } from 'lucide-react'
import { useState } from 'react'
import Button from '../../components/Button'
import IconButton from '../../components/IconButton'
import Modal from '../../components/Modal'
import { useToast } from '../../lib/ToastContext'
import { inputClass, inputClassInline } from '../../lib/ui'
import MaterialNombre from '../almacen/MaterialNombre'
import MaterialPicker from '../almacen/MaterialPicker'
import { registrarConsumoMaterial, revertirConsumoMaterial } from '../almacen/stockActions'
import { useMateriales } from '../almacen/useMateriales'
import NuevaOrdenCompraModal from '../compras/NuevaOrdenCompraModal'
import { agregarMaterialAOF, quitarMaterialDeOF, recalcularMaterialesDeOF } from './ofActions'

// Materiales requeridos de una OF: comparados en vivo contra el stock de
// Almacén (para saber qué falta comprar), con consumo parcial registrado
// aquí mismo (ver stockActions.registrarConsumoMaterial) — cada registro
// resta stock real y queda trazado hacia esta OF en el historial del
// material. No hay página de detalle por OF, así que esto vive en un
// modal, mismo patrón que Documentos/Historial en otros módulos.
export default function MaterialesOFModal({ of, onClose }) {
  const { materiales } = useMateriales()
  const toast = useToast()

  const [materialConsumo, setMaterialConsumo] = useState('')
  const [cantidadConsumo, setCantidadConsumo] = useState('')
  const [motivoExceso, setMotivoExceso] = useState('')
  const [pidiendoMotivo, setPidiendoMotivo] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const [agregandoMaterial, setAgregandoMaterial] = useState(false)
  const [nuevoMaterialId, setNuevoMaterialId] = useState('')
  const [nuevoMaterialPlan, setNuevoMaterialPlan] = useState('1')

  const [ocSugerida, setOcSugerida] = useState(null)
  const [quitandoId, setQuitandoId] = useState(null)
  const [recalculando, setRecalculando] = useState(false)
  const [seleccionados, setSeleccionados] = useState(() => new Set())

  if (!of) return null

  const recalcular = async () => {
    setRecalculando(true)
    try {
      await recalcularMaterialesDeOF(of)
      toast('Materiales recalculados desde la cotización')
    } catch {
      toast('No se pudo recalcular. Intenta de nuevo.', 'error')
    } finally {
      setRecalculando(false)
    }
  }

  const requeridos = of.materialesRequeridos ?? []
  const nombreMaterial = (id) => materiales.find((m) => m.id === id)?.nombre ?? ''
  const stockDe = (id) => materiales.find((m) => m.id === id)?.stock ?? 0

  const faltaDe = (linea) => {
    const consumido = linea.cantidadConsumida ?? 0
    const pendiente = Math.max(0, linea.cantidadPlan - consumido)
    return Math.max(0, pendiente - stockDe(linea.materialId))
  }
  const faltantes = requeridos.filter((l) => faltaDe(l) > 0)
  const todosSeleccionados =
    faltantes.length > 0 && faltantes.every((l) => seleccionados.has(l.materialId))

  const toggleSeleccion = (materialId) => {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(materialId)) next.delete(materialId)
      else next.add(materialId)
      return next
    })
  }

  const toggleTodos = () => {
    setSeleccionados(
      todosSeleccionados ? new Set() : new Set(faltantes.map((l) => l.materialId)),
    )
  }

  const generarOcSeleccionados = () => {
    const lineas = faltantes
      .filter((l) => seleccionados.has(l.materialId))
      .map((l) => ({ materialId: l.materialId, cantidad: String(faltaDe(l)) }))
    if (lineas.length === 0) return
    setOcSugerida(lineas)
  }

  const resetFormConsumo = () => {
    setMaterialConsumo('')
    setCantidadConsumo('')
    setMotivoExceso('')
    setPidiendoMotivo(false)
  }

  const submitConsumo = async (e) => {
    e.preventDefault()
    const cantidad = Number(cantidadConsumo)
    if (!materialConsumo || !cantidad) return

    const linea = requeridos.find((l) => l.materialId === materialConsumo)
    const excede = linea && (linea.cantidadConsumida ?? 0) + cantidad > linea.cantidadPlan

    // Se avisa y se pide el motivo antes de guardar — no se bloquea, solo
    // se deja rastro de por qué se usó más de lo planeado (ver contexto
    // del proyecto: "avisar y dejar seguir, pero marcar el porqué").
    if (excede && !pidiendoMotivo) {
      setPidiendoMotivo(true)
      return
    }
    if (excede && !motivoExceso.trim()) return

    setGuardando(true)
    try {
      const { movimientoId } = await registrarConsumoMaterial({
        of,
        materialId: materialConsumo,
        cantidad,
        motivoExceso: excede ? motivoExceso.trim() : null,
      })
      toast('Consumo registrado', 'success', {
        onUndo: () =>
          revertirConsumoMaterial({ movimientoId, of, materialId: materialConsumo, cantidad }),
      })
      resetFormConsumo()
    } catch (err) {
      toast(
        err.message === 'stock-insuficiente'
          ? 'No hay suficiente stock de ese material.'
          : 'No se pudo registrar el consumo. Intenta de nuevo.',
        'error',
      )
    } finally {
      setGuardando(false)
    }
  }

  const submitAgregarMaterial = async (e) => {
    e.preventDefault()
    if (!nuevoMaterialId) return
    setGuardando(true)
    try {
      await agregarMaterialAOF(of, nuevoMaterialId, Number(nuevoMaterialPlan) || 0)
      setAgregandoMaterial(false)
      setNuevoMaterialId('')
      setNuevoMaterialPlan('1')
    } catch (err) {
      toast(
        err.message === 'material-ya-agregado'
          ? 'Ese material ya está en la lista de esta OF.'
          : 'No se pudo agregar. Intenta de nuevo.',
        'error',
      )
    } finally {
      setGuardando(false)
    }
  }

  const quitar = async (materialId) => {
    setQuitandoId(materialId)
    try {
      await quitarMaterialDeOF(of, materialId)
    } catch (err) {
      toast(
        err.message === 'material-con-consumo'
          ? 'Ya tiene consumo registrado — no se puede quitar.'
          : 'No se pudo quitar. Intenta de nuevo.',
        'error',
      )
    } finally {
      setQuitandoId(null)
    }
  }

  return (
    <>
      <Modal
        open={Boolean(of)}
        onClose={onClose}
        title="Materiales de la OF"
        subtitle={`${of.numeroSerie} — ${of.cliente}${of.modelos?.length ? ` — ${of.modelos.join(', ')}` : ''}`}
        maxWidth="max-w-2xl"
      >
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={recalcular}
            disabled={recalculando}
            title="Si la cotización cambió (modelo o cantidad) después de abrir esta OF, esto vuelve a calcular los materiales — sin perder el consumo ya registrado."
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 transition-colors hover:text-brand-800 hover:underline disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${recalculando ? 'animate-spin' : ''}`} />
            {recalculando ? 'Recalculando…' : 'Recalcular desde la cotización'}
          </button>
        </div>

        {requeridos.length === 0 ? (
          <p className="text-sm text-ink-faint">
            Este modelo no tiene lista de materiales capturada todavía — agrégalos a mano abajo.
          </p>
        ) : (
          <>
            {faltantes.length > 0 && (
              <div className="mb-2 flex items-center justify-between rounded-md bg-surface-2 px-3 py-2">
                <label className="flex items-center gap-2 text-xs font-medium text-ink-dim">
                  <input
                    type="checkbox"
                    checked={todosSeleccionados}
                    onChange={toggleTodos}
                    className="h-3.5 w-3.5 rounded border-line-strong text-brand-700 focus:ring-brand-500"
                  />
                  Seleccionar todo lo que falta ({faltantes.length})
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={seleccionados.size === 0}
                  onClick={generarOcSeleccionados}
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Generar O.C. ({seleccionados.size})
                </Button>
              </div>
            )}
            <div className="overflow-hidden rounded-md border border-line-strong">
              <table className="w-full table-fixed text-left text-sm">
                <colgroup>
                  <col className="w-8" />
                  <col />
                  <col className="w-20" />
                  <col className="w-20" />
                  <col className="w-20" />
                  <col className="w-16" />
                </colgroup>
                <thead className="bg-surface-2 text-[0.625rem] font-mono uppercase tracking-wide text-ink-faint">
                  <tr>
                    <th className="px-3 py-2" />
                    <th className="px-3 py-2">Material</th>
                    <th className="px-3 py-2 text-right">Plan</th>
                    <th className="px-3 py-2 text-right">Usado</th>
                    <th className="px-3 py-2 text-right">Disp.</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {requeridos.map((linea) => {
                    const consumido = linea.cantidadConsumida ?? 0
                    const disponible = stockDe(linea.materialId)
                    const falta = faltaDe(linea)
                    return (
                      <tr key={linea.materialId} className="align-top">
                        <td className="px-3 py-2.5">
                          {falta > 0 && (
                            <input
                              type="checkbox"
                              checked={seleccionados.has(linea.materialId)}
                              onChange={() => toggleSeleccion(linea.materialId)}
                              className="h-3.5 w-3.5 rounded border-line-strong text-brand-700 focus:ring-brand-500"
                            />
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="font-medium leading-snug text-ink">
                            <MaterialNombre materialId={linea.materialId} />
                          </div>
                          {falta > 0 && (
                            <span className="mt-1 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-red-100 px-2 py-0.5 text-[0.6875rem] font-medium text-red-700">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              Falta {falta}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-ink-dim">
                          {linea.cantidadPlan}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-ink-dim">
                          {consumido}
                          {consumido > linea.cantidadPlan && (
                            <span className="ml-1 text-red-600" title="Se usó más de lo planeado">
                              ▲
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-ink-dim">
                          {disponible}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            {falta > 0 && (
                              <IconButton
                                icon={ShoppingCart}
                                onClick={() =>
                                  setOcSugerida([
                                    { materialId: linea.materialId, cantidad: String(falta) },
                                  ])
                                }
                                title="Generar O.C. sugerida"
                              />
                            )}
                            {consumido === 0 && (
                              <IconButton
                                icon={Trash2}
                                variant="danger"
                                disabled={quitandoId === linea.materialId}
                                onClick={() => quitar(linea.materialId)}
                                title="Quitar de la lista"
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        <form onSubmit={submitConsumo} className="mt-4 border-t border-line pt-4">
          <p className="mb-2 text-sm font-medium text-ink-dim">Registrar consumo</p>
          <div className="flex items-center gap-2">
            <select
              required
              value={materialConsumo}
              onChange={(e) => {
                setMaterialConsumo(e.target.value)
                setPidiendoMotivo(false)
                setMotivoExceso('')
              }}
              className={`flex-1 ${inputClassInline}`}
            >
              <option value="" disabled>
                Selecciona un material
              </option>
              {requeridos.map((l) => (
                <option key={l.materialId} value={l.materialId}>
                  {nombreMaterial(l.materialId)}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              required
              placeholder="Cantidad"
              value={cantidadConsumo}
              onChange={(e) => setCantidadConsumo(e.target.value)}
              className={`w-24 ${inputClassInline}`}
            />
            <Button type="submit" size="sm" loading={guardando}>
              Registrar
            </Button>
          </div>

          {pidiendoMotivo && (
            <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5" />
                Esto deja el consumo por arriba de lo planeado — dinos por qué
              </p>
              <textarea
                autoFocus
                required
                rows={2}
                value={motivoExceso}
                onChange={(e) => setMotivoExceso(e.target.value)}
                placeholder="Ej. pieza dañada, se rehizo una parte…"
                className={inputClass}
              />
            </div>
          )}
        </form>

        <div className="mt-4 border-t border-line pt-4">
          {agregandoMaterial ? (
            <form onSubmit={submitAgregarMaterial} className="flex items-center gap-2">
              <div className="flex-1">
                <MaterialPicker inline value={nuevoMaterialId} onChange={setNuevoMaterialId} />
              </div>
              <input
                type="number"
                min="0"
                placeholder="Planeado"
                value={nuevoMaterialPlan}
                onChange={(e) => setNuevoMaterialPlan(e.target.value)}
                className={`w-24 ${inputClassInline}`}
              />
              <Button type="submit" size="sm" variant="outline" loading={guardando}>
                Agregar
              </Button>
              <IconButton
                type="button"
                icon={Trash2}
                onClick={() => {
                  setAgregandoMaterial(false)
                  setNuevoMaterialId('')
                }}
                title="Cancelar"
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAgregandoMaterial(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 transition-colors hover:text-brand-800 hover:underline"
            >
              <Plus className="h-4 w-4" />
              Agregar material que no venía en la lista
            </button>
          )}
        </div>
      </Modal>

      <NuevaOrdenCompraModal
        open={Boolean(ocSugerida)}
        onClose={() => {
          setOcSugerida(null)
          setSeleccionados(new Set())
        }}
        lineasIniciales={ocSugerida}
      />
    </>
  )
}
