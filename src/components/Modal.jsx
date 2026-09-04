import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ open, onClose, title, subtitle, children, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px] animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`relative max-h-[90vh] w-full ${maxWidth} overflow-y-auto rounded-md border border-line-strong bg-surface p-6 shadow-2xl animate-scale-in`}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
        {title && (
          <div className="mb-4 pr-8">
            <h2 className="text-lg">{title}</h2>
            {subtitle && <p className="text-sm text-ink-faint">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
