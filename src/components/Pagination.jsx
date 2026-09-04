import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between border-t border-line px-4 py-3">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-ink-dim transition-colors hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </button>
      <span className="font-mono text-xs text-ink-faint">
        Página {page} de {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-ink-dim transition-colors hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40"
      >
        Siguiente
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
