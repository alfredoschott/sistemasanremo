// Si un valor empieza con = + - @ (o tab/CR), Excel/Sheets puede interpretarlo
// como fórmula al abrir el CSV ("inyección de fórmulas" vía nombre de cliente,
// proveedor o material). Se neutraliza anteponiendo un apóstrofe.
const FORMULA_PREFIX = /^[=+\-@\t\r]/

function sanitizeCell(value) {
  const str = String(value ?? '')
  return FORMULA_PREFIX.test(str) ? `'${str}` : str
}

export function exportCsv(filename, rows, columns) {
  const escape = (value) => `"${sanitizeCell(value).replace(/"/g, '""')}"`
  const header = columns.map((c) => escape(c.label)).join(',')
  const lines = rows.map((row) => columns.map((c) => escape(c.value(row))).join(','))
  const csv = [header, ...lines].join('\n')

  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
