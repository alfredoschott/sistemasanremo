// Datos logísticos que un transformador terminado debería tener para poder
// entregarse. Los que llegan solos desde una OF facturada (ver
// ofActions.agregarTransformadoresTerminados) nacen sin ellos.
const CAMPOS = [
  { campo: 'capacidadKva', label: 'capacidad' },
  { campo: 'voltaje', label: 'voltaje' },
  { campo: 'ubicacion', label: 'ubicación' },
]

export function datosFaltantes(t) {
  return CAMPOS.filter(({ campo }) => {
    const v = t[campo]
    return v === null || v === undefined || String(v).trim() === ''
  }).map(({ label }) => label)
}

// Los modelos de Sanremo siguen el patrón TIPO-kVA-kV (TDD-500-13.2 →
// 500 kVA, clase 13.2 kV). Solo se usa como SUGERENCIA en el formulario
// (con un botón para aplicarla): si algún modelo no sigue el patrón,
// simplemente no se sugiere nada, nunca se guarda un dato inventado.
export function sugerirCapacidadKva(modelo) {
  const m = /^[A-Za-z]+-(\d+(?:\.\d+)?)-\d+(?:\.\d+)?$/.exec((modelo ?? '').trim())
  return m ? Number(m[1]) : null
}
