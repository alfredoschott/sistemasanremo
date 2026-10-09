import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from './firebase'

// Agregar un proveedor nuevo es sumar una entrada aquí, más habilitarlo en
// Firebase Auth > Sign-in method (y en el portal del propio proveedor si
// requiere registrar la app, como Microsoft/Azure AD). Microsoft se quitó por
// ahora: falta registrar la app en el tenant de Sanremo; el acceso con
// correo institucional va por enlace al correo (ver emailLink.js).
export const authProviders = [
  {
    id: 'google',
    label: 'Continuar con Google',
    signIn: () => signInWithPopup(auth, new GoogleAuthProvider()),
  },
]
