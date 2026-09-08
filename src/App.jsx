import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import RequireArea from './modules/auth/RequireArea'
import RequireAuth from './modules/auth/RequireAuth'
import DashboardPage from './modules/dashboard/DashboardPage'
import PageLoading from './components/PageLoading'

// Cada módulo se carga como su propio chunk, en lugar de ir todo en un solo
// bundle de ~1MB — así la carga inicial solo trae el Inicio, y el resto se
// descarga bajo demanda al navegar a esa sección.
const AlmacenPage = lazy(() => import('./modules/almacen/AlmacenPage'))
const ComprasPage = lazy(() => import('./modules/compras/ComprasPage'))
const FinanzasPage = lazy(() => import('./modules/finanzas/FinanzasPage'))
const NotFoundPage = lazy(() => import('./modules/NotFoundPage'))
const ProduccionPage = lazy(() => import('./modules/produccion/ProduccionPage'))
const TransformadoresPage = lazy(() => import('./modules/transformadores/TransformadoresPage'))
const UsuariosPage = lazy(() => import('./modules/admin/UsuariosPage'))
const VentasDetalle = lazy(() => import('./modules/ventas/VentasDetalle'))
const VentasList = lazy(() => import('./modules/ventas/VentasList'))

export default function App() {
  return (
    <RequireAuth>
      <Suspense fallback={<PageLoading />}>
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
      </Suspense>
    </RequireAuth>
  )
}
