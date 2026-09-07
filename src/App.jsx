import { Route, Routes } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import AlmacenPage from './modules/almacen/AlmacenPage'
import RequireArea from './modules/auth/RequireArea'
import RequireAuth from './modules/auth/RequireAuth'
import ComprasPage from './modules/compras/ComprasPage'
import DashboardPage from './modules/dashboard/DashboardPage'
import FinanzasPage from './modules/finanzas/FinanzasPage'
import NotFoundPage from './modules/NotFoundPage'
import ProduccionPage from './modules/produccion/ProduccionPage'
import TransformadoresPage from './modules/transformadores/TransformadoresPage'
import UsuariosPage from './modules/admin/UsuariosPage'
import VentasDetalle from './modules/ventas/VentasDetalle'
import VentasList from './modules/ventas/VentasList'

export default function App() {
  return (
    <RequireAuth>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route
            path="ventas"
            element={
              <RequireArea rol="ventas">
                <VentasList />
              </RequireArea>
            }
          />
          <Route
            path="ventas/:id"
            element={
              <RequireArea rol="ventas">
                <VentasDetalle />
              </RequireArea>
            }
          />
          <Route
            path="compras"
            element={
              <RequireArea rol="compras">
                <ComprasPage />
              </RequireArea>
            }
          />
          <Route
            path="produccion"
            element={
              <RequireArea rol="produccion">
                <ProduccionPage />
              </RequireArea>
            }
          />
          <Route
            path="almacen"
            element={
              <RequireArea rol="almacen">
                <AlmacenPage />
              </RequireArea>
            }
          />
          <Route
            path="transformadores"
            element={
              <RequireArea rol="transformadores">
                <TransformadoresPage />
              </RequireArea>
            }
          />
          <Route
            path="finanzas"
            element={
              <RequireArea rol="finanzas">
                <FinanzasPage />
              </RequireArea>
            }
          />
          <Route
            path="usuarios"
            element={
              <RequireArea rol="admin">
                <UsuariosPage />
              </RequireArea>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </RequireAuth>
  )
}
