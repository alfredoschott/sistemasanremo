import { LayoutGrid } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { AREAS } from '../lib/areas'
import { useRoles } from '../lib/RolesContext'

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
    <nav className="hidden shrink-0 border-b border-line bg-surface sm:block">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-[4px] overflow-x-auto px-[24px]">
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
