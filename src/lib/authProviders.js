import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from './firebase'

// Agregar un proveedor nuevo (ej. Microsoft) es sumar una entrada aquí,
// más habilitarlo en Firebase Auth > Sign-in method.
export const authProviders = [
  {
    id: 'google',
    label: 'Continuar con Google',
    signIn: () => signInWithPopup(auth, new GoogleAuthProvider()),
  },
  // {
  //   id: 'microsoft',
  //   label: 'Continuar con Microsoft',
  //   signIn: () => signInWithPopup(auth, new OAuthProvider('microsoft.com')),
  // },
]
