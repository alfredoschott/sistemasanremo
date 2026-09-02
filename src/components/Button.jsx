import Spinner from './Spinner'

// Botones "3D": borde sólido abajo que simula relieve, y al hacer clic
// el botón baja y pierde ese borde (efecto de "presionado" real).
const VARIANTS = {
  primary:
    'bg-gradient-to-b from-brand-600 to-brand-700 text-white border border-brand-800 shadow-[0_3px_0_0_var(--color-brand-900)] hover:from-brand-500 hover:to-brand-600 active:translate-y-[3px] active:shadow-[0_0_0_0_var(--color-brand-900)] disabled:active:translate-y-0 disabled:active:shadow-[0_3px_0_0_var(--color-brand-900)]',
  outline:
    'bg-white text-slate-700 border border-slate-300 shadow-[0_2px_0_0_theme(colors.slate.300)] hover:border-brand-500 hover:text-brand-800 active:translate-y-[2px] active:shadow-[0_0_0_0_theme(colors.slate.300)] disabled:active:translate-y-0 disabled:active:shadow-[0_2px_0_0_theme(colors.slate.300)]',
  secondary: 'text-slate-600 hover:bg-slate-100 border border-transparent active:scale-[0.98]',
  ghost: 'text-slate-400 hover:text-red-600 hover:bg-red-50 active:scale-[0.98]',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-md font-medium transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner className="h-3.5 w-3.5" />}
      {children}
    </button>
  )
}
