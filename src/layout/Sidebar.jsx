import { LayoutGrid } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { AREAS } from '../lib/areas'
import { useRoles } from '../lib/RolesContext'

// Con hasta 7 pestañas, los nombres largos se encimaban en pantallas
// angostas — versión corta para la barra compacta (mobile y tablet).
const LABEL_MOBILE = { produccion: 'Prod.', transformadores: 'Transf.' }

// Tamaños fijos en px a propósito (ver nota en Topbar.jsx): esta barra de
// navegación no debe crecer con el zoom de accesibilidad, solo el
// contenido de cada página.
export default function Sidebar() {
  const { tieneAcceso } = useRoles()

  const links = [
    { to: '/', label: 'Inicio', icon: LayoutGrid, end: true },
    ...AREAS.filter((a) => tieneAcceso(a.rol)),
  ]

  return (
    <nav className="no-print shrink-0 border-b border-line bg-surface">
      {/* Mobile y tablet (hasta laptop, <1024px): mismo diseño que tenía el
          tab bar de abajo (ícono arriba, texto abajo, columnas iguales) —
          la fila de escritorio con 7 pestañas numeradas necesita ~887px
          para no recortarse, así que iPad mini/Air/Pro en portrait usan
          esta versión compacta en vez de la de escritorio. */}
      <div
        className="grid pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] lg:hidden"
        style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}
      >
        {links.map(({ to, label, icon: Icon, end, rol }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="group relative flex min-w-0 flex-col items-center justify-center gap-[2px] py-[8px] text-[10px] font-medium leading-none"
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute bottom-0 h-[2px] w-[32px] bg-brand-600 transition-opacity duration-150 ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <Icon
                  className={`h-[20px] w-[20px] shrink-0 transition-transform duration-150 group-active:scale-90 ${
                    isActive ? 'text-brand-700' : 'text-ink-faint'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={`w-full truncate px-[2px] text-center ${isActive ? 'text-brand-700' : 'text-ink-faint'}`}
                >
                  {LABEL_MOBILE[rol] ?? label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Escritorio (≥1024px): fila de pestañas numeradas, ícono junto al texto. */}
      <div className="mx-auto hidden max-w-6xl items-center justify-center gap-[4px] overflow-x-auto px-[24px] lg:flex">
        {links.map(({ to, label, icon: Icon, end }, i) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group flex shrink-0 items-center gap-[8px] border-b-2 px-[16px] py-[12px] text-[13px] font-medium transition-colors duration-150 ${
                isActive
                  ? 'border-brand-600 text-brand-800'
                  : 'border-transparent text-ink-dim hover:border-line-strong hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`font-mono text-[10px] ${isActive ? 'text-brand-600' : 'text-ink-faint'}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Icon
                  className={`h-[16px] w-[16px] shrink-0 ${isActive ? 'text-brand-700' : 'text-ink-faint'}`}
                  strokeWidth={2}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
