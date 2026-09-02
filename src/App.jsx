import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import AlmacenPage from './modules/almacen/AlmacenPage'
import ComprasPage from './modules/compras/ComprasPage'
import ProduccionPage from './modules/produccion/ProduccionPage'
import VentasDetalle from './modules/ventas/VentasDetalle'
import VentasList from './modules/ventas/VentasList'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/ventas" replace />} />
        <Route path="ventas" element={<VentasList />} />
        <Route path="ventas/:id" element={<VentasDetalle />} />
        <Route path="compras" element={<ComprasPage />} />
        <Route path="produccion" element={<ProduccionPage />} />
        <Route path="almacen" element={<AlmacenPage />} />
      </Route>
    </Routes>
  )
}
