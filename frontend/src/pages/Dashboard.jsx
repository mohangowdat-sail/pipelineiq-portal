import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { format } from 'date-fns'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { AlertTriangle, CheckCircle, Clock, Users, GitBranch, TrendingUp, TrendingDown, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  getAccessibleClients, getAccessibleIncidents, getClientHealth,
  getAccessibleClientIds, PIPELINES,
  PATTERN_COLORS, PATTERN_LABELS, CLIENTS
} from '../data/mockData'

function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!target) return
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setVal(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return val
}

function StatCard({ icon: Icon, label, value, sub, trend, color = 'accent' }) {
  const animated = useCountUp(typeof value === 'number' ? value : 0)
  const colorMap = {
    accent: 'text-accent',
    healthy: 'text-healthy',
    warning: 'text-warning',
    critical: 'text-critical',
  }
  return (
    <div className="card p-3 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <Icon size={13} className="text-text-muted" />
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-[10px] font-medium ${trend >= 0 ? 'text-healthy' : 'text-critical'}`}>
            {trend >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className={`text-[22px] font-bold ${colorMap[color]} font-mono leading-none mb-1`}>
        {typeof value === 'number' ? animated : value}
        {sub && <span className="text-xs text-text-muted font-sans font-normal ml-1">{sub}</span>}
      </div>
      <div className="text-text-muted text-[11px]">{label}</div>
    </div>
  )
}

const CLOUD_MTTR_COLORS = { Azure: '#7C5CBF', AWS: '#F97316', 'Oracle Cloud': '#0EA5E9' }

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface2 border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-text-secondary mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-text-primary">{p.name}: <strong>{p.value}</strong></span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const { activeClient, setActiveClient } = useOutletContext() || {}

  const allIncidents = getAccessibleIncidents(user)
  const clients = getAccessibleClients(user)
  const allClientHealth = getClientHealth(user)

  // Apply client filter when one is selected
  const incidents = activeClient
    ? allIncidents.filter(i => i.client_name === activeClient.name)
    : allIncidents
  const clientHealth = activeClient
    ? allClientHealth.filter(c => c.id === activeClient.id)
    : allClientHealth

  const openIncidents = incidents.filter(i => i.status !== 'resolved')
  const totalPipelines = clientHealth.reduce((s, c) => s + c.totalPipes, 0)
  const healthyPipelines = clientHealth.reduce((s, c) => s + c.healthyPipes, 0)

  const resolvedWithTime = incidents.filter(i => i.resolution_time_minutes)
  const mttr = resolvedWithTime.length
    ? Math.round(resolvedWithTime.reduce((s, i) => s + i.resolution_time_minutes, 0) / resolvedWithTime.length)
    : 0

  // Pattern distribution from filtered incidents
  const patternCounts = {}
  incidents.forEach(i => { patternCounts[i.pattern_tag] = (patternCounts[i.pattern_tag] || 0) + 1 })
  const patternData = Object.entries(patternCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Daily runs — scoped to selected client's pipelines (or all accessible)
  const dailyRuns = (() => {
    const clientIds = activeClient ? [activeClient.id] : getAccessibleClientIds(user)
    const dailyMap = {}
    clientIds.forEach(cid => {
      ;(PIPELINES[cid] || []).forEach(p => {
        p.run_history.forEach(r => {
          if (!dailyMap[r.date]) dailyMap[r.date] = { date: r.date, total: 0, failed: 0 }
          dailyMap[r.date].total++
          if (r.status === 'failed') dailyMap[r.date].failed++
        })
      })
    })
    return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)).slice(-14)
  })()

  const mttrByClient = clientHealth.map(c => {
    const resolved = incidents.filter(i => i.client_name === c.name && i.resolution_time_minutes)
    const avg = resolved.length ? Math.round(resolved.reduce((s, i) => s + i.resolution_time_minutes, 0) / resolved.length) : 0
    return {
      name: c.name.replace(' Internal', '').replace(' Group', '').replace(' Cotton', '').replace(' Retail', ''),
      avg, cloud: c.cloud,
    }
  }).filter(c => c.avg > 0)

  const recentIncidents = [...incidents]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 8)

  const openTitles = openIncidents.map(i => i.title)
  const greeting = time.getHours() < 12 ? 'Morning' : time.getHours() < 18 ? 'Afternoon' : 'Evening'
  const firstName = user?.name?.split(' ')[0]

  const cloudBorderColors = { Azure: 'border-azure', AWS: 'border-aws', 'Oracle Cloud': 'border-oracle' }
  const cloudBadgeStyles = { Azure: 'cloud-azure', AWS: 'cloud-aws', 'Oracle Cloud': 'cloud-oracle' }
  const severityDot = { critical: 'bg-critical', warning: 'bg-warning', info: 'bg-text-muted' }

  return (
    <div className="p-4 space-y-3 animate-fade-in w-full min-w-0 overflow-x-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 bg-surface border border-border rounded-card px-4 py-2.5 min-w-0">
        <div className="flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="text-text-primary font-semibold text-sm leading-tight">
              Good {greeting}, {firstName}
            </div>
            {activeClient && (
              <button
                onClick={() => setActiveClient(null)}
                className="flex items-center gap-1 bg-accent/15 border border-accent/30 text-accent text-[10px] font-semibold px-2 py-0.5 rounded-full hover:bg-accent/25 transition-colors"
              >
                {activeClient.name}
                <X size={9} />
              </button>
            )}
          </div>
          <div className="text-text-muted text-[11px] capitalize leading-tight mt-0.5">
            {user?.role?.replace('_', ' ')} · {format(time, 'EEE, d MMM yyyy')}
          </div>
        </div>

        {/* Live ticker */}
        {openIncidents.length > 0 && (
          <div className="flex-1 min-w-0 flex items-center gap-2 bg-surface2 border border-critical/20 rounded-lg px-3 py-1.5 overflow-hidden">
            <div className="flex-shrink-0 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-critical rounded-full animate-pulse" />
              <span className="text-critical text-[11px] font-semibold uppercase tracking-wider">Live</span>
              <span className="text-text-muted text-[11px]">{openIncidents.length} open</span>
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <div className="whitespace-nowrap animate-ticker text-text-secondary text-[11px]">
                {openTitles.join('   ·   ')}&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;{openTitles.join('   ·   ')}
              </div>
            </div>
          </div>
        )}

        <div className="flex-shrink-0 text-right">
          <div className="text-text-primary font-mono text-sm leading-tight">{format(time, 'HH:mm:ss')}</div>
          <div className="text-text-muted text-[11px] leading-tight mt-0.5">UTC+0</div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-5 gap-3 min-w-0">
        <StatCard icon={GitBranch}     label="Total pipelines"     value={totalPipelines}           trend={+3}                                      color="accent"   />
        <StatCard icon={AlertTriangle} label="Open incidents"      value={openIncidents.length}      trend={openIncidents.length > 3 ? -12 : +5}    color="critical" />
        <StatCard icon={CheckCircle}   label="Healthy pipelines"   value={healthyPipelines}          trend={+2}                                      color="healthy"  />
        <StatCard icon={Clock}         label="Avg MTTR"            value={mttr} sub="min"            trend={-8}                                      color="warning"  />
        <StatCard icon={Users}         label="Total clients"       value={activeClient ? 1 : clients.length} trend={0} color="accent" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-3 min-w-0">

        {/* Area — daily runs */}
        <div className="card min-w-0">
          <div className="text-text-muted text-[10px] font-semibold uppercase tracking-widest mb-3">
            Pipeline runs · 14 days
          </div>
          <ResponsiveContainer width="100%" height={145}>
            <AreaChart data={dailyRuns} margin={{ top: 4, right: 6, left: -26, bottom: 0 }}>
              <defs>
                <linearGradient id="runsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7C5CBF" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#7C5CBF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="failGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
              <XAxis dataKey="date" tick={{ fill: '#525252', fontSize: 9 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fill: '#525252', fontSize: 9 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total"  name="Runs"     stroke="#7C5CBF" fill="url(#runsGrad)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="failed" name="Failures" stroke="#EF4444" fill="url(#failGrad)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donut — incident patterns */}
        <div className="card min-w-0">
          <div className="text-text-muted text-[10px] font-semibold uppercase tracking-widest mb-3">
            Incident patterns
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <PieChart width={108} height={108}>
                <Pie data={patternData} cx="50%" cy="50%" innerRadius={28} outerRadius={46}
                  paddingAngle={2} dataKey="value" animationBegin={0} animationDuration={800}>
                  {patternData.map(entry => (
                    <Cell key={entry.name} fill={PATTERN_COLORS[entry.name] || '#7C5CBF'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              {patternData.slice(0, 7).map(p => (
                <div key={p.name} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: PATTERN_COLORS[p.name] }} />
                  <span className="text-text-muted text-[10px] truncate flex-1">{PATTERN_LABELS[p.name]}</span>
                  <span className="text-text-secondary text-[10px] font-mono ml-auto flex-shrink-0">{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar — MTTR by client */}
        <div className="card min-w-0">
          <div className="text-text-muted text-[10px] font-semibold uppercase tracking-widest mb-3">
            MTTR by client (min)
          </div>
          <ResponsiveContainer width="100%" height={158}>
            <BarChart data={mttrByClient} layout="vertical" margin={{ top: 0, right: 6, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#525252', fontSize: 9 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#a3a3a3', fontSize: 9 }} width={62} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avg" name="MTTR (min)" radius={[0, 3, 3, 0]} animationDuration={800}>
                {mttrByClient.map((entry, i) => (
                  <Cell key={i} fill={CLOUD_MTTR_COLORS[entry.cloud] || '#7C5CBF'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom: Client health + Recent incidents */}
      <div className="grid grid-cols-5 gap-3 min-w-0">

        {/* Client health grid */}
        <div className="col-span-3 min-w-0">
          <div className="text-text-muted text-[10px] font-semibold uppercase tracking-widest mb-2 px-0.5">
            Client health
          </div>
          <div className="grid grid-cols-3 gap-3">
            {clientHealth.map(c => (
              <button key={c.id} onClick={() => navigate('/pipelines')}
                className={`card text-left cursor-pointer border-l-2 p-3 min-w-0 ${cloudBorderColors[c.cloud] || 'border-accent'} hover:shadow-card-hover`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <div className="text-text-primary font-medium text-xs leading-tight truncate">{c.name}</div>
                    <span className={`badge mt-1 text-[10px] ${cloudBadgeStyles[c.cloud] || 'badge-azure'}`}>
                      {c.cloud}
                    </span>
                  </div>
                  <div className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ml-1 ${c.openIncidents > 0 ? 'text-critical bg-critical/10' : 'text-healthy bg-healthy/10'}`}>
                    {c.openIncidents > 0 ? `${c.openIncidents} open` : 'OK'}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div>
                    <div className="text-healthy text-xs font-bold font-mono">{c.healthyPipes}</div>
                    <div className="text-text-muted text-[9px]">ok</div>
                  </div>
                  <div>
                    <div className={`text-xs font-bold font-mono ${c.failedPipes > 0 ? 'text-critical' : 'text-text-muted'}`}>{c.failedPipes}</div>
                    <div className="text-text-muted text-[9px]">fail</div>
                  </div>
                  <div>
                    <div className={`text-xs font-bold font-mono ${c.sla >= 95 ? 'text-healthy' : c.sla >= 90 ? 'text-warning' : 'text-critical'}`}>{c.sla}%</div>
                    <div className="text-text-muted text-[9px]">7d SLA</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent incidents */}
        <div className="card col-span-2 p-3 min-w-0">
          <div className="text-text-muted text-[10px] font-semibold uppercase tracking-widest mb-2">
            Recent incidents
          </div>
          <div>
            {recentIncidents.map(inc => {
              const clientObj = CLIENTS.find(c => c.name === inc.client_name)
              return (
                <div key={inc.id}
                  className="table-row flex items-center gap-2 py-1.5 px-1 cursor-pointer rounded"
                  onClick={() => navigate('/incidents')}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${severityDot[inc.severity]}`} />
                  <span className={`badge text-[9px] flex-shrink-0 ${cloudBadgeStyles[clientObj?.cloud] || 'badge-azure'}`}>
                    {inc.client_name.replace(' Internal', '').replace(' Group', '').replace(' Cotton', '').replace(' Retail', '')}
                  </span>
                  <span className="text-text-primary text-[11px] flex-1 truncate min-w-0">{inc.title}</span>
                  <span className={`badge text-[9px] flex-shrink-0 ${inc.status === 'resolved' ? 'status-resolved' : inc.status === 'investigating' ? 'status-investigating' : 'status-open'}`}>
                    {inc.status}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
