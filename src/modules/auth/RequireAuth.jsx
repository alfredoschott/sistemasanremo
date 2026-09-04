import BrandMark from '../../components/BrandMark'
import { useAuth } from '../../lib/AuthContext'
import { useAutorizado } from '../../lib/useAutorizado'
import LoginPage from './LoginPage'
import SinAccesoPage from './SinAccesoPage'

function Loader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-brand-950">
      <div className="animate-pulse rounded-md bg-surface/95 px-4 py-2 shadow-sm">
        <BrandMark compact className="h-9 w-auto" />
      </div>
    </div>
  )
}

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const autorizado = useAutorizado(user?.email)

  if (loading) return <Loader />
  if (!user) return <LoginPage />
  if (autorizado === null) return <Loader />
  if (!autorizado) return <SinAccesoPage />

  return children
}
