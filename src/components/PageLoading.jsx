import Spinner from './Spinner'

// Fallback de <Suspense> para las rutas cargadas con lazy() en App.jsx —
// se ve una fracción de segundo mientras baja el chunk de ese módulo.
export default function PageLoading() {
  return (
    <div className="flex items-center justify-center py-24 text-ink-faint">
      <Spinner className="h-6 w-6" />
    </div>
  )
}
