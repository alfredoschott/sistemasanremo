import { createContext, useContext, useMemo } from 'react'

const RolesContext = createContext({ roles: [], esAdmin: false, tieneAcceso: () => false })

// RequireAuth ya resolvió la autorización antes de montar esto, así que
// aquí roles siempre es un array (posiblemente vacío, si el usuario existe
// en /usuariosAutorizados pero todavía no tiene ningún área asignada).
export function RolesProvider({ roles, children }) {
  const value = useMemo(() => {
    const esAdmin = roles.includes('admin')
    return { roles, esAdmin, tieneAcceso: (rol) => esAdmin || roles.includes(rol) }
  }, [roles])

  return <RolesContext.Provider value={value}>{children}</RolesContext.Provider>
}

export function useRoles() {
  return useContext(RolesContext)
}
