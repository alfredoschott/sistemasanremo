const VARIANTS = {
  primary:
    'bg-brand-700 text-white hover:bg-brand-800 active:scale-[0.98] disabled:opacity-60 shadow-sm hover:shadow',
  secondary:
    'text-slate-600 hover:bg-slate-100 active:scale-[0.98] disabled:opacity-60',
  outline:
    'border border-brand-700 text-brand-700 hover:bg-brand-50 active:scale-[0.98] disabled:opacity-60',
  ghost: 'text-slate-400 hover:text-red-600 hover:bg-red-50',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      className={`rounded-md font-medium transition-all duration-150 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
