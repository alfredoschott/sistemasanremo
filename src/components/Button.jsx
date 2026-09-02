import Spinner from './Spinner'

const VARIANTS = {
  primary:
    'bg-brand-700 text-white hover:bg-brand-800 shadow-sm hover:shadow-md disabled:hover:shadow-sm',
  secondary: 'text-slate-600 hover:bg-slate-100 border border-transparent',
  outline: 'border border-slate-300 text-slate-700 hover:border-brand-600 hover:bg-brand-50 hover:text-brand-800',
  ghost: 'text-slate-400 hover:text-red-600 hover:bg-red-50',
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
      className={`inline-flex items-center justify-center rounded-md font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner className="h-3.5 w-3.5" />}
      {children}
    </button>
  )
}
