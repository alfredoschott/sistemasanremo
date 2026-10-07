import logo from '../assets/schott/schott-horizontal.png'
import logoLema from '../assets/schott/schott-horizontal-lema.png'

// `grande` (panel de administradores): logo con lema y más alto.
export default function FirmaSchott({ className = '', grande = false }) {
  return (
    <div className={`no-print flex items-center justify-center gap-2 text-[11px] text-ink-faint ${className}`}>
      <span>Desarrollado por</span>
      <img
        src={grande ? logoLema : logo}
        alt="Schott D. Systems"
        className={`${grande ? 'h-[68px]' : 'h-[28px]'} w-auto opacity-80`}
      />
    </div>
  )
}
