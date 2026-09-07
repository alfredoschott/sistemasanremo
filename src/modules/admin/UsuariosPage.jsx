import { Plus, Trash2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import IconButton from '../../components/IconButton'
import { ROL_LABEL, ROLES_DISPONIBLES } from '../../lib/areas'
import { useAuth } from '../../lib/AuthContext'
import { inputClassInline } from '../../lib/ui'
import { useToast } from '../../lib/ToastContext'
import { agregarUsuario, actualizarRoles, eliminarUsuario } from './usuarioActions'
import { useUsuarios } from './useUsuarios'

function NuevoUsuarioForm({ onClose }) {
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const submit = async (e) => {
    e.preventDefault()
    const limpio = email.trim().toLowerCase()
    if (!limpio) return
    setSaving(true)
    try {
      await agregarUsuario(limpio)
      toast(`${limpio} agregado — asígnale sus áreas`)
      onClose()
    } catch (err) {
      toast(err.message === 'ya-existe' ? 'Ese correo ya está autorizado.' : 'No se pudo agregar.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="mb-4 flex items-end gap-2 border-b border-line bg-surface-2 p-4">
      <label className="flex-1 text-xs font-medium text-ink-faint">
        Correo (debe iniciar sesión con Google usando este correo)
        <input
          autoFocus
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="persona@empresa.com"
          className={`mt-1 w-full ${inputClassInline}`}
        />
      </label>
      <Button type="submit" size="sm" loading={saving} disabled={!email.trim()}>
        Agregar
      </Button>
      <Button type="button" size="sm" variant="secondary" onClick={onClose}>
        Cancelar
      </Button>
    </form>
  )
}

export default function UsuariosPage() {
  const { usuarios, loading } = useUsuarios()
  const { user } = useAuth()
  const [creando, setCreando] = useState(false)
  const toast = useToast()

  const admins = usuarios.filter((u) => u.roles.includes('admin'))

  const toggleRol = (usuario, rol) => {
    const tiene = usuario.roles.includes(rol)
    if (tiene && rol === 'admin' && usuario.email === user?.email && admins.length <= 1) {
      toast('No puedes quitarte el rol de Admin: eres el único. Dáselo a alguien más primero.', 'error')
      return
    }
    const roles = tiene ? usuario.roles.filter((r) => r !== rol) : [...usuario.roles, rol]
    actualizarRoles(usuario.email, roles).catch(() => toast('No se pudo actualizar.', 'error'))
  }

  const eliminar = (usuario) => {
    if (usuario.roles.includes('admin') && admins.length <= 1) {
      toast('No puedes quitar acceso al único Admin.', 'error')
      return
    }
    if (!window.confirm(`¿Quitar el acceso de ${usuario.email}? Ya no podrá entrar al sistema.`)) return
    eliminarUsuario(usuario.email)
      .then(() => toast(`${usuario.email} ya no tiene acceso`))
      .catch(() => toast('No se pudo quitar el acceso.', 'error'))
  }

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-ink">Usuarios y roles</h1>
        {!creando && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setCreando(true)}
            className="inline-flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Nuevo usuario
          </Button>
        )}
      </div>
      <p className="mb-3 text-sm text-ink-faint">
        Cada persona solo ve y puede usar las áreas marcadas aquí. Admin ve todo, sin excepción.
      </p>

      <div className="overflow-x-auto border border-line-strong bg-surface">
        {creando && <NuevoUsuarioForm onClose={() => setCreando(false)} />}
        {!loading && usuarios.length === 0 ? (
          <EmptyState icon={UserPlus} title="Sin usuarios todavía" subtitle="Agrega el primero arriba" />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-[0.625rem] font-mono uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-2">Correo</th>
                {ROLES_DISPONIBLES.map((rol) => (
                  <th key={rol} className="px-3 py-2 text-center">
                    {ROL_LABEL[rol]}
                  </th>
                ))}
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {usuarios.map((usuario) => (
                <tr key={usuario.email} className="transition-colors hover:bg-surface-2">
                  <td className="px-4 py-2.5 font-medium text-ink">
                    {usuario.email}
                    {usuario.email === user?.email && (
                      <span className="ml-1.5 text-xs font-normal text-ink-faint">(tú)</span>
                    )}
                  </td>
                  {ROLES_DISPONIBLES.map((rol) => (
                    <td key={rol} className="px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={usuario.roles.includes(rol)}
                        onChange={() => toggleRol(usuario, rol)}
                        className="h-4 w-4 accent-brand-700"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-right">
                    <IconButton
                      icon={Trash2}
                      variant="danger"
                      onClick={() => eliminar(usuario)}
                      title="Quitar acceso"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
