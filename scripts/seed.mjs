// Carga datos de prueba en Firestore (clientes y cotizaciones semilla).
// Requiere una service account key del proyecto Firebase (Configuración del
// proyecto > Cuentas de servicio > Generar nueva clave privada), guardada como
// scripts/serviceAccountKey.json (ignorado por git).
// Uso: node scripts/seed.mjs
import { readFileSync } from 'node:fs'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const serviceAccount = JSON.parse(
  readFileSync(new URL('./serviceAccountKey.json', import.meta.url)),
)

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const clientes = ['Industrias Reyna', 'Transformadores del Bajío', 'Eléctrica del Centro']

const cotizaciones = [
  {
    cliente: 'Industrias Reyna',
    monto: 185000,
    condicionPago: 'anticipo',
    porcentajeAnticipo: 30,
    entregaSemanas: 4,
    estado: 'Cotizado',
  },
  {
    cliente: 'Transformadores del Bajío',
    monto: 342000,
    condicionPago: 'fudeco',
    porcentajeAnticipo: null,
    entregaSemanas: 4,
    estado: 'OF abierta',
  },
  {
    cliente: 'Eléctrica del Centro',
    monto: 97500,
    condicionPago: 'anticipo',
    porcentajeAnticipo: 50,
    entregaSemanas: 3,
    estado: 'Producción',
  },
]

async function seed() {
  for (const nombre of clientes) {
    await db.collection('clientes').add({ nombre })
  }

  for (const cot of cotizaciones) {
    await db.collection('cotizaciones').add({ ...cot, fecha: new Date() })
  }

  console.log(`Sembrado: ${clientes.length} clientes, ${cotizaciones.length} cotizaciones.`)
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
