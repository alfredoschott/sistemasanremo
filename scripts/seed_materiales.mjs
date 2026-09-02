// Carga el catálogo real de materiales de almacén (a partir de
// "MAT. ALMACEN-2024.xlsx") con stock en 0 para que se ajuste con
// movimientos reales. Deduplicado a mano: el archivo original repite
// varios renglones con la misma descripción bajo distinto número de PDA.
// Requiere scripts/serviceAccountKey.json (ver seed.mjs).
// Uso: node scripts/seed_materiales.mjs
import { readFileSync } from 'node:fs'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const serviceAccount = JSON.parse(
  readFileSync(new URL('./serviceAccountKey.json', import.meta.url)),
)

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const materiales = [
  ['ACRILICO', 'hoja'],
  ['BARRA DE SOLERA DE ALUMINIO DE 1 1/4"X1/8"', 'barra'],
  ['BARRA DE SOLERA DE ALUMINIO DE 1"X1/8"', 'barra'],
  ['BARRA DE SOLERA DE ALUMINIO DE 1"X3/16"', 'barra'],
  ['BARRA DE SOLERA DE COBRE 1 1/2"X1/8"', 'barra'],
  ['BAYONETA PORTAFUSIBLE', 'pza'],
  ['BOQUILLA CLASE 15', 'pza'],
  ['BOQUILLA CLASE 15 (SOLO PORCELANA)', 'pza'],
  ['BOQUILLA CLASE 25', 'pza'],
  ['BOQUILLA CLASE 25 (SOLO PORCELANA)', 'pza'],
  ['BOQUILLA CLASE 34.5 DE ALTA TENSION', 'pza'],
  ['BOQUILLA CLASE 34.5 DE ALTA TENSION (SOLO PORCELANA)', 'pza'],
  ['BOQUILLA DE 5/8 (TYC)', 'pza'],
  ['BOQUILLA H-5 (SOLO PORCELANA)', 'pza'],
  ['BOQUILLA H-5 BIRLO DE 1 1/4', 'pza'],
  ['BOQUILLA H-5 BIRLO DE 1"', 'pza'],
  ['BOQUILLA H-5 BIRLO DE 3/4', 'pza'],
  ['BOQUILLA H-6 BIRLO DE 1/2', 'pza'],
  ['BOQUILLA H7 (1 3/4)', 'pza'],
  ['BOQUILLA H7 (1 1/2)', 'pza'],
  ['BOQUILLA H-7 (SOLO PORCELANA)', 'pza'],
  ['BOQUILLA H-7 BIRLO DE 1 1/4', 'pza'],
  ['BOQUILLA H7 CON BIRLO DE 1 3/8', 'pza'],
  ['BOQUILLA TIPO POZO', 'pza'],
  ['BRIDA CLASE 15', 'pza'],
  ['BRIDA CLASE 25 (H-7) 23 Y 34.5', 'pza'],
  ['BRIDA H-5', 'pza'],
  ['BRIDA TRIANGULAR (LAMINA)', 'pza'],
  ['BRIDA TRIANGULAR DE BRONCE', 'pza'],
  ['CAMBIADOR CD 30', 'pza'],
  ['CAMBIADOR DE BASE CORTO MOD.428', 'pza'],
  ['CAMBIADOR DE BASE LARGO MOD.429', 'pza'],
  ['CARRETE DE HILO DE ALGODÓN', 'carrete'],
  ['CINTA DE ALGODÓN DE 1"', 'rollo'],
  ['CINTA DE FIBRA DE VIDRIO DE 1"', 'rollo'],
  ['CINTA DE FIBRA DE VIDRIO DE 3/4', 'rollo'],
  ['CINTA DE FILAMENTO 1/2', 'rollo'],
  ['CINTA DE FILAMENTO 3/4', 'rollo'],
  ['CINTA KAPTON DE 3/4', 'rollo'],
  ['CINTA KAPTON DE 1/2', 'rollo'],
  ['CINTA TEFLON DE 3/4', 'rollo'],
  ['CINTA TEFLON DE 3/4 INDUSTRIAL', 'rollo'],
  ['CONECTOR TIPO AMERICANO 1 1/2"', 'pza'],
  ['CONECTOR TIPO AMERICANO 1"', 'pza'],
  ['CONECTOR TIPO AMERICANO DE 2"', 'pza'],
  ['CONECTOR TIPO AMERICANO DE 2 1/2"', 'pza'],
  ['CONECTOR TIPO AMERICANO DE 4"', 'pza'],
  ['CONO DE DESBASTE', 'pza'],
  ['NIPLE', 'pza'],
  ['CUBETA DE 19 L. PEGAMENTO BLANCO "RESISTOL 850"', 'cubeta'],
  ['CUBETA DE PEGAMENTO AMARILLO "RESISTOL 850"', 'cubeta'],
  ['DISCO DE CORTE', 'pza'],
  ['DISCO DE DESBASTE', 'pza'],
  ['ELECTRODO PARA ACERO 60-13 DE 1/8" (PARA PAILERIA)', 'kg'],
  ['ELECTRODO PARA ACERO 60-13 DE 5/32" (PARA PAILERIA)', 'kg'],
  ['ELECTRODO PARA ACERO 60-13 DE 70-18 (PARA PAILERIA)', 'kg'],
  ['ELECTRODO PARA ACERO INOXIDABLE DE 1/8"', 'kg'],
  ['ELECTRODO PARA ALUMINIO QE-2201E-4043 DE 1/8"', 'kg'],
  ['ELECTRODO PARA COBRE QE-2201-4043 DE 1/8"', 'kg'],
  ['GIS BLANCO (JABONCILLO O TIZAS)', 'caja'],
  ['HOJA DE CARTON DE 1/16', 'hoja'],
  ['HOJA DE CARTON DE 1/8', 'hoja'],
  ['HOJA DE CARTON DE 3/32', 'hoja'],
  ['KOLA LOCA', 'pza'],
  ['LIJAS DE ESMERIL DEL #120', 'pza'],
  ['LIJAS DE ESMERIL DEL #80', 'pza'],
  ['LIJAS PARA AGUA DEL #320', 'pza'],
  ['MASKING TAPE DE 18mm X 50m', 'rollo'],
  ['COPLE 1"', 'pza'],
  ['COPLE DE 1/2', 'pza'],
  ['COPLE DE 1/4', 'pza'],
  ['NIVEL DE ACEITE (ORTO)', 'pza'],
  ['NIVEL DE ACEITE CUADRADO (MATRIX)', 'pza'],
  ['PAPEL AISLANTE SWECOMEX NMN3 0.250 X 914 MM.', 'rollo'],
  ['PAPEL DIAMANTADO DE 0.005"', 'hoja'],
  ['PAPEL DIAMANTADO DE 0.010"', 'hoja'],
  ['PAPEL DIAMANTADO DE 0.015"', 'hoja'],
  ['PAPEL DIAMANTADO DE 0.020"', 'hoja'],
  ['PAPEL DIAMANTADO DE 0.07"', 'hoja'],
  ['PAPEL KRAFT DE 0.010"', 'hoja'],
  ['PAPEL NOMEX PURO 0.5MM.', 'hoja'],
  ['PAPEL NOMEX/MAYLAR/NOMEX, COMBINACION 3/3/3 (.250 X 914 mm)', 'rollo'],
  ['RONDANA PLANA GALV. DE 1/2"', 'pza'],
  ['RONDANA PLANA GALV. DE 1/4"', 'pza'],
  ['RONDANA PLANA GALV. DE 3/8"', 'pza'],
  ['RONDANA PLANA GALV. DE 5/16"', 'pza'],
  ['RONDANA DE PRESIÓN GALV. DE 1/2"', 'pza'],
  ['RONDANA DE PRESIÓN GALV. DE 1/4"', 'pza'],
  ['RONDANA DE PRESIÓN GALV. DE 5/16"', 'pza'],
  ['SECCIONADOR', 'pza'],
  ['SEGUETAS PARA ARCO, DE DIENTE FINO PARA CORTE DE METAL', 'pza'],
  ['SHELLAC', 'lata'],
  ['TAPON DE 1" TIPO CAPA', 'pza'],
  ['TAPON DE MUESTREO', 'pza'],
  ['TERMOMETRO (MATRIX)', 'pza'],
  ['TERMOMETRO (ORTO)', 'pza'],
  ['TIERRA CUADRADA TIPO B', 'pza'],
  ['TIERRA REDONDA', 'pza'],
  ['TORNILLOS GALV. DE 1/2" X 1 1/2", CABEZA HEXAGONAL', 'pza'],
  ['TORNILLOS GALV. DE 1/2" X 3", CABEZA HEXAGONAL', 'pza'],
  ['TORNILLOS GALV. DE 1/4" X 1", CABEZA HEXAGONAL', 'pza'],
  ['TORNILLOS GALV. DE 3/8" X 1 1/2", CABEZA HEXAGONAL', 'pza'],
  ['TORNILLOS GALV. DE 3/8" X 1 1/4", CABEZA HEXAGONAL', 'pza'],
  ['TORNILLOS GALV. DE 3/8" X 1", CABEZA HEXAGONAL', 'pza'],
  ['TORNILLOS GALV. DE 3/8" X 2", CABEZA HEXAGONAL', 'pza'],
  ['TORNILLOS GALV. DE 5/16" X 1 1/2", CABEZA HEXAGONAL', 'pza'],
  ['TORNILLOS GALV. DE 5/16" X 1", CABEZA HEXAGONAL', 'pza'],
  ['TUBO DE CREPE DE 12.7 X 1.6 MM (1/2" X 1 1/16") (300 MTS. POR CAJA)', 'caja'],
  ['TUBO DE CREPE DE 12.70 X 3.2 MM (1/2" X 1/8") (200 MTS. POR CAJA)', 'caja'],
  ['TUBO DE CREPE DE 6.4 X 1.6 MM (1/4" X 1/16") (800 MTS. POR CAJA)', 'caja'],
  ['TUBO DE CREPE DE 9.53 X 1.6 MM (3/8" X 1/16") (600 MTS. POR CAJA)', 'caja'],
  ['TUBO DE CREPE DE 9.53 X 3.18 MM (3/8" X 1/8") (300 MTS. POR CAJA)', 'caja'],
  ['TUERCAS HEXAGONAL GALV. DE 1/2"', 'pza'],
  ['TUERCAS HEXAGONAL GALV. DE 1/4"', 'pza'],
  ['TUERCAS HEXAGONAL GALV. DE 3/8"', 'pza'],
  ['TUERCAS HEXAGONAL GALV. DE 5/16"', 'pza'],
  ['TUERCAS HEXAGONALES DE BRONCE DE 1/4"', 'pza'],
  ['TUERCAS HEXAGONALES DE BRONCE DE 5/16"', 'pza'],
  ['VALVULA DE ALIVIO', 'pza'],
  ['VALVULA TIPO GLOBO', 'pza'],
  ['VARILLA ROSCADA DE 1/2"', 'pza'],
  ['VARILLA ROSCADA DE 3/4', 'pza'],
  ['VARILLA ROSCADA DE 5/16', 'pza'],
  ['VARILLAS ROSCADAS DE 1"', 'pza'],
  ['ZAPATA AISLADA CAL. 10 5/16 AMARILLO', 'pza'],
  ['ZAPATA AISLADA CAL. 10 1/4 AMARILLO', 'pza'],
  ['ZAPATA CONECTOR CAL.10 BAR 1/4', 'pza'],
  ['ZAPATA CONECTOR CAL.2 BAR 5/16', 'pza'],
  ['ZAPATA CONECTOR CAL.4 BAR 5/16', 'pza'],
  ['ZAPATA CONECTOR CAL.6 BAR 1/4', 'pza'],
  ['ZAPATA CONECTOR CAL.6 BAR 3/8', 'pza'],
  ['ZAPATA CONECTOR CAL.6 BAR 5/16', 'pza'],
  ['ZAPATA CONECTOR CAL.8 BAR 5/16', 'pza'],
  ['GUANTES DE CARNAZA CORTOS', 'par'],
  ['GUANTES DE CARNAZA LARGOS', 'par'],
  ['GUANTES DE NYLON NEGROS', 'par'],
  ['MANGAS DE CARNAZA', 'par'],
  ['PETOS DE CARNAZA', 'pza'],
  ['CRISTAL CLARO', 'hoja'],
  ['LLAVE DE CHAPA', 'pza'],
  ['CHAPA', 'pza'],
  ['BISAGRA', 'pza'],
  ['AERO COMEX AZUL', 'lata'],
  ['AERO COMEX AMARILLO', 'lata'],
  ['VITRODIEL 3/8 X 2 X 30', 'hoja'],
  ['VITRODIEL 1/4 X 1 X 17', 'hoja'],
  ['CEPILLO DE ALAMBRE', 'pza'],
  ['LENTES DE SEGURIDAD TIPO SPORT, CLAROS', 'pza'],
  ['FLEXOMETRO VERDE AQUA 5.5M, CADENA', 'pza'],
  ['PUNZON PARA BARRENAR 1/2" TRUPER', 'pza'],
  ['PUNZON PARA BARRENAR 5/8" TRUPER', 'pza'],
  ['ENCENDEDOR CHISPEADOR MANUAL PARA SOLDADURA DE GAS, TRUPER', 'pza'],
  ['DOG BONE HUESO DE FIBRA DE VIDRIO', 'pza'],
  ['BODY SEAL', 'pza'],
]

async function seed() {
  const existentesSnap = await db.collection('materiales').get()
  const nombresExistentes = new Set(existentesSnap.docs.map((d) => d.data().nombre))

  let creados = 0
  for (const [nombre, unidad] of materiales) {
    if (nombresExistentes.has(nombre)) continue
    await db.collection('materiales').add({ nombre, unidad, stock: 0, minimo: 0 })
    creados++
  }

  console.log(`Materiales creados: ${creados} de ${materiales.length} en la lista.`)
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
