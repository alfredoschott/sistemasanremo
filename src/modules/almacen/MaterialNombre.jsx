import { useMateriales } from './useMateriales'

export default function MaterialNombre({ materialId }) {
  const { materiales } = useMateriales()
  const material = materiales.find((m) => m.id === materialId)
  return material?.nombre ?? '—'
}
