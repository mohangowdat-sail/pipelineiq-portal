import { useState } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { ChevronDown, ChevronRight, Mail, Zap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getAccessibleIncidents, getAccessibleClients, CLIENTS } from '../data/mockData'

const CHANNEL_ICONS = {
  Slack: <Zap size={14} style={{ color: '#9D7FD4' }} />,
  Email: <Mail size={14} className="text-oracle" />,
}
const CHANNEL_COLORS = { Slack: 'text-accent-light', Email: 'text-oracle' }

export default function Notifications() {
  const { user } = useAuth()
  const clients = getAccessibleClients(user)
  const incidents = getAccessibleIncidents(user)
  const [expanded, setExpanded] = useState(null)
  const [filters, setFilters] = useState({ channel: '', client: '', search: '' })

  const allNotifs = incidents.flatMap(inc =>
    (inc.notification_log || []).map(n => ({
      ...n, incident_id: inc.id, incident_title: inc.title, client_name: inc.client_name,
      client: CLIENTS.find(c => c.name === inc.client_name),
    }))
  ).sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at))

  const filtered = allNotifs.filter(n => {
    if (filters.channel && n.channel !== filters.channel) return false
    if (filters.client && n.client_name !== filters.client) return false
    if (filters.search && !n.incident_title.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  const cloudBadge = { Azure: 'cloud-azure', AWS: 'cloud-aws', 'Oracle Cloud': 'cloud-oracle' }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div>
        <h1 className="text-text-primary text-xl font-bold">Notification history</h1>
        <p className="text-text-muted text-sm mt-1">All alert channels across accessible clients</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filters.channel} onChange={e => setFilters(f => ({ ...f, channel: e.target.value }))}
          className="bg-surface2 border border-border rounded-lg px-3 py-1.5 text-sm text-text-secondary focus:outline-none focus:border-accent/50">
          <option value="">All channels</option>
          {['Slack', 'Email'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filters.client} onChange={e => setFilters(f => ({ ...f, client: e.target.value }))}
          className="bg-surface2 border border-border rounded-lg px-3 py-1.5 text-sm text-text-secondary focus:outline-none focus:border-accent/50">
          <option value="">All clients</option>
          {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <input value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          placeholder="Search incident titles…"
          className="bg-surface2 border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 w-64" />
        <div className="ml-auto text-text-muted text-sm flex items-center">{filtered.length} notifications</div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Channel','Client','Incident','Recipients','Sent','Preview',''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-text-muted text-xs font-semibold uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((n, idx) => {
              const key = `${n.incident_id}-${n.channel}-${n.sent_at}-${idx}`
              const isExp = expanded === key
              return [
                <tr key={key} className="table-row cursor-pointer" onClick={() => setExpanded(isExp ? null : key)}>
                  <td className="px-4 py-3">
                    <div className={`flex items-center gap-2 font-semibold text-xs ${CHANNEL_COLORS[n.channel] || 'text-text-secondary'}`}>
                      {CHANNEL_ICONS[n.channel] || null} {n.channel}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${n.client ? cloudBadge[n.client.cloud] : 'badge'}`}>
                      {n.client_name.replace(' Internal','').replace(' Group','').replace(' Cotton','').replace(' Retail','')}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <span className="text-text-primary text-sm truncate block">{n.incident_title}</span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{n.recipients?.join(', ')}</td>
                  <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">{formatDistanceToNow(new Date(n.sent_at), { addSuffix: true })}</td>
                  <td className="px-4 py-3 max-w-xs">
                    <span className="text-text-secondary text-xs truncate block">{n.message_preview}</span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {isExp ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </td>
                </tr>,
                isExp && (
                  <tr key={`${key}-detail`} className="bg-surface2/40">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="text-text-muted text-xs font-semibold uppercase tracking-wide mb-1">Full message</div>
                      <p className="text-text-secondary text-sm">{n.message_preview}</p>
                      <div className="mt-2 text-text-muted text-xs">
                        Sent: {format(new Date(n.sent_at), 'dd MMM yyyy HH:mm:ss')} UTC · Recipients: {n.recipients?.join(', ')}
                      </div>
                    </td>
                  </tr>
                ),
              ].filter(Boolean)
            })}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="flex items-center justify-center h-32 text-text-muted text-sm">No notifications found</div>
        )}
      </div>
    </div>
  )
}
