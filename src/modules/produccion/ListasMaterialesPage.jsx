import { ArrowLeft, ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../../components/EmptyState'
import IconButton from '../../components/IconButton'
import { TableSkeleton } from '../../components/Skeleton'
import { useToast } from '../../lib/ToastContext'
import MaterialNombre from '../almacen/MaterialNombre'
import ListaMaterialesModal from './ListaMaterialesModal'
import { eliminarListaMateriales } from './listaMaterialesActions'
import { useListasMateriales } from './useListasMateriales'

export default function ListasMaterialesPage() {
  const { listas, loading } = useListasMateriales()
  const [modalOpen, setModalOpen] = useState(false)
  const [listaParaEditar, setListaParaEditar] = useState(null)
  const [eliminandoId, setEliminandoId] = useState(null)
  const toast = useToast()

  const eliminar = async (lista) => {
    if (!window.confirm(`¿Eliminar la lista de materiales de "${lista.modelo}"? Esto no se puede deshacer.`))
      return
    setEliminandoId(lista.id)
    try {
      await eliminarListaMateriales(lista)
      toast(`Lista de "${lista.modelo}" eliminada`)
    } catch {
      toast('No se pudo eliminar. Intenta de nuevo.', 'error')
    } finally {
      setEliminandoId(null)
    }
  }

  return (
    <div>
      <Link
        to="/produccion"
        className="inline-flex items-center gap-1 text-sm text-brand-700 transition-colors hover:text-brand-800 hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver a producción
      </Link>

      <div className="mb-4 mt-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-ink">Listas de materiales</h1>
          <p className="text-sm text-ink-faint">
            Qué material y cuánto lleva cada modelo — se usa para calcular lo que necesita cada OF.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-brand-700 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-800"
        >
          <Plus className="h-4 w-4" />
          Nueva lista
        </button>
      </div>

      <div className="overflow-x-auto border border-line-strong bg-surface">
        <table className="hidden w-full text-left text-sm lg:table">
          <thead className="bg-surface-2 text-[0.625rem] font-mono uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3">Materiales</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="stagger divide-y divide-line">
            {loading && <TableSkeleton rows={3} cols={3} />}
            {!loading && listas.length === 0 && (
              <tr>
                <td colSpan={3}>
                  <EmptyState
                    icon={ClipboardList}
                    title="Sin listas de materiales todavía"
                    subtitle='Crea la primera con "Nueva lista"'
                  />
                </td>
              </tr>
            )}
            {listas.map((lista) => (
              <tr key={lista.id} className="transition-colors hover:bg-surface-2">
                <td className="px-4 py-3 font-medium text-ink">{lista.modelo}</td>
                <td className="px-4 py-3 text-ink-dim">
                  <ul className="flex flex-col gap-0.5">
                    {(lista.materiales ?? []).map((linea, i) => (
                      <li key={i} className="whitespace-nowrap">
                        <span className="font-medium text-ink">{linea.cantidad}×</span>{' '}
                        <MaterialNombre materialId={linea.materialId} />
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <IconButton icon={Pencil} onClick={() => setListaParaEditar(lista)} title="Editar" />
                    <IconButton
                      icon={Trash2}
                      variant="danger"
                      disabled={eliminandoId === lista.id}
                      onClick={() => eliminar(lista)}
                      title="Eliminar"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="divide-y divide-line lg:hidden">
          {loading && (
            <div className="flex flex-col gap-2.5 p-4">
              <div className="skeleton h-4 w-2/3 rounded-md" />
              <div className="skeleton h-4 w-1/3 rounded-md" />
            </div>
          )}
          {!loading && listas.length === 0 && (
            <EmptyState
              icon={ClipboardList}
              title="Sin listas de materiales todavía"
              subtitle='Crea la primera con "Nueva lista"'
            />
          )}
          {listas.map((lista) => (
            <div key={lista.id} className="flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-ink">{lista.modelo}</p>
                <div className="flex shrink-0 items-center gap-1">
                  <IconButton icon={Pencil} onClick={() => setListaParaEditar(lista)} title="Editar" />
                  <IconButton
                    icon={Trash2}
                    variant="danger"
                    disabled={eliminandoId === lista.id}
                    onClick={() => eliminar(lista)}
                    title="Eliminar"
                  />
                </div>
              </div>
              <ul className="flex flex-col gap-0.5 text-xs text-ink-faint">
                {(lista.materiales ?? []).map((linea, i) => (
                  <li key={i}>
                    <span className="font-medium text-ink-dim">{linea.cantidad}×</span>{' '}
                    <MaterialNombre materialId={linea.materialId} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <ListaMaterialesModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <ListaMaterialesModal
        open={Boolean(listaParaEditar)}
        onClose={() => setListaParaEditar(null)}
        lista={listaParaEditar}
      />
    </div>
  )
}
