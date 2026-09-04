import { useCallback, useEffect, useState } from 'react'

// Pasos de tamaño de texto para accesibilidad. Se aplican como font-size en
// <html>: como casi todo en la app está en rem (Tailwind), esto escala
// textos, íconos y espaciados de forma proporcional sin romper el layout —
// a diferencia de un transform: scale(), aquí el documento sigue fluyendo
// normal y las tablas/paneles con overflow-x-auto se ajustan solos.
const STEPS = [87.5, 100, 112.5, 125, 137.5, 150]
const DEFAULT_STEP = 100
const STORAGE_KEY = 'srm-ui-scale'

function readStored() {
  try {
    const raw = Number(localStorage.getItem(STORAGE_KEY))
    return STEPS.includes(raw) ? raw : DEFAULT_STEP
  } catch {
    return DEFAULT_STEP
  }
}

export function useUiScale() {
  const [scale, setScale] = useState(readStored)

  useEffect(() => {
    document.documentElement.style.fontSize = `${scale}%`
    try {
      localStorage.setItem(STORAGE_KEY, String(scale))
    } catch {
      // Almacenamiento no disponible (modo privado, etc.) — el zoom sigue
      // funcionando en esta sesión, solo no se recuerda la próxima vez.
    }
  }, [scale])

  const index = STEPS.indexOf(scale)

  const increase = useCallback(() => setScale(STEPS[Math.min(index + 1, STEPS.length - 1)]), [index])
  const decrease = useCallback(() => setScale(STEPS[Math.max(index - 1, 0)]), [index])
  const reset = useCallback(() => setScale(DEFAULT_STEP), [])

  return {
    scale,
    increase,
    decrease,
    reset,
    canIncrease: index < STEPS.length - 1,
    canDecrease: index > 0,
  }
}
