import { Boxes, Container, Factory, ShoppingCart, TrendingUp, Wallet } from 'lucide-react'

// Fuente única de verdad de las áreas del sistema: rol requerido, ruta,
// ícono y etiqueta. La usan Sidebar/BottomNav (para decidir qué enlaces
// mostrar), App.jsx (para proteger cada ruta) y el panel de Usuarios
// (para armar los checkboxes de asignación). "admin" no aparece aquí:
// es un rol especial que da acceso a todas las áreas (ver useRoles).
export const AREAS = [
  { rol: 'ventas', to: '/ventas', label: 'Ventas', icon: TrendingUp },
  { rol: 'compras', to: '/compras', label: 'Compras', icon: ShoppingCart },
  { rol: 'produccion', to: '/produccion', label: 'Producción', icon: Factory },
  { rol: 'almacen', to: '/almacen', label: 'Almacén', icon: Boxes },
  { rol: 'transformadores', to: '/transformadores', label: 'Transformadores', icon: Container },
  { rol: 'finanzas', to: '/finanzas', label: 'Finanzas', icon: Wallet },
]

export const ROLES_DISPONIBLES = [...AREAS.map((a) => a.rol), 'admin']

export const ROL_LABEL = {
  ventas: 'Ventas',
  compras: 'Compras',
  produccion: 'Producción',
  almacen: 'Almacén',
  transformadores: 'Transformadores',
  finanzas: 'Finanzas',
  admin: 'Admin',
}
