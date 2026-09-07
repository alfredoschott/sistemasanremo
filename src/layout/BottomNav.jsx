import { LayoutGrid } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { AREAS } from '../lib/areas'
import { useRoles } from '../lib/RolesContext'

// Etiquetas más cortas que las de Sidebar: con hasta 7 pestañas (6 áreas +
// Inicio) en el ancho de un teléfono, los nombres largos se encimaban con
// el de al lado. truncate + min-w-0 abajo cubren cualquier caso aún más
// apretado (texto grande de accesibilidad, pantalla angosta).
//
// Tamaños fijos en px a propósito (ver nota en Topbar.jsx): esta barra no
// debe crecer con el zoom de accesibilidad, solo el contenido de la página.
const LABEL_MOBILE = { produccion: 'Prod.', transformadores: 'Transf.' }

export default function BottomNav() {
  const { tieneAcceso } = useRoles()

  const links = [
    { to: '/', label: 'Inicio', icon: LayoutGrid, end: true },
    ...AREAS.filter((a) => tieneAcceso(a.rol)).map((a) => ({
      ...a,
      label: LABEL_MOBILE[a.rol] ?? a.label,
    })),
  ]

  return (
    <nav
      className="grid shrink-0 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden"
      style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}
    >
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className="group relative flex min-w-0 flex-col items-center justify-center gap-[2px] py-[8px] text-[10px] font-medium leading-none"
        >
          {({ isActive }) => (
            <>
              <span
                className={`absolute top-0 h-[2px] w-[32px] bg-brand-600 transition-opacity duration-150 ${
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
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
