export const CATEGORIAS = [
  'Aislamiento',
  'Boquillas y bridas',
  'Tornillería',
  'Conectores y zapatas',
  'Soldadura',
  'Seguridad (EPP)',
  'Consumibles',
  'Otros',
]

export const UNIDADES_SUGERIDAS = [
  'pza',
  'caja',
  'rollo',
  'par',
  'kg',
  'litro',
  'metro',
  'hoja',
  'juego',
  'cubeta',
  'lata',
]

// "sinCapturar": nunca se le dio un mínimo ni un stock real (recién importado).
// No es lo mismo que "critico" (mínimo configurado y en cero) — evita que todo
// el catálogo recién cargado se vea como una alerta real.
export function estadoMaterial(material) {
  const stock = material.stock ?? 0
  const minimo = material.minimo ?? 0
  if (stock === 0 && minimo === 0) return 'sinCapturar'
  if (stock <= 0) return 'critico'
  if (stock < minimo) return 'bajo'
  return 'ok'
}
