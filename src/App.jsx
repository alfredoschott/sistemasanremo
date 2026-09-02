import { Route, Routes } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import AlmacenPage from './modules/almacen/AlmacenPage'
import RequireAuth from './modules/auth/RequireAuth'
import ComprasPage from './modules/compras/ComprasPage'
import DashboardPage from './modules/dashboard/DashboardPage'
import NotFoundPage from './modules/NotFoundPage'
import ProduccionPage from './modules/produccion/ProduccionPage'
import VentasDetalle from './modules/ventas/VentasDetalle'
import VentasList from './modules/ventas/VentasList'

export default function App() {
  return (
    <RequireAuth>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="ventas" element={<VentasList />} />
          <Route path="ventas/:id" element={<VentasDetalle />} />
          <Route path="compras" element={<ComprasPage />} />
          <Route path="produccion" element={<ProduccionPage />} />
          <Route path="almacen" element={<AlmacenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </RequireAuth>
  )
}
