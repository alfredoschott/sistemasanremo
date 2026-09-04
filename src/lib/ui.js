export const inputClass =
  'mt-1 w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100'

// Sin margen ni ancho — para usarse dentro de filas flex junto a otros
// controles (select de material, input de cantidad, botón de borrar).
// El llamador agrega su propio ancho (w-20, w-full, flex-1…): NUNCA
// combines esto con otra clase w-* o px-*/py-* de este archivo esperando
// que "gane" la que escribas después — Tailwind no respeta el orden en el
// string, así que dos clases que tocan la misma propiedad compiten según
// el orden en que Tailwind las generó, no como se ven aquí, y el resultado
// es impredecible (así se rompió antes el ancho del selector de material).
export const inputClassInline =
  'rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100'

// Igual que inputClassInline pero con padding compacto (px-2 py-1), para
// edición inline dentro de tablas. No combinar con inputClass/inputClassInline
// en el mismo elemento por la misma razón de arriba.
export const inputClassCompact =
  'rounded-md border border-line-strong bg-surface px-2 py-1 text-sm text-ink outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100'
