// Carga datos de prueba en Firestore (clientes y cotizaciones semilla).
// Requiere .env.local con las credenciales del proyecto Firebase y el
// proveedor "Anonymous" habilitado en Firebase Auth (Authentication > Sign-in method).
// Uso: node scripts/seed.mjs
import 'dotenv/config'
import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

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
  await signInAnonymously(auth)

  for (const nombre of clientes) {
    await addDoc(collection(db, 'clientes'), { nombre })
  }

  for (const cot of cotizaciones) {
    await addDoc(collection(db, 'cotizaciones'), { ...cot, fecha: serverTimestamp() })
  }

  console.log(`Sembrado: ${clientes.length} clientes, ${cotizaciones.length} cotizaciones.`)
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
