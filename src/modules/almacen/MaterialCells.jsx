import { doc, updateDoc } from 'firebase/firestore'
import { AlertTriangle, Check, ChevronDown, ChevronsUpDown, ChevronUp, Pencil } from 'lucide-react'
import { useState } from 'react'
import { db } from '../../lib/firebase'
import { mensajeError } from '../../lib/firestoreErrors'
import { useToast } from '../../lib/ToastContext'
import { CATEGORIAS, UNIDADES_SUGERIDAS } from './materialStatus'

// Celdas editables de la tabla de Materiales (AlmacenPage) — cada una es
// autosuficiente: recibe el material y guarda su propio cambio en
// Firestore al perder el foco, sin tocar el estado de la página.

const ESTADO_BADGE = {
  sinCapturar: { label: 'Sin capturar', classes: 'bg-surface-2 text-ink-faint' },
  critico: { label: 'Sin stock', classes: 'bg-red-100 text-red-700' },
  bajo: { label: 'Bajo mínimo', classes: 'bg-amber-100 text-amber-700' },
}

export function EstadoBadge({ estado }) {
  const info = ESTADO_BADGE[estado]
  if (!info) return null
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${info.classes}`}>
      {estado !== 'sinCapturar' && <AlertTriangle className="h-3 w-3" />}
      {info.label}
    </span>
  )
}

export function MinimoInput({ material }) {
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

export function UnidadInput({ material }) {
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

export function CategoriaSelect({ material }) {
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

export function NombreEditable({ material }) {
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

export function SortIcon({ activo, dir }) {
  if (!activo) return <ChevronsUpDown className="h-3 w-3 text-line-strong" />
  return dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
}

export const ESTADO_STOCK_COLOR = {
  sinCapturar: 'text-ink-faint',
  critico: 'text-red-600',
  bajo: 'text-amber-600',
  ok: 'text-ink-dim',
}
