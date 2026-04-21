import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getAccessibleIncidents } from '../data/mockData'
import Sidebar from './Sidebar'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/incidents': 'Incidents',
  '/pipelines': 'Pipelines',
  '/patterns': 'Pattern Analysis',
  '/notifications': 'Notifications',
  '/engineers': 'Engineers',
  '/coming-soon': 'Coming Soon',
}

export default function Layout() {
  const { user } = useAuth()
  const location = useLocation()
  const [activeClient, setActiveClient] = useState(null)
  const [search, setSearch] = useState('')

  const incidents = getAccessibleIncidents(user)
  const openAssigned = incidents.filter(i => i.status !== 'resolved' && i.assigned_to === user?.username).length
  const pageTitle = PAGE_TITLES[location.pathname] || 'PipelineIQ'

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar activeClient={activeClient} setActiveClient={setActiveClient} />
      <div className="flex-1 ml-60 min-w-0 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top navbar */}
        <header className="fixed top-0 right-0 left-60 h-14 bg-surface/90 border-b border-border backdrop-blur-md z-30 flex items-center px-6 gap-4">
          <h1 className="font-semibold text-text-primary text-base flex-shrink-0">{pageTitle}</h1>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search incidents, pipelines…"
                className="w-full bg-surface2 border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-surface2 transition-colors">
              <Bell size={18} className="text-text-secondary" />
              {openAssigned > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-critical text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {openAssigned}
                </span>
              )}
            </button>
            <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-semibold text-xs">
              {user?.initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 pt-14 overflow-y-auto overflow-x-hidden w-full">
          <Outlet context={{ activeClient, setActiveClient, search }} />
        </main>
      </div>
    </div>
  )
}
