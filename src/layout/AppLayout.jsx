import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppLayout() {
  const location = useLocation()

  return (
    <div className="flex h-dvh flex-col print:block print:h-auto">
      <div className="no-print">
        <Topbar />
      </div>
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:p-6 print:overflow-visible print:p-0">
        <div key={location.pathname} className="mx-auto max-w-6xl animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
