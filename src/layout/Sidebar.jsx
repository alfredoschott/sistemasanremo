import { Boxes, Factory, LayoutGrid, ShoppingCart, TrendingUp, Wallet } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Inicio', icon: LayoutGrid, end: true },
  { to: '/ventas', label: 'Ventas', icon: TrendingUp },
  { to: '/compras', label: 'Compras', icon: ShoppingCart },
  { to: '/produccion', label: 'Producción', icon: Factory },
  { to: '/almacen', label: 'Almacén', icon: Boxes },
  { to: '/finanzas', label: 'Finanzas', icon: Wallet },
]

export default function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white sm:block">
      <nav className="flex flex-col gap-1 p-3">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-brand-700 to-brand-600 text-white shadow-sm shadow-brand-900/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400'
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
  )
}
