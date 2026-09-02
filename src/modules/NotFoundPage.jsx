import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <Compass className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
      <h1 className="text-lg font-semibold text-slate-700">Página no encontrada</h1>
      <p className="text-sm text-slate-500">Esta ruta no existe en el sistema.</p>
      <Link to="/">
        <Button className="mt-2">Volver al inicio</Button>
      </Link>
    </div>
  )
}
