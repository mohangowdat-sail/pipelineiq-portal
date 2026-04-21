import { useState } from 'react'
import { ChevronDown, ChevronRight, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { USERS, CLIENTS, getAccessibleIncidents } from '../data/mockData'

const ALL_INCIDENTS_FOR_ENGINEERS = Object.values(USERS).flatMap(() => [])
const ROLE_COLORS = { admin: 'text-accent bg-accent/10 border-accent/20', founder: 'text-oracle bg-oracle/10 border-oracle/20', senior_engineer: 'text-aws bg-aws/10 border-aws/20', engineer: 'text-healthy bg-healthy/10 border-healthy/20' }
const CLOUD_COLORS = { Azure: 'cloud-azure', AWS: 'cloud-aws', 'Oracle Cloud': 'cloud-oracle' }

export default function Engineers() {
  const { user } = useAuth()
  const [expanded, setExpanded] = useState(null)

  const allowed = ['admin','founder','senior_engineer']
  if (!allowed.includes(user?.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Lock size={48} className="text-text-muted opacity-40" />
        <div className="text-text-primary text-lg font-semibold">Access restricted</div>
        <div className="text-text-muted text-sm">This page is only accessible to Admin, Founder, and Senior Engineer roles.</div>
        <div className="badge severity-critical">403 Forbidden</div>
      </div>
    )
  }

  // Build all incidents from all clients
  const fakeUser = { client_access: ['__all__'] }
  const allIncidents = getAccessibleIncidents({ ...user, client_access: ['__all__'] })

  const engineers = Object.values(USERS).map(u => {
    const openInc = allIncidents.filter(i => i.assigned_to === u.username && i.status !== 'resolved')
    const resolvedInc = allIncidents.filter(i => i.assigned_to === u.username && i.status === 'resolved' && i.resolution_time_minutes)
    const avgMTTR = resolvedInc.length ? Math.round(resolvedInc.reduce((s, i) => s + i.resolution_time_minutes, 0) / resolvedInc.length) : null
    const accessClients = u.client_access.includes('__all__') ? CLIENTS : CLIENTS.filter(c => u.client_access.includes(c.name))
    return { ...u, openInc, resolvedCount: resolvedInc.length, avgMTTR, accessClients }
  })

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div>
        <h1 className="text-text-primary text-xl font-bold">Engineering team</h1>
        <p className="text-text-muted text-sm mt-1">{engineers.length} engineers across all clients</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {engineers.map(eng => {
          const isExp = expanded === eng.username
          return (
            <div key={eng.username} className="card cursor-pointer hover:shadow-card-hover"
              onClick={() => setExpanded(isExp ? null : eng.username)}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                    {eng.initials}
                  </div>
                  <div>
                    <div className="text-text-primary font-semibold text-sm">{eng.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-text-muted text-xs font-mono">@{eng.username}</span>
                      <span className={`badge text-[10px] border ${ROLE_COLORS[eng.role]}`}>{eng.role.replace('_',' ')}</span>
                    </div>
                  </div>
                </div>
                {isExp ? <ChevronDown size={16} className="text-text-muted" /> : <ChevronRight size={16} className="text-text-muted" />}
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center">
                  <div className={`text-lg font-bold ${eng.openInc.length > 0 ? 'text-warning' : 'text-healthy'}`}>{eng.openInc.length}</div>
                  <div className="text-text-muted text-xs">open</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-text-primary">{eng.resolvedCount}</div>
                  <div className="text-text-muted text-xs">resolved 30d</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-text-secondary">{eng.avgMTTR ? `${eng.avgMTTR}m` : '—'}</div>
                  <div className="text-text-muted text-xs">avg MTTR</div>
                </div>
              </div>

              {/* Client chips */}
              <div className="mt-3 flex flex-wrap gap-1">
                {eng.accessClients.map(c => (
                  <span key={c.id} className={`badge text-[10px] ${CLOUD_COLORS[c.cloud]}`}>
                    {c.name.replace(' Internal','').replace(' Group','').replace(' Cotton','').replace(' Retail','')}
                  </span>
                ))}
              </div>

              {/* Expanded open incidents */}
              {isExp && eng.openInc.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <div className="text-text-muted text-xs font-semibold uppercase tracking-wide">Open incidents</div>
                  {eng.openInc.map(i => (
                    <div key={i.id} className="flex items-center gap-2 bg-surface2 rounded-lg px-3 py-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${i.severity === 'critical' ? 'bg-critical' : i.severity === 'warning' ? 'bg-warning' : 'bg-text-muted'}`} />
                      <span className="text-text-primary text-xs flex-1 truncate">{i.title}</span>
                      <span className="text-text-muted text-xs flex-shrink-0">{i.client_name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              )}
              {isExp && eng.openInc.length === 0 && (
                <div className="mt-4 pt-4 border-t border-border text-text-muted text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-healthy" /> No open incidents assigned
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
