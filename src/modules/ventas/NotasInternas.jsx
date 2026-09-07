import { addDoc, collection, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { MessageSquare, Trash2 } from 'lucide-react'
import { useState } from 'react'
import IconButton from '../../components/IconButton'
import { auth, db } from '../../lib/firebase'
import { useToast } from '../../lib/ToastContext'
import { useNotas } from '../../lib/useNotas'

function formatFecha(fecha) {
  const ms = fecha?.toMillis?.()
  if (!ms) return ''
  return new Date(ms).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function NotasInternas({ cotizacionId }) {
  const notas = useNotas(cotizacionId)
  const [texto, setTexto] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const eliminarNota = async (nota) => {
    if (!window.confirm('¿Eliminar esta nota?')) return
    try {
      await deleteDoc(doc(db, 'notas', nota.id))
    } catch {
      toast('No se pudo eliminar la nota. Intenta de nuevo.', 'error')
    }
  }

  const agregarNota = async (e) => {
    e.preventDefault()
    if (!texto.trim()) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'notas'), {
        entidad: 'cotizacion',
        entidadId: cotizacionId,
        texto: texto.trim(),
        usuario: auth.currentUser?.email ?? 'desconocido',
        fecha: serverTimestamp(),
      })
      setTexto('')
    } catch {
      toast('No se pudo agregar la nota. Intenta de nuevo.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="no-print mt-6 border-t border-line pt-6">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink">
        <MessageSquare className="h-4 w-4" />
        Notas internas
      </h2>

      {notas.length > 0 && (
        <ul className="mb-3 flex flex-col gap-2">
          {notas.map((n) => (
            <li
              key={n.id}
              className="group flex items-start justify-between gap-2 rounded-md bg-surface-2 px-3 py-2 text-sm"
            >
              <div>
                <p className="text-ink">{n.texto}</p>
                <p className="mt-1 text-xs text-ink-faint">
                  {n.usuario} · {formatFecha(n.fecha)}
                </p>
              </div>
              <IconButton
                icon={Trash2}
                variant="danger"
                onClick={() => eliminarNota(n)}
                title="Eliminar nota"
                className="opacity-0 transition-opacity group-hover:opacity-100"
              />
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={agregarNota} className="flex gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Agregar una nota…"
          className="flex-1 rounded-md border border-line-strong px-3 py-2 text-sm outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="submit"
          disabled={saving || !texto.trim()}
          className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-800 disabled:opacity-60"
        >
          Agregar
        </button>
      </form>
    </div>
  )
}
