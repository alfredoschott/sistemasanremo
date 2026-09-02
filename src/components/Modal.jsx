export default function Modal({ open, onClose, title, subtitle, children, maxWidth = 'max-w-md' }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4 animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={`w-full ${maxWidth} rounded-xl bg-white p-6 shadow-2xl animate-scale-in`}>
        {title && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
