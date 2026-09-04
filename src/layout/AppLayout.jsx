import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppLayout() {
  const location = useLocation()

  return (
    <div className="flex h-screen flex-col print:block print:h-auto">
      <div className="no-print">
        <Topbar />
      </div>
      <div className="no-print">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 print:overflow-visible print:p-0">
        <div key={location.pathname} className="mx-auto max-w-6xl animate-fade-in">
          <Outlet />
        </div>
      </main>
      <div className="no-print">
        <BottomNav />
      </div>
    </div>
  )
}
