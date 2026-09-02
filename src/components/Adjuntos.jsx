import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { FileText, Paperclip, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { db, storage } from '../lib/firebase'
import { useToast } from '../lib/ToastContext'

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Adjuntos genérico: sirve para cotizaciones (documentos que usa Ventas),
// órdenes de compra (facturas de proveedor), o cualquier otra colección que
// necesite archivos más adelante — solo cambia `coleccion` y `docId`.
export default function Adjuntos({ coleccion, docId, adjuntos = [] }) {
  const [uploading, setUploading] = useState(false)
  const [deletingPath, setDeletingPath] = useState(null)
  const inputRef = useRef(null)
  const toast = useToast()

  const subirArchivo = async (file) => {
    setUploading(true)
    try {
      const path = `${coleccion}/${docId}/${Date.now()}_${file.name}`
      const fileRef = ref(storage, path)
      await uploadBytes(fileRef, file)
      const url = await getDownloadURL(fileRef)
      await updateDoc(doc(db, coleccion, docId), {
        adjuntos: arrayUnion({
          nombre: file.name,
          path,
          url,
          tamano: file.size,
          fecha: Date.now(),
        }),
      })
      toast(`${file.name} adjuntado`)
    } catch {
      toast('No se pudo subir el archivo. Intenta de nuevo.', 'error')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const eliminarArchivo = async (adjunto) => {
    if (!window.confirm(`¿Eliminar "${adjunto.nombre}"?`)) return
    setDeletingPath(adjunto.path)
    try {
      await deleteObject(ref(storage, adjunto.path)).catch(() => {})
      await updateDoc(doc(db, coleccion, docId), {
        adjuntos: arrayRemove(adjunto),
      })
    } catch {
      toast('No se pudo eliminar el archivo. Intenta de nuevo.', 'error')
    } finally {
      setDeletingPath(null)
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <Paperclip className="h-4 w-4" />
          Documentos ({adjuntos.length})
        </h2>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 transition-colors hover:text-brand-800 disabled:opacity-60"
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? 'Subiendo…' : 'Adjuntar archivo'}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => e.target.files[0] && subirArchivo(e.target.files[0])}
        />
      </div>

      {adjuntos.length === 0 ? (
        <p className="text-sm text-slate-400">Sin documentos adjuntos.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {adjuntos.map((a) => (
            <li
              key={a.path}
              className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm transition-colors hover:bg-slate-50"
            >
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-2 text-slate-700 hover:text-brand-700"
              >
                <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate">{a.nombre}</span>
                <span className="shrink-0 text-xs text-slate-400">{formatSize(a.tamano)}</span>
              </a>
              <button
                onClick={() => eliminarArchivo(a)}
                disabled={deletingPath === a.path}
                className="shrink-0 text-slate-300 transition-colors hover:text-red-600 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
