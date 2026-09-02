// Agrega uno o más correos a la lista de usuarios autorizados a entrar
// al sistema (colección /usuariosAutorizados, usada por firestore.rules
// y storage.rules para restringir el acceso más allá de "inició sesión").
// Uso: node scripts/agregarUsuario.mjs correo1@gmail.com correo2@gmail.com
import { readFileSync } from 'node:fs'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const serviceAccount = JSON.parse(
  readFileSync(new URL('./serviceAccountKey.json', import.meta.url)),
)

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const correos = process.argv.slice(2)
if (correos.length === 0) {
  console.error('Uso: node scripts/agregarUsuario.mjs correo@ejemplo.com [otro@ejemplo.com ...]')
  process.exit(1)
}

for (const correo of correos) {
  await db.collection('usuariosAutorizados').doc(correo.toLowerCase().trim()).set({
    agregado: new Date(),
  })
  console.log(`Autorizado: ${correo}`)
}

process.exit(0)
