import { useState } from 'react'
import BrandMark from '../../components/BrandMark'
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
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-brand-950">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, #fff 0, #fff 1px, transparent 1px, transparent 22px)',
        }}
      />
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-600 opacity-20 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-brand-500 opacity-20 blur-3xl" />

      <div className="animate-scale-in relative w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl">
        <BrandMark className="mx-auto mb-2 h-28 w-40 text-brand-800" />
        <p className="mb-6 text-sm text-slate-500">Sanremo de México</p>

        <div className="flex flex-col gap-2">
          {authProviders.map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleSignIn(provider)}
              disabled={pending === provider.id}
              className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all duration-150 hover:border-brand-700 hover:bg-brand-50 active:scale-[0.98] disabled:opacity-60"
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
