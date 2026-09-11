import { Check, Eye, Lock, Plus, Shield, Trash2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import IconButton from '../../components/IconButton'
import { ROL_LABEL, ROLES_DISPONIBLES } from '../../lib/areas'
import { useAuth } from '../../lib/AuthContext'
import { mensajeError } from '../../lib/firestoreErrors'
import { inputClassInline } from '../../lib/ui'
import { useToast } from '../../lib/ToastContext'
import {
  actualizarEtiqueta,
  actualizarRoles,
  actualizarRolesSoloLectura,
  agregarUsuario,
  CUENTA_PROTEGIDA,
  eliminarUsuario,
} from './usuarioActions'
import { useUsuarios } from './useUsuarios'

const AREAS_ROLES = ROLES_DISPONIBLES.filter((r) => r !== 'admin')

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
      toast(
        err.message === 'ya-existe' ? 'Ese correo ya está autorizado.' : mensajeError(err, 'No se pudo agregar.'),
        'error',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="mb-4 flex items-end gap-2 rounded-md border border-line-strong bg-surface-2 p-4">
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

function EtiquetaInput({ usuario }) {
  const [valor, setValor] = useState(usuario.etiqueta)
  const [editando, setEditando] = useState(false)
  const toast = useToast()

  const guardar = () => {
    setEditando(false)
    if (valor.trim() === usuario.etiqueta) return
    actualizarEtiqueta(usuario.email, valor).catch((err) =>
      toast(mensajeError(err, 'No se pudo guardar la etiqueta.'), 'error'),
    )
  }

  if (editando) {
    return (
      <input
        autoFocus
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onBlur={guardar}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            setValor(usuario.etiqueta)
            setEditando(false)
          }
        }}
        placeholder="Ej. Jefe de producción"
        className={`w-full text-xs ${inputClassInline}`}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditando(true)}
      className="block max-w-full truncate text-left text-xs text-ink-faint hover:text-brand-700 hover:underline"
      title="Clic para editar"
    >
      {usuario.etiqueta || '+ agregar etiqueta'}
    </button>
  )
}

// Cada área tiene 3 estados posibles, se ciclan con un solo clic:
// sin acceso → acceso completo → solo lectura → sin acceso...
function estadoDe(usuario, rol) {
  if (!usuario.roles.includes(rol)) return 'ninguno'
  return usuario.rolesSoloLectura.includes(rol) ? 'lectura' : 'completo'
}

const CELDA_ESTILO = {
  ninguno: 'border-line-strong text-ink-faint hover:border-brand-400 hover:text-brand-600',
  completo: 'border-brand-700 bg-brand-700 text-white',
  lectura: 'border-amber-400 bg-amber-50 text-amber-700',
}

