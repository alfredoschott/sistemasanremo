import { doc, updateDoc } from 'firebase/firestore'
import { AlertTriangle, Boxes, Check, Clock, Download, Pencil, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import IconButton from '../../components/IconButton'
import { MetricCard, MetricsRow } from '../../components/Metric'
import SearchInput from '../../components/SearchInput'
import { TableSkeleton } from '../../components/Skeleton'
import { db } from '../../lib/firebase'
import { exportCsv } from '../../lib/exportCsv'
import { useToast } from '../../lib/ToastContext'
import NuevaOrdenCompraModal from '../compras/NuevaOrdenCompraModal'
import HistorialMaterialModal from './HistorialMaterialModal'
import MovimientoModal from './MovimientoModal'
import { eliminarMaterial as eliminarMaterialSeguro, restaurarMaterial } from './stockActions'
import { useMateriales } from './useMateriales'
import { useMovimientosHoy } from './useMovimientosHoy'

function MinimoInput({ material }) {
  const [value, setValue] = useState(material.minimo ?? 0)
  const toast = useToast()

  const commit = () => {
    const minimo = Number(value) || 0
    if (minimo !== material.minimo) {
      updateDoc(doc(db, 'materiales', material.id), { minimo }).catch(() =>
        toast('No se pudo actualizar el mínimo.', 'error'),
      )
    }
  }

  return (
    <input
      type="number"
      min="0"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
    />
  )
}

const UNIDADES_SUGERIDAS = ['pza', 'caja', 'rollo', 'par', 'kg', 'litro', 'metro', 'hoja', 'juego', 'cubeta', 'lata']

function UnidadInput({ material }) {
  const [value, setValue] = useState(material.unidad ?? 'pza')
  const toast = useToast()

  const commit = () => {
    const unidad = value.trim() || 'pza'
    setValue(unidad)
    if (unidad !== (material.unidad ?? 'pza')) {
      updateDoc(doc(db, 'materiales', material.id), { unidad }).catch(() =>
        toast('No se pudo actualizar la unidad.', 'error'),
      )
    }
  }

  return (
    <input
      list="unidades-sugeridas"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
    />
  )
}

function NombreEditable({ material }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(material.nombre)
  const toast = useToast()

  const commit = () => {
    const nombre = value.trim()
    setEditing(false)
    if (nombre && nombre !== material.nombre) {
      updateDoc(doc(db, 'materiales', material.id), { nombre }).catch(() =>
        toast('No se pudo actualizar el nombre.', 'error'),
      )
    } else {
      setValue(material.nombre)
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        />
        <button onClick={commit} className="text-brand-700 hover:text-brand-800">
          <Check className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group inline-flex items-center gap-1.5 font-medium text-slate-700"
    >
      {material.nombre}
      <Pencil className="h-3 w-3 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}

export default function AlmacenPage() {
  const { materiales, loading } = useMateriales()
  const movimientosHoy = useMovimientosHoy()
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [historialMaterial, setHistorialMaterial] = useState(null)
  const [ocSugerida, setOcSugerida] = useState(null)
  const toast = useToast()

  const eliminarMaterial = async (material) => {
    if (!window.confirm(`¿Eliminar "${material.nombre}"?`)) return
    try {
      const data = await eliminarMaterialSeguro(material)
      toast(`${material.nombre} eliminado`, 'success', {
        onUndo: () => restaurarMaterial(material.id, data),
      })
    } catch (err) {
      if (err.message === 'material-en-uso') {
        toast(`No se puede eliminar: "${material.nombre}" está en una O.C. pendiente.`, 'error')
      } else {
        toast('No se pudo eliminar el material.', 'error')
      }
    }
  }

  const metrics = useMemo(() => {
    const critico = materiales.filter((m) => (m.stock ?? 0) <= 0).length
    const bajo = materiales.filter((m) => (m.stock ?? 0) > 0 && (m.stock ?? 0) < (m.minimo ?? 0)).length
    return { critico, bajo, total: materiales.length }
  }, [materiales])

  const materialesFiltrados = useMemo(
    () =>
      materiales.filter((m) => m.nombre?.toLowerCase().includes(search.toLowerCase().trim())),
    [materiales, search],
  )

  const exportar = () => {
    exportCsv(`materiales_${new Date().toISOString().slice(0, 10)}.csv`, materialesFiltrados, [
      { label: 'Material', value: (m) => m.nombre },
      { label: 'Unidad', value: (m) => m.unidad ?? 'pza' },
      { label: 'Stock actual', value: (m) => m.stock ?? 0 },
      { label: 'Mínimo', value: (m) => m.minimo ?? 0 },
    ])
  }

  return (
    <div>
      <datalist id="unidades-sugeridas">
        {UNIDADES_SUGERIDAS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Materiales</h1>
          <p className="text-sm text-slate-500">{materiales.length} en catálogo</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={exportar}
            className="inline-flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            Movimiento
          </Button>
        </div>
      </div>

      <MetricsRow>
        <MetricCard label="Estado crítico" value={metrics.critico} variant="danger" />
        <MetricCard label="Stock bajo" value={metrics.bajo} variant="warn" />
        <MetricCard label="Materiales totales" value={metrics.total} />
        <MetricCard label="Movimientos hoy" value={movimientosHoy} variant="accent" />
      </MetricsRow>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar material…" />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Material</th>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3">Stock actual</th>
              <th className="px-4 py-3">Mínimo</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <TableSkeleton rows={3} cols={5} />}
            {!loading && materialesFiltrados.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon={Boxes}
                    title={search ? 'Sin resultados' : 'Sin materiales todavía'}
                    subtitle={search ? 'Prueba con otro nombre' : 'Se crean aquí o al armar una O.C.'}
                  />
                </td>
              </tr>
            )}
            {materialesFiltrados.map((material) => {
              const bajoMinimo = (material.stock ?? 0) < (material.minimo ?? 0)
              return (
                <tr key={material.id} className="transition-colors hover:bg-brand-50/40">
                  <td className="px-4 py-3">
                    <NombreEditable material={material} />
                  </td>
                  <td className="px-4 py-3">
                    <UnidadInput material={material} />
                  </td>
                  <td
                    className={`px-4 py-3 font-medium ${bajoMinimo ? 'text-red-600' : 'text-slate-600'}`}
                  >
                    {material.stock ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <MinimoInput material={material} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {bajoMinimo && (
                        <>
                          <span className="mr-1 inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                            <AlertTriangle className="h-3 w-3" />
                            Bajo mínimo
                          </span>
                          <IconButton
                            icon={ShoppingCart}
                            onClick={() =>
                              setOcSugerida({
                                materialId: material.id,
                                cantidad: String(
                                  Math.max(1, (material.minimo ?? 0) - (material.stock ?? 0)),
                                ),
                              })
                            }
                            title="Generar O.C. sugerida"
                          />
                        </>
                      )}
                      <IconButton
                        icon={Clock}
                        onClick={() => setHistorialMaterial(material)}
                        title="Ver historial"
                      />
                      <IconButton
                        icon={Trash2}
                        variant="danger"
                        onClick={() => eliminarMaterial(material)}
                        title="Eliminar material"
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <MovimientoModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <HistorialMaterialModal
        material={historialMaterial}
        onClose={() => setHistorialMaterial(null)}
      />
      <NuevaOrdenCompraModal
        open={Boolean(ocSugerida)}
        onClose={() => setOcSugerida(null)}
        lineaInicial={ocSugerida}
      />
    </div>
  )
}
