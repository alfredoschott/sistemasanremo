import { doc, updateDoc } from 'firebase/firestore'
import {
  AlertTriangle,
  Boxes,
  Check,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Clock,
  Download,
  ListChecks,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import IconButton from '../../components/IconButton'
import { MetricCard, MetricsRow } from '../../components/Metric'
import Pagination from '../../components/Pagination'
import SearchInput from '../../components/SearchInput'
import Skeleton, { TableSkeleton } from '../../components/Skeleton'
import { db } from '../../lib/firebase'
import { exportCsv } from '../../lib/exportCsv'
import { mensajeError } from '../../lib/firestoreErrors'
import { useToast } from '../../lib/ToastContext'
import NuevaOrdenCompraModal from '../compras/NuevaOrdenCompraModal'
import CapturaRapidaModal from './CapturaRapidaModal'
import HistorialMaterialModal from './HistorialMaterialModal'
import { CATEGORIAS, estadoMaterial, UNIDADES_SUGERIDAS } from './materialStatus'
import MovimientoModal from './MovimientoModal'
import NuevoMaterialModal from './NuevoMaterialModal'
import { eliminarMaterial as eliminarMaterialSeguro, restaurarMaterial } from './stockActions'
import { useMateriales } from './useMateriales'
import { useMovimientosHoy } from './useMovimientosHoy'

const ESTADO_BADGE = {
  sinCapturar: { label: 'Sin capturar', classes: 'bg-surface-2 text-ink-faint' },
  critico: { label: 'Sin stock', classes: 'bg-red-100 text-red-700' },
  bajo: { label: 'Bajo mínimo', classes: 'bg-amber-100 text-amber-700' },
}

const ESTADO_STOCK_COLOR = {
  sinCapturar: 'text-ink-faint',
  critico: 'text-red-600',
  bajo: 'text-amber-600',
  ok: 'text-ink-dim',
}

function EstadoBadge({ estado }) {
  const info = ESTADO_BADGE[estado]
  if (!info) return null
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${info.classes}`}>
      {estado !== 'sinCapturar' && <AlertTriangle className="h-3 w-3" />}
      {info.label}
    </span>
  )
}

function MinimoInput({ material }) {
  const [value, setValue] = useState(material.minimo ?? 0)
  const toast = useToast()

  const commit = () => {
    const minimo = Number(value) || 0
    if (minimo !== material.minimo) {
      updateDoc(doc(db, 'materiales', material.id), { minimo }).catch((err) =>
        toast(mensajeError(err, 'No se pudo actualizar el mínimo.'), 'error'),
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
      className="w-20 rounded-md border border-line-strong px-2 py-1 text-sm outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
    />
  )
}

const OTRA_UNIDAD = '__otra__'

function UnidadInput({ material }) {
  const unidadActual = material.unidad ?? 'pza'
  const [personalizando, setPersonalizando] = useState(false)
  const [value, setValue] = useState(unidadActual)
  const toast = useToast()

  const guardar = (unidad) => {
    if (unidad !== unidadActual) {
      updateDoc(doc(db, 'materiales', material.id), { unidad }).catch((err) =>
        toast(mensajeError(err, 'No se pudo actualizar la unidad.'), 'error'),
      )
    }
  }

  const commitPersonalizada = () => {
    const unidad = value.trim() || 'pza'
    setPersonalizando(false)
    setValue(unidad)
    guardar(unidad)
  }

  if (personalizando) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commitPersonalizada()}
        onBlur={commitPersonalizada}
        className="w-24 rounded-md border border-line-strong px-2 py-1 text-sm outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
      />
    )
  }

  const opciones = UNIDADES_SUGERIDAS.includes(unidadActual)
    ? UNIDADES_SUGERIDAS
    : [unidadActual, ...UNIDADES_SUGERIDAS]

  return (
    <select
      value={unidadActual}
      onChange={(e) => {
        if (e.target.value === OTRA_UNIDAD) {
          setValue(unidadActual)
          setPersonalizando(true)
          return
        }
        guardar(e.target.value)
      }}
      className="rounded-md border border-line-strong px-2 py-1 text-sm outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
    >
      {opciones.map((u) => (
        <option key={u} value={u}>
          {u}
        </option>
      ))}
      <option value={OTRA_UNIDAD}>Otra…</option>
    </select>
  )
}

function CategoriaSelect({ material }) {
  const toast = useToast()

  const onChange = (e) => {
    updateDoc(doc(db, 'materiales', material.id), { categoria: e.target.value }).catch((err) =>
      toast(mensajeError(err, 'No se pudo actualizar la categoría.'), 'error'),
    )
  }

  return (
    <select
      value={material.categoria ?? 'Otros'}
      onChange={onChange}
      className="rounded-md border border-line-strong px-2 py-1 text-sm outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
    >
      {CATEGORIAS.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
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
      updateDoc(doc(db, 'materiales', material.id), { nombre }).catch((err) =>
        toast(mensajeError(err, 'No se pudo actualizar el nombre.'), 'error'),
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
          className="rounded-md border border-line-strong px-2 py-1 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
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
      className="group inline-flex items-center gap-1.5 text-left font-medium text-ink"
    >
      {material.nombre}
      <Pencil className="h-3 w-3 shrink-0 text-line-strong opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}

function SortIcon({ activo, dir }) {
  if (!activo) return <ChevronsUpDown className="h-3 w-3 text-line-strong" />
  return dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
}

const POR_PAGINA = 20

export default function AlmacenPage() {
  const { materiales, loading } = useMateriales()
  const movimientosHoy = useMovimientosHoy()
  const [modalOpen, setModalOpen] = useState(false)
  const [capturaOpen, setCapturaOpen] = useState(false)
  const [nuevoMaterialOpen, setNuevoMaterialOpen] = useState(false)
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas')
  const [sort, setSort] = useState({ field: 'nombre', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [historialMaterial, setHistorialMaterial] = useState(null)
  const [ocSugerida, setOcSugerida] = useState(null)
  const toast = useToast()

  const buscar = (value) => {
    setSearch(value)
    setPage(1)
  }

  const filtrarCategoria = (categoria) => {
    setCategoriaFiltro(categoria)
    setPage(1)
  }

  const ordenarPor = (field) => {
    setSort((prev) => (prev.field === field ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' }))
  }

  const eliminarMaterial = async (material) => {
    if (!window.confirm(`¿Eliminar "${material.nombre}"?`)) return
    try {
      const data = await eliminarMaterialSeguro(material)
      toast(`${material.nombre} eliminado`, 'success', {
        onUndo: () => restaurarMaterial(material.id, data),
      })
    } catch (err) {
      if (err.message === 'material-en-uso') {
        toast(
          `No se puede eliminar: "${material.nombre}" tiene movimientos u órdenes de compra en su historial.`,
          'error',
        )
      } else {
        toast(mensajeError(err, 'No se pudo eliminar el material.'), 'error')
      }
    }
  }

  const metrics = useMemo(() => {
    const acc = { sinCapturar: 0, critico: 0, bajo: 0 }
    materiales.forEach((m) => {
      const estado = estadoMaterial(m)
      if (estado in acc) acc[estado]++
    })
    return { ...acc, total: materiales.length }
  }, [materiales])

  const materialesFiltrados = useMemo(
    () =>
      materiales.filter((m) => {
        const coincideNombre = m.nombre?.toLowerCase().includes(search.toLowerCase().trim())
        const coincideCategoria = categoriaFiltro === 'todas' || (m.categoria ?? 'Otros') === categoriaFiltro
        return coincideNombre && coincideCategoria
      }),
    [materiales, search, categoriaFiltro],
  )

  const materialesOrdenados = useMemo(() => {
    const factor = sort.dir === 'asc' ? 1 : -1
    return [...materialesFiltrados].sort((a, b) => {
      if (sort.field === 'stock') return ((a.stock ?? 0) - (b.stock ?? 0)) * factor
      return (a.nombre ?? '').localeCompare(b.nombre ?? '') * factor
    })
  }, [materialesFiltrados, sort])

  const totalPaginas = Math.max(1, Math.ceil(materialesOrdenados.length / POR_PAGINA))
  const paginaActual = Math.min(page, totalPaginas)
  const materialesPagina = materialesOrdenados.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA,
  )

  const exportar = () => {
    exportCsv(`materiales_${new Date().toISOString().slice(0, 10)}.csv`, materialesOrdenados, [
      { label: 'Material', value: (m) => m.nombre },
      { label: 'Categoría', value: (m) => m.categoria ?? 'Otros' },
      { label: 'Unidad', value: (m) => m.unidad ?? 'pza' },
      { label: 'Stock actual', value: (m) => m.stock ?? 0 },
      { label: 'Mínimo', value: (m) => m.minimo ?? 0 },
    ])
  }

  const pillClass = (activo) =>
    `shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
      activo ? 'bg-emerald-600 text-white' : 'bg-surface-2 text-ink-dim hover:bg-line'
    }`

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-ink">Materiales</h1>
          <p className="text-sm text-ink-faint">
            {materiales.length} en catálogo · {movimientosHoy} movimiento{movimientosHoy === 1 ? '' : 's'} hoy
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={exportar}
            className="inline-flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button
            variant="secondary"
            onClick={() => setCapturaOpen(true)}
            className="inline-flex items-center gap-1.5"
          >
            <ListChecks className="h-4 w-4" />
            Captura rápida
          </Button>
          <Button
            variant="secondary"
            onClick={() => setNuevoMaterialOpen(true)}
            className="inline-flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Nuevo material
          </Button>
          <Button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            Movimiento
          </Button>
        </div>
      </div>

      <MetricsRow>
        <MetricCard label="Sin capturar" value={metrics.sinCapturar} variant="default" />
        <MetricCard label="Estado crítico" value={metrics.critico} variant="danger" />
        <MetricCard label="Stock bajo" value={metrics.bajo} variant="warn" />
        <MetricCard label="Materiales totales" value={metrics.total} variant="emerald" />
      </MetricsRow>

      <SearchInput value={search} onChange={buscar} placeholder="Buscar material…" />

      <div className="mb-3 flex flex-wrap gap-1.5">
        <button onClick={() => filtrarCategoria('todas')} className={pillClass(categoriaFiltro === 'todas')}>
          Todas
        </button>
        {CATEGORIAS.map((c) => (
          <button key={c} onClick={() => filtrarCategoria(c)} className={pillClass(categoriaFiltro === c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto border border-line-strong bg-surface">
        <table className="hidden w-full text-left text-sm lg:table">
          <thead className="bg-surface-2 text-[0.625rem] font-mono uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3">
                <button onClick={() => ordenarPor('nombre')} className="inline-flex items-center gap-1 uppercase hover:text-ink">
                  Material
                  <SortIcon activo={sort.field === 'nombre'} dir={sort.dir} />
                </button>
              </th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3">
                <button onClick={() => ordenarPor('stock')} className="inline-flex items-center gap-1 uppercase hover:text-ink">
                  Stock actual
                  <SortIcon activo={sort.field === 'stock'} dir={sort.dir} />
                </button>
              </th>
              <th className="px-4 py-3">Mínimo</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="stagger divide-y divide-line">
            {loading && <TableSkeleton rows={3} cols={6} />}
            {!loading && materialesOrdenados.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={Boxes}
                    title={search ? 'Sin resultados' : 'Sin materiales todavía'}
                    subtitle={search ? 'Prueba con otro nombre' : 'Se crean aquí o al armar una O.C.'}
                  />
                </td>
              </tr>
            )}
            {materialesPagina.map((material) => {
              const estado = estadoMaterial(material)
              return (
                <tr key={material.id} className="transition-colors hover:bg-surface-2">
                  <td className="px-4 py-3">
                    <NombreEditable material={material} />
                  </td>
                  <td className="px-4 py-3">
                    <CategoriaSelect material={material} />
                  </td>
                  <td className="px-4 py-3">
                    <UnidadInput material={material} />
                  </td>
                  <td className={`px-4 py-3 font-medium ${ESTADO_STOCK_COLOR[estado]}`}>
                    {material.stock ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <MinimoInput material={material} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <EstadoBadge estado={estado} />
                      {(estado === 'critico' || estado === 'bajo') && (
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

        <div className="divide-y divide-line lg:hidden">
          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2.5 p-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-1/4" />
              </div>
            ))}
          {!loading && materialesOrdenados.length === 0 && (
            <EmptyState
              icon={Boxes}
              title={search ? 'Sin resultados' : 'Sin materiales todavía'}
              subtitle={search ? 'Prueba con otro nombre' : 'Se crean aquí o al armar una O.C.'}
            />
          )}
          {materialesPagina.map((material) => {
            const estado = estadoMaterial(material)
            return (
              <div key={material.id} className="flex flex-col gap-2.5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <NombreEditable material={material} />
                  <div className="flex shrink-0 items-center gap-1">
                    <IconButton icon={Clock} onClick={() => setHistorialMaterial(material)} title="Ver historial" />
                    <IconButton
                      icon={Trash2}
                      variant="danger"
                      onClick={() => eliminarMaterial(material)}
                      title="Eliminar material"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-ink-faint">
                  <label className="flex items-center gap-1.5">
                    Categoría
                    <CategoriaSelect material={material} />
                  </label>
                  <label className="flex items-center gap-1.5">
                    Unidad
                    <UnidadInput material={material} />
                  </label>
                  <label className="flex items-center gap-1.5">
                    Mínimo
                    <MinimoInput material={material} />
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-lg font-semibold ${ESTADO_STOCK_COLOR[estado]}`}>
                    {material.stock ?? 0} <span className="text-sm font-normal">{material.unidad ?? 'pza'}</span>
                  </span>
                  <EstadoBadge estado={estado} />
                </div>

                {(estado === 'critico' || estado === 'bajo') && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="inline-flex items-center justify-center gap-1.5"
                    onClick={() =>
                      setOcSugerida({
                        materialId: material.id,
                        cantidad: String(Math.max(1, (material.minimo ?? 0) - (material.stock ?? 0))),
                      })
                    }
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Generar O.C. sugerida
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        <Pagination page={paginaActual} totalPages={totalPaginas} onChange={setPage} />
      </div>

      <MovimientoModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <CapturaRapidaModal open={capturaOpen} onClose={() => setCapturaOpen(false)} materiales={materiales} />
      <NuevoMaterialModal open={nuevoMaterialOpen} onClose={() => setNuevoMaterialOpen(false)} />
      <HistorialMaterialModal
        material={historialMaterial}
        onClose={() => setHistorialMaterial(null)}
      />
      <NuevaOrdenCompraModal
        open={Boolean(ocSugerida)}
        onClose={() => setOcSugerida(null)}
        lineasIniciales={ocSugerida ? [ocSugerida] : null}
      />
    </div>
  )
}
