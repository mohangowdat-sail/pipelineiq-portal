import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { getAccessibleIncidents, getAccessibleClients, PATTERN_COLORS, PATTERN_LABELS, RECURRING_PATTERN_SUMMARIES } from '../data/mockData'
import { subDays, format } from 'date-fns'

const ALL_PATTERNS = ['schema_drift','null_constraint','volume_anomaly','dependency_violation','referential_integrity','scd_explosion','auth_failure','timeout','config_drift']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface2 border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-text-secondary mb-1">{label}</div>
      {payload.map(p => <div key={p.name} className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
        <span className="text-text-primary">{PATTERN_LABELS[p.name] || p.name}: <strong>{p.value}</strong></span>
      </div>)}
    </div>
  )
}

export default function PatternAnalysis() {
  const { user } = useAuth()
  const incidents = getAccessibleIncidents(user)
  const clients = getAccessibleClients(user)
  const now = new Date()

  // Pattern totals
  const patternTotals = {}
  incidents.forEach(i => { patternTotals[i.pattern_tag] = (patternTotals[i.pattern_tag] || 0) + 1 })

  // Most frequent pattern
  const mostFreqPattern = Object.entries(patternTotals).sort((a, b) => b[1] - a[1])[0]

  // Client with most failures
  const clientCounts = {}
  incidents.filter(i => i.status !== 'resolved').forEach(i => { clientCounts[i.client_name] = (clientCounts[i.client_name] || 0) + 1 })
  const topClient = Object.entries(clientCounts).sort((a, b) => b[1] - a[1])[0]

  // Avg MTTR by pattern
  const patternMTTR = {}
  const patternMTTRCounts = {}
  incidents.forEach(i => {
    if (i.resolution_time_minutes) {
      patternMTTR[i.pattern_tag] = (patternMTTR[i.pattern_tag] || 0) + i.resolution_time_minutes
      patternMTTRCounts[i.pattern_tag] = (patternMTTRCounts[i.pattern_tag] || 0) + 1
    }
  })
  const patternAvgMTTR = Object.entries(patternMTTR).map(([p, total]) => ({
    pattern: p, avg: Math.round(total / patternMTTRCounts[p])
  })).sort((a, b) => a.avg - b.avg)

  const fastestPattern = patternAvgMTTR[0]

  // Daily breakdown by pattern (last 30 days)
  const days = Array.from({ length: 30 }, (_, i) => format(subDays(now, 29 - i), 'yyyy-MM-dd'))
  const dailyPatternMap = {}
  incidents.forEach(i => {
    const day = i.created_at.substring(0, 10)
    if (!dailyPatternMap[day]) dailyPatternMap[day] = {}
    dailyPatternMap[day][i.pattern_tag] = (dailyPatternMap[day][i.pattern_tag] || 0) + 1
  })
  const lineData = days.map(d => {
    const row = { date: d.slice(5) }
    ALL_PATTERNS.forEach(p => { row[p] = dailyPatternMap[d]?.[p] || 0 })
    return row
  })

  // Client-pattern heatmap
  const heatmap = {}
  clients.forEach(c => {
    heatmap[c.name] = {}
    ALL_PATTERNS.forEach(p => { heatmap[c.name][p] = 0 })
  })
  incidents.forEach(i => {
    if (heatmap[i.client_name]) heatmap[i.client_name][i.pattern_tag]++
  })
  const maxCell = Math.max(...Object.values(heatmap).flatMap(row => Object.values(row)))

  const heatColor = (count) => {
    if (count === 0) return 'transparent'
    const intensity = count / maxCell
    const r = Math.round(239 * intensity + 42 * (1 - intensity))
    const g = Math.round(68 * intensity + 29 * (1 - intensity))
    const b = Math.round(68 * intensity + 58 * (1 - intensity))
    return `rgba(${r},${g},${b},${0.15 + intensity * 0.7})`
  }

  // Recurring patterns (3+ same client, last 30 days)
  const recurringMap = {}
  const thirtyAgo = subDays(now, 30)
  incidents.forEach(i => {
    if (new Date(i.created_at) >= thirtyAgo) {
      const key = `${i.client_name}::${i.pattern_tag}`
      recurringMap[key] = (recurringMap[key] || 0) + 1
    }
  })
  const recurring = Object.entries(recurringMap).filter(([,v]) => v >= 3).map(([key, count]) => {
    const [client, pattern] = key.split('::')
    return { client, pattern, count }
  }).sort((a, b) => b.count - a.count)

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-text-primary text-xl font-bold">Failure pattern intelligence</h1>
        <p className="text-text-muted text-sm mt-1">Last 30 days across all accessible clients</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <div className="text-text-muted text-xs uppercase tracking-wide mb-1">Most frequent pattern</div>
          <div className="text-text-primary text-lg font-bold">{mostFreqPattern ? PATTERN_LABELS[mostFreqPattern[0]] : '—'}</div>
          <div className="text-text-secondary text-sm">{mostFreqPattern ? `${mostFreqPattern[1]} incidents` : ''}</div>
        </div>
        <div className="card">
          <div className="text-text-muted text-xs uppercase tracking-wide mb-1">Client with most open failures</div>
          <div className="text-text-primary text-lg font-bold truncate">{topClient?.[0] || 'None'}</div>
          <div className="text-text-secondary text-sm">{topClient ? `${topClient[1]} open` : 'All clear'}</div>
        </div>
        <div className="card">
          <div className="text-text-muted text-xs uppercase tracking-wide mb-1">Fastest resolved pattern</div>
          <div className="text-text-primary text-lg font-bold">{fastestPattern ? PATTERN_LABELS[fastestPattern.pattern] : '—'}</div>
          <div className="text-text-secondary text-sm">{fastestPattern ? `avg ${fastestPattern.avg} min` : ''}</div>
        </div>
      </div>

      {/* Line chart — incident freq by pattern */}
      <div className="card">
        <div className="text-text-primary text-sm font-semibold mb-4">Incident frequency by pattern — last 30 days</div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={lineData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3E" />
            <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} interval={4} />
            <YAxis tick={{ fill: '#475569', fontSize: 10 }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={v => <span style={{ color: '#94A3B8', fontSize: 11 }}>{PATTERN_LABELS[v]}</span>} />
            {ALL_PATTERNS.map(p => (
              <Line key={p} type="monotone" dataKey={p} stroke={PATTERN_COLORS[p]} strokeWidth={1.5}
                dot={false} activeDot={{ r: 4 }} animationDuration={600} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar chart — avg MTTR by pattern */}
      <div className="card">
        <div className="text-text-primary text-sm font-semibold mb-4">Avg resolution time by pattern (min) — fastest to slowest</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={patternAvgMTTR} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3E" />
            <XAxis dataKey="pattern" tick={{ fill: '#94A3B8', fontSize: 10 }} tickFormatter={v => PATTERN_LABELS[v]?.split(' ')[0] || v} />
            <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} formatter={(v, n) => [v, 'Avg MTTR (min)']} labelFormatter={l => PATTERN_LABELS[l] || l} />
            <Bar dataKey="avg" name="avg_mttr" radius={[4,4,0,0]} animationDuration={600}>
              {patternAvgMTTR.map((e, i) => <Cell key={i} fill={PATTERN_COLORS[e.pattern] || '#7C5CBF'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Heatmap */}
      <div className="card overflow-x-auto">
        <div className="text-text-primary text-sm font-semibold mb-4">Client × Pattern incident matrix</div>
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left text-text-muted font-semibold py-2 pr-4 w-40">Client</th>
              {ALL_PATTERNS.map(p => (
                <th key={p} className="text-center text-text-muted font-medium py-2 px-2 min-w-[72px]">
                  <div className="writing-mode-vertical" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', height: 80, lineHeight: '1.2' }}>
                    {PATTERN_LABELS[p]}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} className="border-t border-border">
                <td className="text-text-secondary py-2 pr-4 font-medium">{c.name.replace(' Internal','').replace(' Group','').replace(' Cotton','').replace(' Retail','')}</td>
                {ALL_PATTERNS.map(p => {
                  const count = heatmap[c.name]?.[p] || 0
                  return (
                    <td key={p} className="py-1 px-2 text-center">
                      <div className="w-full rounded py-1.5 text-xs font-semibold transition-colors"
                        style={{ background: heatColor(count), color: count > 0 ? '#F1F5F9' : 'transparent', minWidth: 28 }}>
                        {count > 0 ? count : ''}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex items-center gap-2 justify-end">
          <span className="text-text-muted text-xs">Intensity:</span>
          {[0, 1, 2, 3, 4, 5].map(n => (
            <div key={n} className="w-5 h-5 rounded text-[10px] flex items-center justify-center font-semibold"
              style={{ background: heatColor(n ? n * Math.ceil(maxCell / 5) : 0), color: n ? '#F1F5F9' : '#475569', border: n ? 'none' : '1px solid #2A2D3E' }}>
              {n ? n * Math.ceil(maxCell / 5) : '0'}
            </div>
          ))}
        </div>
      </div>

      {/* Recurring alerts */}
      {recurring.length > 0 && (
        <div className="space-y-3">
          <div className="text-text-primary text-sm font-semibold">Recurring alerts</div>
          {recurring.map(r => {
            const summaryKey = r.pattern
            const summary = RECURRING_PATTERN_SUMMARIES[summaryKey]
            return (
              <div key={`${r.client}-${r.pattern}`} className="card border-l-4 border-l-warning">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge bg-warning/10 border border-warning/20 text-warning">{r.count}× this month</span>
                      <span className="badge bg-surface2 border border-border text-text-secondary">{PATTERN_LABELS[r.pattern]}</span>
                    </div>
                    <div className="text-text-primary text-sm font-semibold">{r.client}</div>
                  </div>
                </div>
                {summary && (
                  <p className="text-text-secondary text-sm leading-relaxed mt-2">{summary.summary}</p>
                )}
                {!summary && (
                  <p className="text-text-secondary text-sm mt-2">
                    {r.client} has experienced {r.count} <strong>{PATTERN_LABELS[r.pattern]}</strong> incidents in the last 30 days. This recurring pattern suggests a systemic issue that has not yet been fully resolved. Consider scheduling a root-cause analysis session to prevent further recurrence.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
