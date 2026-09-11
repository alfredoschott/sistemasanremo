import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { FileText, Paperclip, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { db, storage } from '../lib/firebase'
import { mensajeError } from '../lib/firestoreErrors'
import { useToast } from '../lib/ToastContext'
import Button from './Button'
import IconButton from './IconButton'

const MAX_SIZE = 20 * 1024 * 1024

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
    if (file.size > MAX_SIZE) {
      toast('El archivo pesa más de 20 MB. Sube uno más ligero.', 'error')
      if (inputRef.current) inputRef.current.value = ''
      return
    }
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
    } catch (err) {
      toast(mensajeError(err, 'No se pudo subir el archivo. Intenta de nuevo.'), 'error')
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
    } catch (err) {
      toast(mensajeError(err, 'No se pudo eliminar el archivo. Intenta de nuevo.'), 'error')
    } finally {
      setDeletingPath(null)
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Paperclip className="h-4 w-4" />
          Documentos ({adjuntos.length})
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          loading={uploading}
        >
          {!uploading && <Upload className="h-3.5 w-3.5" />}
          {uploading ? 'Subiendo…' : 'Adjuntar archivo'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => e.target.files[0] && subirArchivo(e.target.files[0])}
        />
      </div>

      {adjuntos.length === 0 ? (
        <p className="text-sm text-ink-faint">Sin documentos adjuntos.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {adjuntos.map((a) => (
            <li
              key={a.path}
              className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-sm transition-colors hover:bg-surface-2"
            >
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-2 text-ink hover:text-brand-700"
              >
                <FileText className="h-4 w-4 shrink-0 text-ink-faint" />
                <span className="truncate">{a.nombre}</span>
                <span className="shrink-0 text-xs text-ink-faint">{formatSize(a.tamano)}</span>
              </a>
              <IconButton
                icon={Trash2}
                variant="danger"
                onClick={() => eliminarArchivo(a)}
                disabled={deletingPath === a.path}
                className="shrink-0"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
