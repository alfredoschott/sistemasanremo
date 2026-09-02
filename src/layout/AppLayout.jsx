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
      <div className="flex flex-1 overflow-hidden print:block print:overflow-visible">
        <div className="no-print">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 print:overflow-visible print:p-0">
          <div key={location.pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
      <div className="no-print">
        <BottomNav />
      </div>
    </div>
  )
}
