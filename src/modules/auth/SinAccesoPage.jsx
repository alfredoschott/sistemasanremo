import { ShieldOff } from 'lucide-react'
import Button from '../../components/Button'
import { useAuth } from '../../lib/AuthContext'

export default function SinAccesoPage() {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-screen items-center justify-center bg-brand-950">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl">
        <ShieldOff className="mx-auto mb-3 h-10 w-10 text-slate-300" strokeWidth={1.5} />
        <h1 className="mb-1 text-lg font-semibold text-slate-800">Sin acceso</h1>
        <p className="mb-6 text-sm text-slate-500">
          {user?.email} inició sesión correctamente, pero no está en la lista de personas
          autorizadas para usar este sistema. Pide que te agreguen.
        </p>
        <Button variant="secondary" onClick={logout}>
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
