import { Container, Factory, Search, ShoppingCart, TrendingUp, Truck, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { currencyCompact } from '../lib/currency'
import { useRoles } from '../lib/RolesContext'
import { useMateriales } from '../modules/almacen/useMateriales'
import { useProveedores } from '../modules/compras/useProveedores'
import { useOrdenesFabricacion } from '../modules/produccion/useOrdenesFabricacion'
import { useTransformadores } from '../modules/transformadores/useTransformadores'
import { useCotizaciones } from '../modules/ventas/useCotizaciones'

const LIMITE_POR_GRUPO = 5

function normaliza(texto) {
  return (texto ?? '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

// Los datos de la búsqueda (cinco colecciones completas) solo se descargan
// mientras el panel está abierto — y solo las que el rol puede leer. Antes
// vivían en la barra superior y cada sesión las leía en cada pantalla, aunque
// nadie usara el buscador.
function BuscadorPanel({ onClose }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { tieneAcceso } = useRoles()

  const { cotizaciones } = useCotizaciones({ enabled: tieneAcceso('ventas') })
  const { ordenes: ordenesFabricacion } = useOrdenesFabricacion({ enabled: tieneAcceso('produccion') })
  const { materiales } = useMateriales({ enabled: tieneAcceso('almacen') })
  const proveedores = useProveedores({ enabled: tieneAcceso('compras') })
  const { transformadores } = useTransformadores({ enabled: tieneAcceso('transformadores') })

  // Foco del input al abrir (sincroniza con el DOM, un sistema externo a React).
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [])

  const q = normaliza(query.trim())

  const resultados = useMemo(() => {
    if (!q) return []
    const grupos = []

    if (tieneAcceso('ventas')) {
      const items = cotizaciones
        .filter((c) => normaliza(c.cliente).includes(q))
        .slice(0, LIMITE_POR_GRUPO)
        .map((c) => ({
          id: c.id,
          titulo: c.cliente,
          subtitulo: `${c.estado} · ${currencyCompact.format(c.monto ?? 0)}`,
          onClick: () => navigate(`/ventas/${c.id}`),
        }))
      if (items.length) grupos.push({ label: 'Cotizaciones', icon: TrendingUp, items })
    }

    if (tieneAcceso('produccion')) {
      const items = ordenesFabricacion
        .filter((of) => normaliza(of.numeroSerie).includes(q) || normaliza(of.cliente).includes(q))
        .slice(0, LIMITE_POR_GRUPO)
        .map((of) => ({
          id: of.id,
          titulo: of.numeroSerie,
          subtitulo: `${of.cliente} · ${of.estado}`,
          onClick: () => navigate(`/produccion?q=${encodeURIComponent(of.numeroSerie)}`),
        }))
      if (items.length) grupos.push({ label: 'Órdenes de fabricación', icon: Factory, items })
    }

    if (tieneAcceso('almacen')) {
      const items = materiales
        .filter((m) => normaliza(m.nombre).includes(q))
        .slice(0, LIMITE_POR_GRUPO)
        .map((m) => ({
          id: m.id,
          titulo: m.nombre,
          subtitulo: `${m.categoria ?? 'Sin categoría'} · stock ${m.stock ?? 0} ${m.unidad ?? ''}`,
          onClick: () => navigate(`/almacen?q=${encodeURIComponent(m.nombre)}`),
        }))
      if (items.length) grupos.push({ label: 'Materiales', icon: Container, items })
    }

    if (tieneAcceso('compras')) {
      const items = proveedores
        .filter((p) => normaliza(p.nombre).includes(q))
        .slice(0, LIMITE_POR_GRUPO)
        .map((p) => ({
          id: p.id,
          titulo: p.nombre,
          subtitulo: p.email || p.telefono || 'Proveedor',
          onClick: () => navigate('/compras'),
        }))
      if (items.length) grupos.push({ label: 'Proveedores', icon: Truck, items })
    }

    if (tieneAcceso('transformadores')) {
      const items = transformadores
        .filter(
          (t) =>
            normaliza(t.modelo).includes(q) ||
            normaliza(t.ubicacion).includes(q) ||
            normaliza(t.destino).includes(q),
        )
        .slice(0, LIMITE_POR_GRUPO)
        .map((t) => ({
          id: t.id,
          titulo: t.modelo,
          subtitulo: t.destino || t.ubicacion || `${t.cantidad ?? 0} en inventario`,
          onClick: () => navigate(`/transformadores?q=${encodeURIComponent(t.modelo)}`),
        }))
      if (items.length) grupos.push({ label: 'Transformadores', icon: ShoppingCart, items })
    }

    return grupos
  }, [q, cotizaciones, ordenesFabricacion, materiales, proveedores, transformadores, tieneAcceso, navigate])

  const totalResultados = resultados.reduce((sum, g) => sum + g.items.length, 0)

  const elegir = (item) => {
    item.onClick()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-start justify-center bg-slate-900/50 pt-[max(4rem,calc(env(safe-area-inset-top)+2rem))] backdrop-blur-[2px] animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-lg border border-line-strong bg-surface shadow-2xl animate-scale-in">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-ink-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cotizaciones, OF, materiales, proveedores, transformadores…"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
          />
          <button
            onClick={() => onClose()}
            className="shrink-0 rounded-md p-1 text-ink-faint hover:bg-surface-2 hover:text-ink-dim"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
          {!q && (
            <p className="px-4 py-8 text-center text-sm text-ink-faint">
              Escribe para buscar en toda la app.
            </p>
          )}
          {q && totalResultados === 0 && (
            <p className="px-4 py-8 text-center text-sm text-ink-faint">Sin resultados para "{query}".</p>
          )}
          {resultados.map((grupo) => (
            <div key={grupo.label} className="border-b border-line last:border-0">
              <p className="px-4 pt-3 pb-1 font-mono text-[0.625rem] uppercase tracking-wide text-ink-faint">
                {grupo.label}
              </p>
              {grupo.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => elegir(item)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-2"
                >
                  <grupo.icon className="h-4 w-4 shrink-0 text-ink-faint" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">{item.titulo}</span>
                    <span className="block truncate text-xs text-ink-faint">{item.subtitulo}</span>
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)

  // Atajo Cmd/Ctrl+K, como en casi cualquier app con búsqueda global —
  // y Escape para cerrar, sin importar qué tenga el foco.
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Buscar (Cmd/Ctrl+K)"
        aria-label="Buscar"
        className="flex h-[32px] w-[32px] items-center justify-center rounded-full text-brand-50/90 transition-colors hover:bg-surface/10"
      >
        <Search className="h-[18px] w-[18px]" />
      </button>

      {open && <BuscadorPanel onClose={() => setOpen(false)} />}
    </>
  )
}
