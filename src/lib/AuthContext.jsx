import { onAuthStateChanged, signOut } from 'firebase/auth'
import { createContext, useContext, useEffect, useState } from 'react'
import { auth } from './firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
