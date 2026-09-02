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

export default function BottomNav() {
  return (
    <nav className="grid shrink-0 grid-cols-6 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className="group relative flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium leading-none"
        >
          {({ isActive }) => (
            <>
              <span
                className={`absolute top-0 h-0.5 w-8 rounded-full bg-brand-600 transition-opacity duration-150 ${
                  isActive ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <Icon
                className={`h-5 w-5 transition-transform duration-150 group-active:scale-90 ${
                  isActive ? 'text-brand-700' : 'text-slate-400'
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={isActive ? 'text-brand-700' : 'text-slate-500'}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
