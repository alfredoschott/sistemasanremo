import { useEffect, useState } from 'react'
import BrandMark from '../../components/BrandMark'
import FirmaSchott from '../../components/FirmaSchott'
import Button from '../../components/Button'
import { authProviders } from '../../lib/authProviders'
import {
  completarInicioConEnlace,
  correoGuardado,
  enviarEnlaceDeAcceso,
  esEnlaceDeAcceso,
} from '../../lib/emailLink'
import { inputClass } from '../../lib/ui'

// Mensajes según el código de Firebase Auth; cualquier otro cae al genérico.
function mensajeDeError(err) {
  switch (err?.code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return null
    case 'auth/popup-blocked':
      return 'El navegador bloqueó la ventana de inicio de sesión. Permite las ventanas emergentes e intenta de nuevo.'
    case 'auth/account-exists-with-different-credential':
      return 'Ese correo ya se registró con otro método (Google o Microsoft). Entra con el mismo método que usaste la primera vez.'
    case 'auth/invalid-email':
      return 'Ese correo no es válido. Revísalo e intenta de nuevo.'
    case 'auth/invalid-action-code':
    case 'auth/expired-action-code':
      return 'El enlace ya expiró o ya se usó. Pide uno nuevo.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera unos minutos e intenta de nuevo.'
    case 'auth/operation-not-allowed':
      return 'Este método de inicio de sesión aún no está habilitado. Avisa a quien administra el sistema.'
    default:
      return 'No se pudo iniciar sesión. Intenta de nuevo.'
  }
}

export default function LoginPage() {
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(null)
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  // Llegó desde el enlace del correo pero este navegador no recuerda cuál
  // correo lo pidió: hay que preguntarlo para validar el enlace.
  const [confirmarCorreo] = useState(() => esEnlaceDeAcceso() && !correoGuardado())

  const entrarConEnlace = async (correo) => {
    setError(null)
    setPending('email')
    try {
      await completarInicioConEnlace(correo)
    } catch (err) {
      setError(mensajeDeError(err))
      console.error(err)
    } finally {
      setPending(null)
    }
  }

  useEffect(() => {
    const guardado = esEnlaceDeAcceso() && correoGuardado()
    if (guardado) entrarConEnlace(guardado)
  }, [])

  const handleEmail = async (e) => {
    e.preventDefault()
    const correo = email.trim().toLowerCase()
    if (!correo) return
    if (confirmarCorreo) return entrarConEnlace(correo)
    setError(null)
    setPending('email')
    try {
      await enviarEnlaceDeAcceso(correo)
      setEnviado(true)
    } catch (err) {
      setError(mensajeDeError(err))
      console.error(err)
    } finally {
      setPending(null)
    }
  }

  const handleSignIn = async (provider) => {
    setError(null)
    setPending(provider.id)
    try {
      await provider.signIn()
    } catch (err) {
      setError(mensajeDeError(err))
      console.error(err)
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-x-hidden overflow-y-auto bg-brand-950 py-8">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, #fff 0, #fff 1px, transparent 1px, transparent 22px)',
        }}
      />
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-600 opacity-20 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-brand-500 opacity-20 blur-3xl" />

      <div className="animate-scale-in relative w-full max-w-sm rounded-2xl bg-surface p-8 text-center shadow-2xl">
        <BrandMark className="mx-auto mb-2 w-48" />
        <p className="mb-6 text-sm text-ink-faint">Sanremo de México</p>

        <div className="flex flex-col gap-2">
          {authProviders.map((provider) => (
            <Button
              key={provider.id}
              variant="outline"
              onClick={() => handleSignIn(provider)}
              loading={pending === provider.id}
            >
              {pending === provider.id ? 'Conectando…' : provider.label}
            </Button>
          ))}
        </div>

        <div className="my-4 flex items-center gap-3 text-xs text-ink-faint">
          <span className="h-px flex-1 bg-line" />o con tu correo
          <span className="h-px flex-1 bg-line" />
        </div>

        {enviado ? (
          <p className="rounded-md bg-brand-50 px-3 py-3 text-sm text-brand-800">
            Te enviamos un enlace a <strong>{email.trim().toLowerCase()}</strong>. Ábrelo desde este
            mismo dispositivo para entrar. Si no llega, revisa tu carpeta de spam.
          </p>
        ) : (
          <form onSubmit={handleEmail} className="flex flex-col gap-2 text-left">
            <label className="text-xs text-ink-faint" htmlFor="login-email">
              {confirmarCorreo
                ? 'Confirma tu correo para terminar de entrar'
                : 'Correo institucional'}
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@empresa.com"
              className={`${inputClass} !mt-0`}
            />
            <Button type="submit" loading={pending === 'email'}>
              {confirmarCorreo ? 'Entrar' : 'Enviarme un enlace de acceso'}
            </Button>
          </form>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <FirmaSchott className="mt-6 border-t border-line pt-4" />
      </div>
    </div>
  )
}
