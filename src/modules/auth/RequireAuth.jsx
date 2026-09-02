import { useAuth } from '../../lib/AuthContext'
import LoginPage from './LoginPage'

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-slate-400">Cargando…</div>
  }

  if (!user) return <LoginPage />

  return children
}
