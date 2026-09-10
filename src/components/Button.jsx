import Spinner from './Spinner'

const VARIANTS = {
  primary:
    'bg-brand-700 text-white border border-brand-800 hover:bg-brand-800 hover:-translate-y-px hover:shadow-md active:translate-y-0 active:scale-[0.98] active:shadow-none',
  outline:
    'bg-surface text-ink border border-line-strong hover:border-brand-600 hover:text-brand-800 hover:-translate-y-px active:translate-y-0 active:scale-[0.98]',
  secondary: 'text-ink-dim hover:bg-surface-2 border border-transparent active:scale-[0.98]',
  ghost: 'text-ink-faint hover:text-red-600 hover:bg-red-50 active:scale-[0.98]',
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
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner className="h-3.5 w-3.5" />}
      {children}
    </button>
  )
}
