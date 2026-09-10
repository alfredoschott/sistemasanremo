// Calcula qué materiales necesita una OF a partir de los items cotizados
// (modelo + cantidad) y las listas de materiales (LDM) capturadas por
// modelo — ver useListasMateriales.js. Si un modelo no tiene LDM
// capturada todavía, simplemente no aporta materiales (no truena): la OF
// queda sin `materialesRequeridos` para ese modelo y se puede completar a
// mano desde la propia OF.
//
// Es la copia de la OF, no una referencia viva a la LDM — a propósito
// (ver contexto del proyecto: la receta estándar puede variar por
// pedido), así que después de calcularse aquí se puede editar sin tocar
// el estándar de nadie más.
export function calcularMaterialesRequeridos(items, listas) {
  const porModelo = new Map(listas.map((l) => [l.modelo, l.materiales ?? []]))
  const acumulado = new Map()

  for (const item of items ?? []) {
    const materiales = porModelo.get(item.modelo)
    if (!materiales) continue
    for (const linea of materiales) {
      const previo = acumulado.get(linea.materialId) ?? 0
      acumulado.set(linea.materialId, previo + (linea.cantidad ?? 0) * (item.cantidad ?? 1))
    }
  }

  return [...acumulado.entries()].map(([materialId, cantidadPlan]) => ({
    materialId,
    cantidadPlan,
    cantidadConsumida: 0,
  }))
}
