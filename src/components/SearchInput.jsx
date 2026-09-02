import { Search } from 'lucide-react'

export default function SearchInput({ value, onChange, placeholder, className = '' }) {
  return (
    <div
      className={`mb-3 flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 transition-colors focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100 sm:max-w-xs ${className}`}
    >
      <Search className="h-4 w-4 shrink-0 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm outline-none"
      />
    </div>
  )
}
