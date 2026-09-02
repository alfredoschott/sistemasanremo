import BrandMark from '../../components/BrandMark'
import { useAuth } from '../../lib/AuthContext'
import LoginPage from './LoginPage'

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-brand-950">
        <div className="animate-pulse rounded-md bg-white/95 px-4 py-2 shadow-sm">
          <BrandMark compact className="h-9 w-auto" />
        </div>
      </div>
    )
  }

  if (!user) return <LoginPage />

  return children
}
