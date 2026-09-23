import { doc } from 'firebase/firestore'
import { db } from './firebase'

// Folios consecutivos por año (OF-2026-001, OF-2026-002…) en vez de los
// últimos dígitos del reloj, que no llevaban orden ni se podían dictar
// fácil. El contador vive en /contadores/of-<año> y SIEMPRE se lee y
// escribe dentro de la misma transacción que crea la OF: así dos personas
// abriendo OF al mismo tiempo nunca obtienen el mismo número, y si la
// creación falla, el contador tampoco avanza (no quedan huecos).
export function refContadorOF(year) {
  return doc(db, 'contadores', `of-${year}`)
}

export function formatoFolioOF(year, numero) {
  return `OF-${year}-${String(numero).padStart(3, '0')}`
}

// Recibe la transacción ya abierta; devuelve el folio y deja escrito el
// nuevo valor del contador en esa misma transacción.
export async function reservarFolioOF(tx, year = new Date().getFullYear()) {
  const ref = refContadorOF(year)
  const snap = await tx.get(ref)
  const siguiente = (snap.data()?.ultimo ?? 0) + 1
  tx.set(ref, { ultimo: siguiente })
  return formatoFolioOF(year, siguiente)
}
