const VARIANTS = {
  default: 'text-slate-400 hover:bg-slate-100 hover:text-brand-700',
  danger: 'text-slate-400 hover:bg-red-50 hover:text-red-600',
}

export default function IconButton({
  icon: Icon,
  variant = 'default',
  badge,
  className = '',
  ...props
}) {
  return (
    <button
      className={`relative rounded-md p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      <Icon className="h-4 w-4" />
      {badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-brand-700 px-0.5 text-[9px] font-semibold text-white">
          {badge}
        </span>
      )}
    </button>
  )
}
