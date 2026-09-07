import { ROL_LABEL } from '../../lib/areas'
import { useRoles } from '../../lib/RolesContext'
import SinAccesoPage from './SinAccesoPage'

// Envuelve una <Route> para exigir un rol específico. A diferencia de
// RequireAuth (que solo confirma que la persona puede entrar al sistema),
// esto decide si puede entrar a ESTA área — la misma regla que ya se
// aplica en Firestore, solo que aquí evita mostrar una página rota si el
// usuario llega directo por URL a un módulo que no le corresponde.
export default function RequireArea({ rol, children }) {
  const { tieneAcceso } = useRoles()

  if (!tieneAcceso(rol)) {
    return (
      <SinAccesoPage
        mensaje={`No tienes acceso al área de ${ROL_LABEL[rol]}. Pide que un administrador te lo asigne.`}
        mostrarCerrarSesion={false}
      />
    )
  }

  return children
}
