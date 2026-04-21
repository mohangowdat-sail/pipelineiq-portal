import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import { BarChart, Bar, ResponsiveContainer, Cell, Tooltip } from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { getAccessibleClients, PIPELINES, CLIENTS } from '../data/mockData'

function Sparkline({ history }) {
  const last30 = history.slice(-30)
  return (
    <ResponsiveContainer width={80} height={24}>
      <BarChart data={last30} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barSize={2} barGap={1}>
        <Bar dataKey="duration_minutes" radius={[1,1,0,0]}>
          {last30.map((r, i) => <Cell key={i} fill={r.status === 'failed' ? '#EF4444' : '#22C55E'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function BranchBadge({ branch }) {
  const cls = branch === 'main' ? 'branch-main' : branch === 'staging' ? 'branch-staging' : 'branch-feature'
  return <span className={`badge ${cls} font-mono text-xs`}>{branch}</span>
}

function CloudBadge({ service }) {
  const isAzure = service.startsWith('Azure')
  const isOracle = service.startsWith('Oracle')
  const cls = isAzure ? 'cloud-azure' : isOracle ? 'cloud-oracle' : 'cloud-aws'
  return <span className={`badge ${cls}`}>{service}</span>
}

export default function Pipelines() {
  const { user } = useAuth()
  const clients = getAccessibleClients(user)
  const [activeClientId, setActiveClientId] = useState(clients[0]?.id)
  const [envFilter, setEnvFilter] = useState('')
  const [expandedRow, setExpandedRow] = useState(null)

  const activeClient = clients.find(c => c.id === activeClientId) || clients[0]
  const pipelines = (PIPELINES[activeClientId] || []).filter(p => !envFilter || p.environment === envFilter)

  // Prod non-main branches
  const prodNonMain = pipelines.filter(p => p.environment === 'prod' && p.active_branch !== 'main')

  const getSuccessRate = (history) => {
    const last30 = history.slice(-30)
    if (!last30.length) return 100
    return Math.round(last30.filter(r => r.status === 'success').length / last30.length * 100)
  }

  const getLastRun = (history) => {
    const last = history[history.length - 1]
    return last ? { status: last.status, date: last.date, duration: last.duration_minutes } : null
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      {/* Client tabs */}
      <div className="flex gap-2 flex-wrap">
        {clients.map(c => (
          <button key={c.id}
            onClick={() => { setActiveClientId(c.id); setEnvFilter('') }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeClientId === c.id ? 'bg-accent text-white' : 'bg-surface2 border border-border text-text-secondary hover:text-text-primary hover:border-accent/40'}`}>
            {c.name}
          </button>
        ))}
      </div>

      {/* Prod branch warning */}
      {prodNonMain.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={16} className="text-warning mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-warning font-semibold text-sm">Production branch warning</div>
            {prodNonMain.map(p => (
              <div key={p.id} className="text-warning/80 text-xs mt-1">
                <span className="font-medium">{p.name}</span> is running on branch <span className="font-mono font-semibold">{p.active_branch}</span> in production.
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Env filter */}
      <div className="flex gap-2">
        {['', ...(activeClient?.environments || [])].map(env => (
          <button key={env}
            onClick={() => setEnvFilter(env)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${envFilter === env ? 'bg-surface2 border border-accent/50 text-text-primary' : 'border border-border text-text-muted hover:border-border hover:text-text-secondary'}`}>
            {env || 'All environments'}
          </button>
        ))}
      </div>

      {/* Pipeline table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Pipeline','Cloud Service','Env','Branch','Last Run','Duration','30d Health','Success Rate','Status'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-text-muted text-xs font-semibold uppercase tracking-wide">{h}</th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {pipelines.map(p => {
              const lastRun = getLastRun(p.run_history)
              const sr = getSuccessRate(p.run_history)
              const isExpanded = expandedRow === p.id
              return [
                <tr key={p.id} onClick={() => setExpandedRow(isExpanded ? null : p.id)}
                  className="table-row cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="text-text-primary text-sm font-medium">{p.name}</div>
                  </td>
                  <td className="px-4 py-3"><CloudBadge service={p.cloud_service} /></td>
                  <td className="px-4 py-3">
                    <span className="badge bg-surface2 border border-border text-text-secondary">{p.environment}</span>
                  </td>
                  <td className="px-4 py-3"><BranchBadge branch={p.active_branch} /></td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {lastRun ? formatDistanceToNow(new Date(lastRun.date), { addSuffix: true }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {lastRun ? `${lastRun.duration}m` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Sparkline history={p.run_history} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-semibold ${sr >= 95 ? 'text-healthy' : sr >= 85 ? 'text-warning' : 'text-critical'}`}>{sr}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`w-2 h-2 rounded-full inline-block ${lastRun?.status === 'success' ? 'bg-healthy' : 'bg-critical'}`} />
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </td>
                </tr>,
                isExpanded && (
                  <tr key={`${p.id}-detail`} className="bg-surface2/50">
                    <td colSpan={10} className="px-6 py-4">
                      <div className="text-text-secondary text-xs font-semibold uppercase tracking-wide mb-3">Last 5 runs</div>
                      <div className="grid grid-cols-5 gap-2">
                        {p.run_history.slice(-5).reverse().map((r, i) => (
                          <div key={i} className={`rounded-lg p-3 border ${r.status === 'success' ? 'border-healthy/20 bg-healthy/5' : 'border-critical/20 bg-critical/5'}`}>
                            <div className={`text-xs font-semibold mb-1 ${r.status === 'success' ? 'text-healthy' : 'text-critical'}`}>{r.status}</div>
                            <div className="text-text-muted text-xs">{r.date}</div>
                            <div className="text-text-secondary text-xs">{r.duration_minutes}m</div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ),
              ].filter(Boolean)
            })}
          </tbody>
        </table>
        {!pipelines.length && (
          <div className="flex items-center justify-center h-32 text-text-muted text-sm">
            No pipelines found for this filter
          </div>
        )}
      </div>
    </div>
  )
}
