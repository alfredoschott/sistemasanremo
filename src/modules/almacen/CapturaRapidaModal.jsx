import { useMemo, useState } from 'react'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import SearchInput from '../../components/SearchInput'
import { useToast } from '../../lib/ToastContext'
import { CATEGORIAS } from './materialStatus'
import { registrarMovimientoManual } from './stockActions'

export default function CapturaRapidaModal({ open, onClose, materiales }) {
  const [search, setSearch] = useState('')
  const [categoria, setCategoria] = useState('todas')
  const [valores, setValores] = useState({})
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const filtrados = useMemo(
    () =>
      materiales.filter((m) => {
        const coincideNombre = m.nombre?.toLowerCase().includes(search.toLowerCase().trim())
        const coincideCategoria = categoria === 'todas' || (m.categoria ?? 'Otros') === categoria
        return coincideNombre && coincideCategoria
      }),
    [materiales, search, categoria],
  )

  const cambiosPendientes = Object.keys(valores).length

  const cerrar = () => {
    setValores({})
    setSearch('')
    setCategoria('todas')
    onClose()
  }

  const guardar = async () => {
    const entradas = Object.entries(valores)
    setSaving(true)
    let ok = 0
    let fallidos = 0
    for (const [materialId, valorTexto] of entradas) {
      const material = materiales.find((m) => m.id === materialId)
      const nuevoValor = Number(valorTexto)
      const delta = nuevoValor - (material?.stock ?? 0)
      if (!material || Number.isNaN(nuevoValor) || delta === 0) continue
      try {
        await registrarMovimientoManual({
          materialId,
          tipo: delta > 0 ? 'entrada' : 'salida',
          cantidad: Math.abs(delta),
        })
        ok++
      } catch {
        fallidos++
      }
    }
    setSaving(false)

    if (ok > 0) {
      toast(`${ok} material${ok === 1 ? '' : 'es'} actualizado${ok === 1 ? '' : 's'}`, 'success')
    }
    if (fallidos > 0) {
      toast(`${fallidos} no se pudo${fallidos === 1 ? '' : 'ieron'} guardar`, 'error')
    }
    if (ok === 0 && fallidos === 0) {
      cerrar()
      return
    }
    cerrar()
  }

  return (
    <Modal
      open={open}
      onClose={cerrar}
      title="Captura rápida de inventario"
      subtitle="Escribe la cantidad real de cada material. Se guarda como movimiento de entrada o salida, con su historial."
      maxWidth="max-w-2xl"
    >
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar material…"
          className="mb-0 sm:max-w-none sm:flex-1"
        />
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        >
          <option value="todas">Todas las categorías</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Material</th>
              <th className="px-3 py-2">Actual</th>
              <th className="px-3 py-2">Cantidad real</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtrados.map((m) => (
              <tr key={m.id}>
                <td className="px-3 py-2">
                  {m.nombre}
                  <span className="ml-1 text-xs text-slate-400">({m.unidad ?? 'pza'})</span>
                </td>
                <td className="px-3 py-2 text-slate-500">{m.stock ?? 0}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    placeholder={String(m.stock ?? 0)}
                    value={valores[m.id] ?? ''}
                    onChange={(e) =>
                      setValores((prev) => {
                        const next = { ...prev }
                        if (e.target.value === '') delete next[m.id]
                        else next[m.id] = e.target.value
                        return next
                      })
                    }
                    className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                  />
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-sm text-slate-400">
                  Sin materiales que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {cambiosPendientes} cambio{cambiosPendientes === 1 ? '' : 's'} pendiente
          {cambiosPendientes === 1 ? '' : 's'}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={cerrar}>
            Cancelar
          </Button>
          <Button type="button" loading={saving} disabled={cambiosPendientes === 0} onClick={guardar}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
