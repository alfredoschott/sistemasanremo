import { Boxes, Container, Factory, LayoutGrid, ShoppingCart, TrendingUp, Wallet } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Inicio', icon: LayoutGrid, end: true, n: '01' },
  { to: '/ventas', label: 'Ventas', icon: TrendingUp, n: '02' },
  { to: '/compras', label: 'Compras', icon: ShoppingCart, n: '03' },
  { to: '/produccion', label: 'Producción', icon: Factory, n: '04' },
  { to: '/almacen', label: 'Almacén', icon: Boxes, n: '05' },
  { to: '/transformadores', label: 'Transformadores', icon: Container, n: '06' },
  { to: '/finanzas', label: 'Finanzas', icon: Wallet, n: '07' },
]

export default function Sidebar() {
  return (
    <nav className="hidden shrink-0 border-b border-line bg-surface sm:block">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-1 overflow-x-auto px-6">
        {links.map(({ to, label, icon: Icon, end, n }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-[0.8125rem] font-medium transition-colors duration-150 ${
                isActive
                  ? 'border-brand-600 text-brand-800'
                  : 'border-transparent text-ink-dim hover:border-line-strong hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`font-mono text-[0.625rem] ${isActive ? 'text-brand-600' : 'text-ink-faint'}`}>
                  {n}
                </span>
                <Icon
                  className={`h-4 w-4 shrink-0 ${isActive ? 'text-brand-700' : 'text-ink-faint'}`}
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
