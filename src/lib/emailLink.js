import { isSignInWithEmailLink, sendSignInLinkToEmail, signInWithEmailLink } from 'firebase/auth'
import { auth } from './firebase'

// Inicio de sesión sin contraseña: se manda un enlace al correo y al abrirlo
// la persona entra. Firebase exige guardar el correo en el mismo navegador
// donde se pidió el enlace; si lo abre en otro dispositivo, se le pide de nuevo.
const CLAVE_CORREO = 'emailParaLogin'

export async function enviarEnlaceDeAcceso(email) {
  await sendSignInLinkToEmail(auth, email, {
    url: `${window.location.origin}/`,
    handleCodeInApp: true,
  })
  try {
    window.localStorage.setItem(CLAVE_CORREO, email)
  } catch {
    // Sin localStorage (modo privado): se le pedirá el correo al abrir el enlace.
  }
}

export const esEnlaceDeAcceso = () => isSignInWithEmailLink(auth, window.location.href)

export function correoGuardado() {
  try {
    return window.localStorage.getItem(CLAVE_CORREO)
  } catch {
    return null
  }
}

export async function completarInicioConEnlace(email) {
  const cred = await signInWithEmailLink(auth, email, window.location.href)
  try {
    window.localStorage.removeItem(CLAVE_CORREO)
  } catch {
    // nada que limpiar
  }
  // Quita el código del enlace de la barra de direcciones.
  window.history.replaceState({}, '', window.location.pathname)
  return cred
}
