import { LayoutGrid } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { AREAS } from '../lib/areas'
import { useRoles } from '../lib/RolesContext'

// Misma barra en mobile y escritorio (antes mobile tenía su propio tab
// bar abajo — se unificó todo aquí arriba). Con hasta 7 pestañas en el
// ancho de un teléfono, los nombres largos se acortan para que quepan
// más sin tener que hacer scroll horizontal.
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
      <div className="mx-auto flex max-w-6xl items-center justify-start gap-[4px] overflow-x-auto px-[max(12px,env(safe-area-inset-left))] sm:justify-center sm:px-[24px]">
        {links.map(({ to, label, icon: Icon, end, rol }, i) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group flex shrink-0 items-center gap-[8px] border-b-2 px-[12px] py-[12px] text-[13px] font-medium transition-colors duration-150 sm:px-[16px] ${
                isActive
                  ? 'border-brand-600 text-brand-800'
                  : 'border-transparent text-ink-dim hover:border-line-strong hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`hidden font-mono text-[10px] sm:inline ${isActive ? 'text-brand-600' : 'text-ink-faint'}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Icon
                  className={`h-[16px] w-[16px] shrink-0 ${isActive ? 'text-brand-700' : 'text-ink-faint'}`}
                  strokeWidth={2}
                />
                <span className="sm:hidden">{LABEL_MOBILE[rol] ?? label}</span>
                <span className="hidden sm:inline">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
