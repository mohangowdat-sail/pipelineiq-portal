import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, AlertTriangle, GitBranch, BarChart3,
  Bell, Users, Zap, LogOut, ChevronDown, LineChart,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getAccessibleClients } from '../data/mockData'

const ROLE_LABELS = {
  admin: 'Admin', founder: 'Founder',
  senior_engineer: 'Senior Engineer', engineer: 'Engineer',
}

export default function Sidebar({ activeClient, setActiveClient }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const accessibleClients = getAccessibleClients(user)
  const showEngineers = ['admin', 'founder', 'senior_engineer'].includes(user?.role)

  const isAnalyticsRoute = location.pathname === '/dashboard' || location.pathname === '/patterns'
  const [analyticsOpen, setAnalyticsOpen] = useState(isAnalyticsRoute)

  useEffect(() => {
    if (isAnalyticsRoute) setAnalyticsOpen(true)
  }, [isAnalyticsRoute])

  const handleLogout = () => { logout(); navigate('/login') }

  const primaryNav = [
    { to: '/incidents',     icon: AlertTriangle, label: 'Incidents'     },
    { to: '/pipelines',     icon: GitBranch,     label: 'Pipelines'     },
    { to: '/notifications', icon: Bell,          label: 'Notifications' },
  ]

  const analyticsNav = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard'        },
    { to: '/patterns',  icon: LineChart,       label: 'Pattern Analysis' },
  ]

  const bottomNav = [
    ...(showEngineers ? [{ to: '/engineers',  icon: Users, label: 'Engineers'  }] : []),
    {                    to: '/coming-soon', icon: Zap,   label: 'Coming Soon' },
  ]

  const cloudDot = { Azure: 'bg-azure', AWS: 'bg-aws', 'Oracle Cloud': 'bg-oracle' }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-surface border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap size={15} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-text-primary text-sm tracking-wide">PipelineIQ</div>
            <div className="text-text-muted text-[10px]">observability</div>
          </div>
        </div>
      </div>

      {/* User */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-semibold text-sm flex-shrink-0">
            {user?.initials}
          </div>
          <div className="min-w-0">
            <div className="text-text-primary text-sm font-medium truncate">{user?.name}</div>
            <span className="badge bg-accent/10 text-accent border-accent/20 text-[10px]">
              {ROLE_LABELS[user?.role]}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">

        {/* Primary nav */}
        {primaryNav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={15} />
            {label}
          </NavLink>
        ))}

        {/* Analytics collapsible section */}
        <div className="pt-2">
          <div className="px-3 mb-1">
            <div className="h-px bg-border" />
          </div>
          <button
            onClick={() => setAnalyticsOpen(v => !v)}
            className={`nav-item w-full justify-between ${isAnalyticsRoute ? 'text-text-primary' : ''}`}>
            <div className="flex items-center gap-3">
              <BarChart3 size={15} />
              <span>Analytics</span>
            </div>
            <ChevronDown
              size={13}
              className={`text-text-muted transition-transform duration-200 ${analyticsOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {analyticsOpen && (
            <div className="ml-3 mt-0.5 pl-3 border-l border-border space-y-0.5">
              {analyticsNav.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer
                    ${isActive
                      ? 'text-text-primary bg-surface2'
                      : 'text-text-muted hover:text-text-secondary hover:bg-surface2/60'
                    }`}>
                  <Icon size={13} />
                  {label}
                </NavLink>
              ))}
            </div>
          )}
          <div className="px-3 mt-2 mb-1">
            <div className="h-px bg-border" />
          </div>
        </div>

        {/* Bottom nav (Engineers, Coming Soon) */}
        {bottomNav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={15} />
            {label}
          </NavLink>
        ))}

        {/* Client quick-switcher */}
        <div className="pt-3">
          <div className="text-text-muted text-[10px] font-semibold uppercase tracking-widest px-3 mb-1.5">
            Clients
          </div>
          <div className="space-y-0.5">
            {accessibleClients.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveClient(activeClient?.id === c.id ? null : c)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors duration-100 flex items-center gap-2
                  ${activeClient?.id === c.id
                    ? 'bg-surface2 text-text-primary border border-border'
                    : 'text-text-muted hover:text-text-secondary hover:bg-surface2/50'
                  }`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cloudDot[c.cloud] || 'bg-accent'} opacity-70`} />
                {c.name}
                {activeClient?.id === c.id && (
                  <span className="ml-auto text-text-muted text-[9px]">×</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom status + logout */}
      <div className="p-3 border-t border-border space-y-1">
        <div className="flex items-center gap-2 px-3 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-healthy animate-pulse flex-shrink-0" />
          <span className="text-text-muted text-[11px]">Backend connected</span>
        </div>
        <button onClick={handleLogout}
          className="nav-item w-full text-text-muted hover:text-critical">
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </aside>
  )
}
