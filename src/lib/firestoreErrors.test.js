import { describe, expect, it } from 'vitest'
import { mensajeError } from './firestoreErrors'

describe('mensajeError', () => {
  it('muestra el mensaje de solo lectura cuando Firestore niega el permiso', () => {
    expect(mensajeError({ code: 'permission-denied' }, 'No se pudo guardar.')).toBe(
      'No tienes permiso para modificar esto — tu acceso aquí es de solo lectura.',
    )
  })

  it('usa el mensaje genérico para cualquier otro error', () => {
    expect(mensajeError({ code: 'unavailable' }, 'No se pudo guardar.')).toBe('No se pudo guardar.')
    expect(mensajeError(undefined, 'No se pudo guardar.')).toBe('No se pudo guardar.')
  })
})
