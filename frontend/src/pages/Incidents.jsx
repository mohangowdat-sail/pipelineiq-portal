import { useState, useEffect, useRef, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  X, CheckCircle2, Search, ChevronDown, Mail, Zap, Sparkles,
  Bell, BellOff, Clock, AlertTriangle, Activity, MessageSquare, Send, Wand2, Bot,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useOutletContext } from 'react-router-dom'
import { getAccessibleIncidents, getAccessibleClients, USERS, PATTERN_LABELS } from '../data/mockData'

const SEVERITY_OPTS = ['', 'critical', 'warning', 'info']
const STATUS_OPTS   = ['', 'open', 'investigating', 'resolved']
const PATTERN_OPTS  = ['', 'schema_drift', 'null_constraint', 'volume_anomaly', 'dependency_violation', 'referential_integrity', 'scd_explosion', 'auth_failure', 'timeout', 'config_drift']

const ETR = {
  schema_drift: '2–4 hrs', null_constraint: '1–3 hrs', volume_anomaly: '1.5–4 hrs',
  dependency_violation: '2–6 hrs', referential_integrity: '2–5 hrs', scd_explosion: '4–8 hrs',
  auth_failure: '30–90 min', timeout: '1–3 hrs', config_drift: '45–120 min',
}

const CHANNEL_ICONS = {
  Slack: <Zap  size={12} className="text-accent"  />,
  Email: <Mail size={12} className="text-oracle"  />,
}

const incId     = (id) => `INC-${String(id).padStart(4, '0')}`
const shortName = (n) => n.replace(' Internal','').replace(' Group','').replace(' Cotton','').replace(' Retail','')

function getEngineersForClient(clientName) {
  return Object.values(USERS)
    .filter(u => u.client_access.includes('__all__') || u.client_access.includes(clientName))
    .sort((a, b) => a.name.localeCompare(b.name))
}

function loadLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v) } catch { return fallback }
}
function saveLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

function randomInterval() {
  return (2 + Math.random() * 3) * 60 * 60 * 1000
}

