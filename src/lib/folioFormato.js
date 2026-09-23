// Formato puro, sin ninguna dependencia de Firebase — separado de
// folios.js a propósito para que se pueda probar (y usar en la UI) sin
// arrastrar la inicialización real de Firestore/Auth, que truena en CI
// sin las variables de entorno del proyecto (ver folios.test.js).
export function formatoFolioOF(year, numero) {
  return `OF-${year}-${String(numero).padStart(3, '0')}`
}
