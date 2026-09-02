import { NavLink } from 'react-router-dom'

const links = [
  { to: '/ventas', label: 'Ventas' },
  { to: '/compras', label: 'Compras' },
  { to: '/produccion', label: 'Producción' },
  { to: '/almacen', label: 'Almacén' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-slate-200 bg-white">
      <nav className="flex flex-col gap-1 p-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-medium ${
                isActive
                  ? 'bg-brand-50 text-brand-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
