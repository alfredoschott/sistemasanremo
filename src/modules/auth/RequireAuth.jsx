import BrandMark from '../../components/BrandMark'
import { useAuth } from '../../lib/AuthContext'
import LoginPage from './LoginPage'

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-brand-950">
        <BrandMark compact className="h-8 w-24 animate-pulse text-white/70" />
      </div>
    )
  }

  if (!user) return <LoginPage />

  return children
}