export default function Incidents() {
  const { user } = useAuth()
  const { activeClient } = useOutletContext() || {}
  const isDemoUser = user?.username === 'mohan' || user?.username === 'keerthana'

  const [incidents,    setIncidents]    = useState([])
  const [selectedId,   setSelectedId]   = useState(null)
  const [filters,      setFilters]      = useState({ client: '', severity: '', status: '', pattern: '', search: '' })
  const [assignTarget, setAssignTarget] = useState('')
  const [alertStatus,  setAlertStatus]  = useState({})

  // ── AI incident DB — persisted array, max 20 ──────────────────────────────
  const [aiIncidents, setAiIncidents] = useState(() => loadLS('piq_incident_db', []))
  const [generating,  setGenerating]  = useState(false)
  const [toast,       setToast]       = useState(null)

  // ── Chat ──────────────────────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput,    setChatInput]    = useState('')
  const [chatLoading,  setChatLoading]  = useState(false)
  const chatBottomRef = useRef(null)

  // ── Slack auto-alert toggle ────────────────────────────────────────────────
  const [slackAuto, setSlackAutoState] = useState(() => loadLS('piq_slackAuto', true))
  const slackAutoRef = useRef(slackAuto)
  useEffect(() => { slackAutoRef.current = slackAuto }, [slackAuto])
  const setSlackAuto = (val) => {
    const next = typeof val === 'function' ? val(slackAuto) : val
    setSlackAutoState(next)
    saveLS('piq_slackAuto', next)
  }

  // ── Live timer ─────────────────────────────────────────────────────────────
  const [secSinceUpdate, setSecSinceUpdate] = useState(0)
  const lastPollRef = useRef(Date.now())

  const clients      = getAccessibleClients(user)
  const canSendAlert = ['admin', 'founder', 'senior_engineer'].includes(user?.role)

  // ── Reset chat when switching incidents ───────────────────────────────────
  useEffect(() => {
    setChatMessages([])
    setChatInput('')
  }, [selectedId])

  // ── Auto-scroll chat ──────────────────────────────────────────────────────
  useEffect(() => {
    if (chatBottomRef.current) chatBottomRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, chatLoading])

  // ── Merge AI incidents into display list ──────────────────────────────────
  const mergeAI = useCallback((base) => {
    if (!aiIncidents.length) return base
    const accessible = getAccessibleClients(user).map(c => c.name)
    const validAI = aiIncidents.filter(ai => accessible.includes(ai.client_name))
    const aiIds = new Set(validAI.map(ai => ai.id))
    const baseWithoutAI = base.filter(i => !i._ai_generated && !aiIds.has(i.id))
    return [...validAI, ...baseWithoutAI]
  }, [user, aiIncidents])

  // ── Poll every 20s ────────────────────────────────────────────────────────
  useEffect(() => {
    const refresh = () => {
      lastPollRef.current = Date.now()
      setSecSinceUpdate(0)
      setIncidents(mergeAI(getAccessibleIncidents(user)))
    }
    refresh()
    const t = setInterval(refresh, 20000)
    return () => clearInterval(t)
  }, [user, mergeAI])

  useEffect(() => {
    const t = setInterval(() => setSecSinceUpdate(Math.round((Date.now() - lastPollRef.current) / 1000)), 1000)
    return () => clearInterval(t)
  }, [])

  // ── Add to incident DB ────────────────────────────────────────────────────
  const addToIncidentDB = useCallback((incident) => {
    setAiIncidents(prev => {
      const deduped  = prev.filter(i => i.id !== incident.id)
      const updated  = [incident, ...deduped].slice(0, 20)
      saveLS('piq_incident_db', updated)
      return updated
    })
  }, [])

  // ── Send Slack alert helper ───────────────────────────────────────────────
  const sendSlackForIncident = useCallback(async (incident, sentBy) => {
    const engineers = getEngineersForClient(incident.client_name)
    await fetch('/api/send-slack-alert', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        incident,
        incidentId: incId(incident.id),
        engineers:  engineers.map(e => ({ username: e.username, name: e.name })),
        sentBy,
      }),
    }).catch(() => {})
  }, [])

  // ── AI generation ─────────────────────────────────────────────────────────
  const generateAIIncident = useCallback(async ({ isDemo = false } = {}) => {
    if (generating) return
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-incident', { method: 'POST' })
      if (!res.ok) return
      const { incident } = await res.json()
      if (!incident) return

      saveLS('piq_aiNextGen', Date.now() + randomInterval())
      addToIncidentDB(incident)

      setToast({
        title: isDemo ? 'Demo incident generated' : 'New incident detected',
        body:  incident.title,
        type:  incident.severity,
        slack: slackAutoRef.current,
      })
      setTimeout(() => setToast(null), 6000)

      if (slackAutoRef.current) {
        const sentBy = isDemo ? `${user?.name} (demo)` : 'PipelineIQ AI Monitor (auto)'
        sendSlackForIncident(incident, sentBy)
      }
    } catch { } finally {
      setGenerating(false)
    }
  }, [generating, addToIncidentDB, sendSlackForIncident, user])

  // Check every 60s if it's time to auto-generate
  useEffect(() => {
    const check = () => {
      const nextGen = loadLS('piq_aiNextGen', 0)
      if (Date.now() >= nextGen) generateAIIncident()
    }
    check()
    const t = setInterval(check, 60000)
    return () => clearInterval(t)
  }, [generateAIIncident])

  // Sync sidebar client filter
  useEffect(() => {
    setFilters(f => ({ ...f, client: activeClient?.name || '' }))
  }, [activeClient?.name])

  const selected = incidents.find(i => i.id === selectedId)

  useEffect(() => {
    if (selected) setAssignTarget(selected.assigned_to || user?.username || '')
  }, [selectedId, selected?.assigned_to])

  // Filtered + sorted by recency
  const filtered = incidents.filter(i => {
    if (filters.client   && i.client_name !== filters.client)   return false
    if (filters.severity && i.severity    !== filters.severity)  return false
    if (filters.status   && i.status      !== filters.status)    return false
    if (filters.pattern  && i.pattern_tag !== filters.pattern)   return false
    if (filters.search   &&
        !i.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !i.pipeline_name.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const openCount = incidents.filter(i => i.status !== 'resolved').length

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleAssign = (id, target) => {
    if (!target) return
    const updater = (i) => i.id === id ? {
      ...i, status: 'investigating', assigned_to: target,
      people_involved: [...(i.people_involved || []), target].filter((v, k, a) => a.indexOf(v) === k),
    } : i
    setIncidents(prev => prev.map(updater))
    if (selected?._ai_generated) {
      setAiIncidents(prev => {
        const updated = prev.map(updater)
        saveLS('piq_incident_db', updated)
        return updated
      })
    }
  }

  const handleResolve = (id) => {
    const now = new Date()
    const updater = (i) => i.id === id ? {
      ...i, status: 'resolved', resolved_at: now.toISOString(),
      resolution_time_minutes: Math.round((now - new Date(i.created_at)) / 60000),
    } : i
    setIncidents(prev => prev.map(updater))
    if (selected?._ai_generated) {
      setAiIncidents(prev => {
        const updated = prev.map(updater)
        saveLS('piq_incident_db', updated)
        return updated
      })
    }
  }

  const handleSendAlert = async (inc) => {
    setAlertStatus(prev => ({ ...prev, [inc.id]: 'sending' }))
    try {
      const res = await fetch('/api/send-slack-alert', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident:   inc,
          incidentId: incId(inc.id),
          engineers:  getEngineersForClient(inc.client_name).map(e => ({ username: e.username, name: e.name })),
          sentBy:     user?.name,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unknown error')
      setAlertStatus(prev => ({ ...prev, [inc.id]: 'sent' }))
    } catch (err) {
      setAlertStatus(prev => ({ ...prev, [inc.id]: `error:${err.message}` }))
    }
  }

  // ── AI chat ────────────────────────────────────────────────────────────────
  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading || !selected) return
    const userMsg    = { role: 'user', content: chatInput.trim() }
    const newHistory = [...chatMessages, userMsg]
    setChatMessages(newHistory)
    setChatInput('')
    setChatLoading(true)
    try {
      const res = await fetch('/api/chat-incident', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident: selected, messages: newHistory }),
      })
      const data = await res.json()
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply || data.error || 'No response received.',
      }])
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Connection error — please try again.' }])
    } finally {
      setChatLoading(false)
    }
  }

  // ── Style helpers ──────────────────────────────────────────────────────────
  const cloudBadge     = { Azure: 'cloud-azure', AWS: 'cloud-aws', 'Oracle Cloud': 'cloud-oracle' }
  const severityBorder = { critical: 'border-l-critical', warning: 'border-l-warning', info: 'border-l-border' }
  const severityGlow   = { critical: 'shadow-[inset_0_0_0_1px_rgba(239,68,68,0.15)]', warning: 'shadow-[inset_0_0_0_1px_rgba(245,158,11,0.12)]', info: '' }
  const clientMap      = Object.fromEntries(clients.map(c => [c.name, c]))

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 w-80 animate-slide-in bg-surface border rounded-xl px-4 py-3.5 shadow-xl
          ${toast.type === 'critical' ? 'border-critical/30' : 'border-warning/30'}`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
                  ${toast.type === 'critical' ? 'bg-critical' : 'bg-warning'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2
                  ${toast.type === 'critical' ? 'bg-critical' : 'bg-warning'}`} />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-text-primary mb-0.5 flex items-center gap-1.5">
                <Sparkles size={10} className="text-accent flex-shrink-0" />
                {toast.title}
              </div>
              <p className="text-[11px] text-text-secondary leading-snug line-clamp-2">{toast.body}</p>
              {toast.slack && (
                <div className="text-[10px] text-accent mt-1.5 flex items-center gap-1">
                  <Zap size={9} /> Sent to Slack
                </div>
              )}
            </div>
            <button onClick={() => setToast(null)} className="text-text-muted hover:text-text-primary flex-shrink-0">
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* ── Live status bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border bg-surface flex-shrink-0">
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-healthy opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-healthy" />
            </span>
            <span className="text-healthy font-semibold tracking-widest text-[10px] uppercase">Live</span>
          </div>
          <span className="text-border">·</span>
          <span className="text-text-secondary">
            <span className="text-text-primary font-semibold">{openCount}</span> open
          </span>
          <span className="text-border">·</span>
          <span className="text-text-muted flex items-center gap-1">
            <Clock size={9} /> {secSinceUpdate}s ago
          </span>
          {generating && (
            <>
              <span className="text-border">·</span>
              <span className="text-accent flex items-center gap-1 text-[10px]">
                <Sparkles size={9} className="animate-pulse" /> Generating…
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Demo generate + Slack — mohan and keerthana only */}
          {isDemoUser && (
            <button
              onClick={() => generateAIIncident({ isDemo: true })}
              disabled={generating}
              title="Generate AI incident and send Slack alert (demo)"
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-border bg-surface2 text-text-muted hover:text-accent hover:border-accent/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              <Wand2 size={12} />
            </button>
          )}

          {/* Slack auto-alert toggle */}
          <button
            onClick={() => setSlackAuto(v => !v)}
            title={slackAuto ? 'Auto Slack alerts ON — click to disable' : 'Auto Slack alerts OFF — click to enable'}
            className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-medium transition-all duration-200
              ${slackAuto
                ? 'bg-accent/10 border-accent/25 text-accent hover:bg-accent/15'
                : 'bg-surface2 border-border text-text-muted hover:text-text-secondary'
              }`}>
            {slackAuto ? <><Bell size={11} /> Slack auto-alerts on</> : <><BellOff size={11} /> Slack auto-alerts off</>}
          </button>
        </div>
      </div>

      {/* ── Main area ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left — incident list ─────────────────────────────────────────── */}
        <div className={`flex flex-col ${selected ? 'w-[42%]' : 'w-full'} border-r border-border transition-all duration-200 min-w-0 flex-shrink-0`}>

          {/* Filters */}
          <div className="p-3 border-b border-border space-y-2 flex-shrink-0 bg-surface">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                placeholder="Search incidents or pipelines…"
                className="w-full bg-surface2 border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { key: 'client',   opts: ['All clients',   ...clients.map(c => c.name)],                          values: ['', ...clients.map(c => c.name)] },
                { key: 'severity', opts: ['Severity',      'Critical', 'Warning', 'Info'],                         values: SEVERITY_OPTS },
                { key: 'status',   opts: ['Status',        'Open', 'Investigating', 'Resolved'],                   values: STATUS_OPTS },
                { key: 'pattern',  opts: ['Pattern',       ...PATTERN_OPTS.slice(1).map(p => PATTERN_LABELS[p])], values: PATTERN_OPTS },
              ].map(({ key, opts, values }) => (
                <div key={key} className="relative">
                  <select
                    value={filters[key]}
                    onChange={e => setFilters(f => ({ ...f, [key]: values[e.target.selectedIndex] }))}
                    className="w-full appearance-none bg-surface2 border border-border rounded-lg px-2 py-1.5 text-[11px] text-text-secondary focus:outline-none focus:border-accent/50 pr-5 truncate cursor-pointer">
                    {opts.map((o, i) => <option key={i} value={values[i]}>{o}</option>)}
                  </select>
                  <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
              ))}
            </div>
            <div className="text-text-muted text-[11px]">{filtered.length} incident{filtered.length !== 1 ? 's' : ''}</div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map(inc => {
              const cl       = clientMap[inc.client_name]
              const isActive = selectedId === inc.id
              const isHot    = inc.status !== 'resolved' && inc.severity === 'critical'
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedId(inc.id === selectedId ? null : inc.id)}
                  className={`border-b border-border px-4 py-3 cursor-pointer transition-all border-l-2 group
                    ${isActive
                      ? `bg-surface2 ${severityBorder[inc.severity]} ${severityGlow[inc.severity]}`
                      : `hover:bg-surface2/50 ${isHot ? 'border-l-critical/40' : 'border-l-transparent'}`
                    }`}>
                  <div className="flex items-start gap-2 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 min-w-0">
                        <span className="text-text-muted text-[10px] font-mono tracking-wider flex-shrink-0">{incId(inc.id)}</span>
                        <span className={`badge text-[10px] flex-shrink-0 ${cl ? cloudBadge[cl.cloud] : ''}`}>
                          {shortName(inc.client_name)}
                        </span>
                        {inc._ai_generated && (
                          <span className="flex items-center gap-0.5 text-[9px] font-semibold text-accent bg-accent/10 border border-accent/20 rounded-full px-1.5 py-0.5 flex-shrink-0">
                            <Sparkles size={8} /> AI
                          </span>
                        )}
                        <span className="text-text-muted text-[10px] ml-auto flex-shrink-0 tabular-nums">
                          {formatDistanceToNow(new Date(inc.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="text-text-primary text-sm font-medium leading-snug truncate mb-1.5">{inc.title}</div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-text-muted text-[10px] truncate flex-1 min-w-0">{inc.pipeline_name}</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className={`badge text-[10px] severity-${inc.severity}`}>{inc.severity}</span>
                          <span className={`badge text-[10px] status-${inc.status}`}>{inc.status}</span>
                        </div>
                      </div>
                    </div>
                    {inc.assigned_to ? (
                      <div title={USERS[inc.assigned_to]?.name}
                        className="w-6 h-6 rounded-full bg-accent/15 border border-accent/25 text-accent text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {USERS[inc.assigned_to]?.initials || '?'}
                      </div>
                    ) : (
                      <div className={`w-6 h-6 rounded-full border flex-shrink-0 mt-0.5
                        ${isHot ? 'border-critical/30 animate-pulse' : 'border-dashed border-border'}`} />
                    )}
                  </div>
                </div>
              )
            })}
            {!filtered.length && (
              <div className="flex flex-col items-center justify-center h-48 text-text-muted">
                <CheckCircle2 size={28} className="mb-2 text-healthy opacity-25" />
                <div className="text-sm">No incidents match your filters</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right — detail panel ─────────────────────────────────────────── */}
        {selected && (
          <div className="flex-1 flex flex-col overflow-hidden min-w-0 animate-slide-in">

            {/* Severity accent bar */}
            <div className={`h-0.5 flex-shrink-0 ${
              selected.severity === 'critical' ? 'bg-critical' :
              selected.severity === 'warning'  ? 'bg-warning'  : 'bg-border'
            }`} />

            {/* Sticky header */}
            <div className="flex-shrink-0 px-5 py-3 border-b border-border bg-surface/95 backdrop-blur-sm flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-text-muted text-[11px] font-mono font-semibold tracking-widest flex-shrink-0">{incId(selected.id)}</span>
                  <span className={`badge severity-${selected.severity}`}>{selected.severity}</span>
                  <span className={`badge status-${selected.status}`}>{selected.status}</span>
                  <span className="badge bg-surface2 border border-border text-text-muted text-[10px]">
                    {(selected.pattern_tag || '').replace(/_/g, ' ')}
                  </span>
                  {selected._ai_generated && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-accent bg-accent/10 border border-accent/20 rounded-full px-2 py-0.5">
                      <Sparkles size={9} /> AI Generated
                    </span>
                  )}
                </div>
                <h2 className="text-text-primary font-semibold text-sm leading-snug">{selected.title}</h2>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="flex-shrink-0 p-1 rounded-md hover:bg-surface2 text-text-muted hover:text-text-primary transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-bg">

              {/* Key metrics */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Client',      value: selected.client_name },
                  { label: 'Pipeline',    value: selected.pipeline_name },
                  { label: 'Environment', value: selected.environment },
                  { label: 'ETR',         value: ETR[selected.pattern_tag] || 'TBD', highlight: true },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className={`bg-surface border rounded-xl p-3 ${highlight ? 'border-accent/20' : 'border-border'}`}>
                    <div className="text-text-muted text-[9px] uppercase tracking-widest mb-1">{label}</div>
                    <div className={`text-xs font-semibold leading-snug ${highlight ? 'text-accent' : 'text-text-primary'}`}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Second row */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Cloud Service', selected.cloud_service],
                  ['Opened', formatDistanceToNow(new Date(selected.created_at), { addSuffix: true })],
                ].map(([label, value]) => (
                  <div key={label} className="bg-surface border border-border rounded-xl p-3">
                    <div className="text-text-muted text-[9px] uppercase tracking-widest mb-1">{label}</div>
                    <div className="text-text-primary text-xs font-medium">{value}</div>
                  </div>
                ))}
              </div>

              {/* Resolution timeline */}
              {selected.status === 'resolved' && selected.resolution_time_minutes && (
                <div className="bg-surface border border-healthy/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity size={12} className="text-healthy" />
                    <div className="text-text-muted text-[9px] uppercase tracking-widest">Resolution Timeline</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-critical" />
                      <div className="w-0.5 h-8 bg-border" />
                      <div className="w-2 h-2 rounded-full bg-healthy" />
                    </div>
                    <div className="flex flex-col justify-between h-12">
                      <div className="text-[11px] text-text-secondary">Incident opened</div>
                      <div className="text-[11px] text-healthy font-semibold">Resolved in {selected.resolution_time_minutes} min</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Root cause */}
              <div className="bg-surface border border-border rounded-xl p-4">
                <div className="text-text-muted text-[9px] uppercase tracking-widest mb-2">Root Cause Analysis</div>
                <p className="text-text-secondary text-xs leading-relaxed">{selected.root_cause}</p>
              </div>

              {/* Resolution steps */}
              {selected.suggested_steps?.length > 0 && (
                <div className="bg-surface border border-border rounded-xl p-4">
                  <div className="text-text-muted text-[9px] uppercase tracking-widest mb-3">Resolution Steps</div>
                  <ol className="space-y-3">
                    {selected.suggested_steps.map((step, i) => {
                      const hasCode = /`[^`]+`|aws |az |ggsci|SELECT|ALTER|UPDATE|INSERT|python |spark/.test(step)
                      return (
                        <li key={i} className="flex gap-3">
                          <span className="w-5 h-5 rounded-full bg-accent/15 text-accent text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                            {i + 1}
                          </span>
                          <span className={`text-xs leading-relaxed ${hasCode ? 'text-text-primary font-mono text-[11px]' : 'text-text-secondary'}`}>
                            {step}
                          </span>
                        </li>
                      )
                    })}
                  </ol>
                </div>
              )}

              {/* Services impacted */}
              {selected.services_impacted?.length > 0 && (
                <div className="bg-surface border border-border rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle size={11} className="text-warning" />
                    <div className="text-text-muted text-[9px] uppercase tracking-widest">Services Impacted</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.services_impacted.map(s => (
                      <span key={s} className="badge severity-critical text-[10px]">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI chat */}
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface2/30">
                  <Bot size={12} className="text-accent flex-shrink-0" />
                  <span className="text-text-muted text-[9px] uppercase tracking-widest flex-1">Ask about this incident</span>
                  <span className="text-text-muted text-[9px]">{selected.client_name}</span>
                </div>

                {/* Messages */}
                <div className="px-4 py-3 space-y-2.5 max-h-56 overflow-y-auto">
                  {chatMessages.length === 0 && (
                    <p className="text-text-muted text-[11px] leading-relaxed">
                      Ask about the root cause, steps, or anything specific to this incident and {selected.client_name}'s architecture. The AI knows the client stack.
                    </p>
                  )}
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {m.role === 'assistant' && (
                        <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot size={9} className="text-accent" />
                        </div>
                      )}
                      <div className={`max-w-[84%] rounded-lg px-3 py-2 text-[11px] leading-relaxed whitespace-pre-wrap
                        ${m.role === 'user'
                          ? 'bg-accent/15 border border-accent/20 text-text-primary'
                          : 'bg-surface2 border border-border text-text-secondary'
                        }`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0">
                        <Bot size={9} className="text-accent" />
                      </div>
                      <div className="bg-surface2 border border-border rounded-lg px-3 py-2.5 flex gap-1 items-center">
                        {[0, 150, 300].map(d => (
                          <span key={d} className="w-1 h-1 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input */}
                <div className="px-3 pb-3">
                  <div className="flex gap-0 bg-surface2 border border-border rounded-lg overflow-hidden focus-within:border-accent/40 transition-colors">
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
                      placeholder="Ask a question about this incident…"
                      disabled={chatLoading}
                      className="flex-1 bg-transparent px-3 py-2 text-[12px] text-text-primary placeholder-text-muted focus:outline-none min-w-0"
                    />
                    <button
                      onClick={sendChat}
                      disabled={!chatInput.trim() || chatLoading}
                      className="px-3 py-2 text-accent hover:text-accent-light disabled:text-text-muted disabled:cursor-not-allowed transition-colors flex-shrink-0 border-l border-border">
                      <Send size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Assignment */}
              <div className="bg-surface border border-border rounded-xl p-4">
                <div className="text-text-muted text-[9px] uppercase tracking-widest mb-3">Assignment</div>
                {selected.status === 'resolved' ? (
                  <div className="flex items-center gap-2 text-healthy">
                    <CheckCircle2 size={15} />
                    <div>
                      <div className="text-xs font-semibold">Resolved</div>
                      <div className="text-[10px] text-text-muted">in {selected.resolution_time_minutes} min</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selected.assigned_to && (
                      <div className="flex items-center gap-2.5 bg-surface2 border border-border rounded-lg px-3 py-2">
                        <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/25 text-accent text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {USERS[selected.assigned_to]?.initials || '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] text-text-muted leading-none mb-0.5">Currently assigned</div>
                          <div className="text-xs font-medium text-text-primary truncate">
                            {USERS[selected.assigned_to]?.name || selected.assigned_to}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <select
                          value={assignTarget}
                          onChange={e => setAssignTarget(e.target.value)}
                          className="w-full appearance-none bg-surface2 border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent/50 pr-6 cursor-pointer">
                          <option value="">Select engineer…</option>
                          {getEngineersForClient(selected.client_name).map(e => (
                            <option key={e.username} value={e.username}>
                              {e.name}{e.username === user?.username ? ' (you)' : ''}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                      </div>
                      <button
                        onClick={() => handleAssign(selected.id, assignTarget)}
                        disabled={!assignTarget}
                        className="btn-primary px-4 text-xs flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed">
                        Assign
                      </button>
                    </div>
                    {selected.assigned_to === user?.username && (
                      <button
                        onClick={() => handleResolve(selected.id)}
                        className="w-full py-2 px-4 rounded-lg bg-healthy/10 border border-healthy/20 text-healthy text-xs font-semibold hover:bg-healthy/20 transition-colors active:scale-95">
                        Mark as Resolved
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Slack alert */}
              {canSendAlert && (
                <div className="bg-surface border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-text-muted text-[9px] uppercase tracking-widest">Slack Alert</div>
                      <div className="text-text-muted text-[10px] mt-0.5">
                        #pipeline-alerts · root cause + resolution steps
                        {slackAuto && <span className="text-accent ml-1">· auto on</span>}
                      </div>
                    </div>
                    {alertStatus[selected.id] === 'sent' && (
                      <span className="text-healthy text-[10px] font-semibold flex items-center gap-1">
                        <CheckCircle2 size={11} /> Sent
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleSendAlert(selected)}
                    disabled={alertStatus[selected.id] === 'sending' || alertStatus[selected.id] === 'sent'}
                    className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold transition-all active:scale-95
                      ${alertStatus[selected.id] === 'sent'
                        ? 'bg-healthy/10 border border-healthy/20 text-healthy cursor-default'
                        : alertStatus[selected.id] === 'sending'
                        ? 'bg-surface2 border border-border text-text-muted cursor-wait'
                        : 'bg-accent hover:bg-accent-light border border-accent/40 text-white'
                      }`}>
                    {alertStatus[selected.id] === 'sending' ? 'Sending…'
                      : alertStatus[selected.id] === 'sent'  ? 'Alert sent to Slack'
                      : 'Send Alert to Slack'}
                  </button>
                  {(alertStatus[selected.id] || '').startsWith('error:') && (
                    <div className="mt-2 text-critical text-[10px] leading-snug">{alertStatus[selected.id].slice(6)}</div>
                  )}
                </div>
              )}

              {/* People involved */}
              {selected.people_involved?.length > 0 && (
                <div className="bg-surface border border-border rounded-xl p-4">
                  <div className="text-text-muted text-[9px] uppercase tracking-widest mb-2">People Involved</div>
                  <div className="flex flex-wrap gap-2">
                    {selected.people_involved.map(u => (
                      <div key={u} className="flex items-center gap-1.5 bg-surface2 border border-border rounded-full px-2.5 py-1">
                        <div className="w-4 h-4 rounded-full bg-accent/15 text-accent text-[8px] font-bold flex items-center justify-center flex-shrink-0">
                          {USERS[u]?.initials || u[0]?.toUpperCase()}
                        </div>
                        <span className="text-text-secondary text-[11px]">{USERS[u]?.name || u}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notification history */}
              {selected.notification_log?.length > 0 && (
                <div className="bg-surface border border-border rounded-xl p-4">
                  <div className="text-text-muted text-[9px] uppercase tracking-widest mb-3">Notification History</div>
                  <div className="space-y-2">
                    {selected.notification_log.map((n, i) => (
                      <div key={i} className="flex items-start gap-2.5 bg-surface2 border border-border rounded-lg p-2.5">
                        <div className="mt-0.5 flex-shrink-0">
                          {CHANNEL_ICONS[n.channel] || <Mail size={12} className="text-text-muted" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-text-primary text-[11px] font-semibold flex-shrink-0">{n.channel}</span>
                            <span className="text-text-muted text-[10px] truncate">→ {n.recipients.join(', ')}</span>
                            <span className="text-text-muted text-[10px] ml-auto flex-shrink-0 tabular-nums">
                              {formatDistanceToNow(new Date(n.sent_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-text-muted text-[11px] leading-snug">{n.message_preview}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  )
}
