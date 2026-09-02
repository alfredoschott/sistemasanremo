import { useState } from 'react'
import { authProviders } from '../../lib/authProviders'

export default function LoginPage() {
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(null)

  const handleSignIn = async (provider) => {
    setError(null)
    setPending(provider.id)
    try {
      await provider.signIn()
    } catch (err) {
      setError('No se pudo iniciar sesión. Intenta de nuevo.')
      console.error(err)
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-brand-800">SRM Telsa Transformadores</h1>
        <p className="mt-1 text-sm text-slate-500">Sanremo de México</p>

        <div className="mt-6 flex flex-col gap-2">
          {authProviders.map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleSignIn(provider)}
              disabled={pending === provider.id}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {pending === provider.id ? 'Conectando…' : provider.label}
            </button>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
