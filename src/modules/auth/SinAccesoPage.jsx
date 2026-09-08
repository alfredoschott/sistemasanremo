import { ShieldOff } from 'lucide-react'
import Button from '../../components/Button'
import { useAuth } from '../../lib/AuthContext'

export default function SinAccesoPage({ mensaje, mostrarCerrarSesion = true }) {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-dvh items-center justify-center overflow-y-auto bg-brand-950 py-8">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-8 text-center shadow-2xl">
        <ShieldOff className="mx-auto mb-3 h-10 w-10 text-line-strong" strokeWidth={1.5} />
        <h1 className="mb-1 text-lg font-semibold text-ink">Sin acceso</h1>
        <p className="mb-6 text-sm text-ink-faint">
          {mensaje ?? (
            <>
              {user?.email} inició sesión correctamente, pero no está en la lista de personas
              autorizadas para usar este sistema. Pide que te agreguen.
            </>
          )}
        </p>
        {mostrarCerrarSesion && (
          <Button variant="secondary" onClick={logout}>
            Cerrar sesión
          </Button>
        )}
      </div>
    </div>
  )
}
