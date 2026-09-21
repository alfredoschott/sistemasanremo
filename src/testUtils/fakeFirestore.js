// Firestore falso y mínimo para probar transacciones (runTransaction,
// getDoc/getDocs, where) sin necesitar el emulador real (que requiere Java,
// no disponible en este entorno). No reemplaza al emulador — no valida
// reglas de seguridad ni condiciones de carrera reales entre procesos —
// pero sí prueba la lógica de negocio dentro de cada transacción (guardas
// de stock negativo, umbral de mínimo, etc.) tal como está escrita.
import { vi } from 'vitest'

export function createFakeFirestore(seed = {}) {
  const store = new Map()
  for (const [path, docs] of Object.entries(seed)) {
    const col = new Map()
    for (const [id, data] of Object.entries(docs)) col.set(id, { ...data })
    store.set(path, col)
  }

  let autoId = 0
  const nextId = () => `auto_${++autoId}`

  const colOf = (path) => {
    if (!store.has(path)) store.set(path, new Map())
    return store.get(path)
  }

  const makeSnap = (path, id) => {
    const data = colOf(path).get(id)
    return {
      id,
      exists: () => data !== undefined,
      data: () => (data === undefined ? undefined : { ...data }),
    }
  }

  const db = { __fake: true }

  const doc = (_db, path, id) => ({ __ref: true, path, id: id ?? nextId() })
  const collection = (_db, path) => ({ __col: true, path })
  const where = (field, op, value) => ({ field, op, value })
  const query = (col, ...conditions) => ({ __query: true, path: col.path, conditions })
  const serverTimestamp = () => ({ __serverTimestamp: true })
  const deleteField = () => ({ __deleteField: true })

  const matches = (data, conditions) =>
    conditions.every((c) => {
      const value = c.field.split('.').reduce((acc, key) => acc?.[key], data)
      if (c.op === '==') return value === c.value
      if (c.op === '>=') return value >= c.value
      throw new Error(`operador no soportado en fake firestore: ${c.op}`)
    })

  const getDoc = async (ref) => makeSnap(ref.path, ref.id)

  const getDocs = async (q) => {
    const col = colOf(q.path)
    const conditions = q.conditions ?? []
    const docs = [...col.entries()]
      .filter(([, data]) => matches(data, conditions))
      .map(([id]) => makeSnap(q.path, id))
    return {
      empty: docs.length === 0,
      docs,
      forEach: (fn) => docs.forEach(fn),
    }
  }

  const setDoc = async (ref, data) => {
    colOf(ref.path).set(ref.id, { ...data })
  }

  const deleteDoc = async (ref) => {
    colOf(ref.path).delete(ref.id)
  }

  const updateDoc = async (ref, patch) => {
    const col = colOf(ref.path)
    const previo = col.get(ref.id) ?? {}
    col.set(ref.id, applyPatch(previo, patch))
  }

  function applyPatch(previo, patch) {
    const next = { ...previo }
    for (const [key, value] of Object.entries(patch)) {
      if (value && value.__deleteField) delete next[key]
      else next[key] = value
    }
    return next
  }

  // Simula atomicidad de forma simple: los cambios de la transacción se
  // aplican solo si el callback termina sin lanzar error. No simula
  // reintentos por conflicto de escritura concurrente (eso sí lo cubre el
  // emulador real).
  const runTransaction = async (_db, callback) => {
    const writes = []
    const tx = {
      get: async (ref) => makeSnap(ref.path, ref.id),
      set: (ref, data) => writes.push(() => colOf(ref.path).set(ref.id, { ...data })),
      update: (ref, patch) =>
        writes.push(() => {
          const col = colOf(ref.path)
          col.set(ref.id, applyPatch(col.get(ref.id) ?? {}, patch))
        }),
      delete: (ref) => writes.push(() => colOf(ref.path).delete(ref.id)),
    }
    const result = await callback(tx)
    writes.forEach((apply) => apply())
    return result
  }

  const writeBatch = () => {
    const writes = []
    return {
      set: (ref, data) => writes.push(() => colOf(ref.path).set(ref.id, { ...data })),
      update: (ref, patch) =>
        writes.push(() => {
          const col = colOf(ref.path)
          col.set(ref.id, applyPatch(col.get(ref.id) ?? {}, patch))
        }),
      delete: (ref) => writes.push(() => colOf(ref.path).delete(ref.id)),
      commit: async () => writes.forEach((apply) => apply()),
    }
  }

  return {
    db,
    getAll: (path) => Object.fromEntries(colOf(path).entries()),
    module: {
      collection,
      doc,
      where,
      query,
      serverTimestamp,
      deleteField,
      getDoc,
      getDocs,
      setDoc,
      deleteDoc,
      updateDoc,
      runTransaction,
      writeBatch,
      addDoc: vi.fn(async (col, data) => {
        const id = nextId()
        colOf(col.path).set(id, { ...data })
        return { id }
      }),
    },
  }
}
