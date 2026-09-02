import { useProveedores } from './useProveedores'

export default function ProveedorNombre({ proveedorId }) {
  const proveedores = useProveedores()
  const proveedor = proveedores.find((p) => p.id === proveedorId)
  return proveedor?.nombre ?? '—'
}