export default function UsuariosPage() {
  const { usuarios, loading } = useUsuarios()
  const { user } = useAuth()
  const [creando, setCreando] = useState(false)
  const toast = useToast()

  const admins = usuarios.filter((u) => u.roles.includes('admin'))

  const toggleAdmin = (usuario) => {
    const tiene = usuario.roles.includes('admin')
    if (usuario.email === CUENTA_PROTEGIDA) {
      toast('Esta cuenta siempre debe conservar Admin — está protegida.', 'error')
      return
    }
    if (tiene && usuario.email === user?.email && admins.length <= 1) {
      toast('No puedes quitarte el rol de Admin: eres el único. Dáselo a alguien más primero.', 'error')
      return
    }
    const roles = tiene ? usuario.roles.filter((r) => r !== 'admin') : [...usuario.roles, 'admin']
    actualizarRoles(usuario.email, roles).catch((err) =>
      toast(mensajeError(err, 'No se pudo actualizar.'), 'error'),
    )
  }

  const ciclarArea = (usuario, rol) => {
    const estado = estadoDe(usuario, rol)
    if (estado === 'ninguno') {
      actualizarRoles(usuario.email, [...usuario.roles, rol]).catch((err) =>
        toast(mensajeError(err, 'No se pudo actualizar.'), 'error'),
      )
    } else if (estado === 'completo') {
      actualizarRolesSoloLectura(usuario.email, [...usuario.rolesSoloLectura, rol]).catch((err) =>
        toast(mensajeError(err, 'No se pudo actualizar.'), 'error'),
      )
    } else {
      Promise.all([
        actualizarRoles(usuario.email, usuario.roles.filter((r) => r !== rol)),
        actualizarRolesSoloLectura(usuario.email, usuario.rolesSoloLectura.filter((r) => r !== rol)),
      ]).catch((err) => toast(mensajeError(err, 'No se pudo actualizar.'), 'error'))
    }
  }

  const eliminar = (usuario) => {
    if (usuario.email === CUENTA_PROTEGIDA) {
      toast('Esta cuenta está protegida — no se le puede quitar el acceso.', 'error')
      return
    }
    if (usuario.roles.includes('admin') && admins.length <= 1) {
      toast('No puedes quitar acceso al único Admin.', 'error')
      return
    }
    if (!window.confirm(`¿Quitar el acceso de ${usuario.email}? Ya no podrá entrar al sistema.`)) return
    eliminarUsuario(usuario.email)
      .then(() => toast(`${usuario.email} ya no tiene acceso`))
      .catch((err) => toast(mensajeError(err, 'No se pudo quitar el acceso.'), 'error'))
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

      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-md border border-line bg-surface-2 px-4 py-2.5 text-xs text-ink-dim">
        <span className="font-medium text-ink-faint">Clic en una área para cambiar:</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded border border-line-strong" />
          Sin acceso
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded border border-brand-700 bg-brand-700">
            <Check className="h-3 w-3 text-white" />
          </span>
          Acceso completo
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded border border-amber-400 bg-amber-50">
            <Eye className="h-3 w-3 text-amber-700" />
          </span>
          Solo lectura — ve, no puede tocar nada
        </span>
      </div>

      <div className="overflow-x-auto rounded-md border border-line-strong bg-surface">
        {creando && <NuevoUsuarioForm onClose={() => setCreando(false)} />}
        {!loading && usuarios.length === 0 ? (
          <EmptyState icon={UserPlus} title="Sin usuarios todavía" subtitle="Agrega el primero arriba" />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-[0.625rem] font-mono uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-2">Correo / etiqueta</th>
                {AREAS_ROLES.map((rol) => (
                  <th key={rol} className="px-3 py-2 text-center">
                    {ROL_LABEL[rol]}
                  </th>
                ))}
                <th className="px-3 py-2 text-center">Admin</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {usuarios.map((usuario) => {
                const protegido = usuario.email === CUENTA_PROTEGIDA
                return (
                  <tr key={usuario.email} className="transition-colors hover:bg-surface-2">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 font-medium text-ink">
                        {usuario.email}
                        {usuario.email === user?.email && (
                          <span className="text-xs font-normal text-ink-faint">(tú)</span>
                        )}
                        {protegido && (
                          <Lock className="h-3 w-3 shrink-0 text-ink-faint" title="Cuenta protegida" />
                        )}
                      </div>
                      <EtiquetaInput usuario={usuario} />
                    </td>
                    {AREAS_ROLES.map((rol) => {
                      const estado = estadoDe(usuario, rol)
                      const Icon = estado === 'completo' ? Check : estado === 'lectura' ? Eye : null
                      return (
                        <td key={rol} className="px-3 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => ciclarArea(usuario, rol)}
                            title={
                              estado === 'ninguno'
                                ? `Sin acceso a ${ROL_LABEL[rol]} — clic para dar acceso completo`
                                : estado === 'completo'
                                  ? `Acceso completo a ${ROL_LABEL[rol]} — clic para pasar a solo lectura`
                                  : `Solo lectura en ${ROL_LABEL[rol]} — clic para quitar el acceso`
                            }
                            className={`mx-auto flex h-5 w-5 items-center justify-center rounded border transition-colors ${CELDA_ESTILO[estado]}`}
                          >
                            {Icon && <Icon className="h-3 w-3" />}
                          </button>
                        </td>
                      )
                    })}
                    <td className="px-3 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => toggleAdmin(usuario)}
                        disabled={protegido}
                        title={
                          protegido
                            ? 'Esta cuenta siempre conserva Admin'
                            : usuario.roles.includes('admin')
                              ? 'Es Admin — clic para quitarle el rol'
                              : 'Clic para hacerlo Admin'
                        }
                        className={`mx-auto flex h-5 w-5 items-center justify-center rounded border transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
                          usuario.roles.includes('admin')
                            ? 'border-brand-700 bg-brand-700 text-white'
                            : 'border-line-strong text-ink-faint hover:border-brand-400 hover:text-brand-600'
                        }`}
                      >
                        {protegido ? (
                          <Lock className="h-3 w-3" />
                        ) : usuario.roles.includes('admin') ? (
                          <Shield className="h-3 w-3" />
                        ) : null}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <IconButton
                        icon={Trash2}
                        variant="danger"
                        disabled={protegido}
                        onClick={() => eliminar(usuario)}
                        title={protegido ? 'Cuenta protegida' : 'Quitar acceso'}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
