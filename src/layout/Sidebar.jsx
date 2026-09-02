import { Boxes, Factory, LayoutGrid, ShoppingCart, TrendingUp } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Inicio', icon: LayoutGrid, end: true },
  { to: '/ventas', label: 'Ventas', icon: TrendingUp },
  { to: '/compras', label: 'Compras', icon: ShoppingCart },
  { to: '/produccion', label: 'Producción', icon: Factory },
  { to: '/almacen', label: 'Almacén', icon: Boxes },
]

export default function Sidebar({ mobileOpen = false, onCloseMobile }) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 sm:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`fixed inset-y-14 left-0 z-30 w-56 shrink-0 border-r border-slate-200 bg-white transition-transform duration-200 ease-out sm:static sm:inset-auto sm:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex flex-col gap-1 p-3">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-brand-50 text-brand-800'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand-700 transition-all duration-200 ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                      isActive ? 'text-brand-700' : 'text-slate-400'
                    }`}
                    strokeWidth={2}
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
