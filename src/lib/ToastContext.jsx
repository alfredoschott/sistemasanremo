import { CheckCircle2, Undo2, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message, type = 'success', { onUndo } = {}) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, message, type, onUndo }])
      setTimeout(() => dismiss(id), onUndo ? 10000 : 3200)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-slide-up pointer-events-auto relative overflow-hidden flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
              t.type === 'error' ? 'bg-red-600 text-white' : 'bg-brand-800 text-white'
            }`}
          >
            <span
              className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-white/40"
              style={{ animation: `shrink-w ${t.onUndo ? 10 : 3.2}s linear forwards` }}
            />
            {t.type === 'error' ? (
              <XCircle className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            <span>{t.message}</span>
            {t.onUndo && (
              <button
                onClick={() => {
                  t.onUndo()
                  dismiss(t.id)
                }}
                className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-md bg-surface/15 px-2 py-1 text-xs font-semibold transition-colors hover:bg-surface/25"
              >
                <Undo2 className="h-3 w-3" />
                Deshacer
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
