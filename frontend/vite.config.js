import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function readBackendEnv() {
  try {
    const raw = fs.readFileSync(path.resolve(__dirname, '../backend/.env'), 'utf-8')
    return Object.fromEntries(
      raw.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#') && line.includes('='))
        .map(line => { const idx = line.indexOf('='); return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()] })
    )
  } catch { return {} }
}

// ── Pattern intelligence (mirrors send-slack-alert.js) ──────────────────────
const PATTERN_META = {
  schema_drift:         { label: 'Schema Drift',                  error_codes: ['SCHEMA_VALIDATION_FAILED','ADF-COPY-SCHEMA-MISMATCH-001','COLUMN_DELTA_DETECTED'],       confidence: 'high',   etr: [120,240], failure_stage: 'Schema Validation / Copy Activity — sink table DDL mismatch with source schema',               diagnosis: 'A structural change was made to the source schema (new/renamed/dropped columns or type change) without a coordinated DDL update on the sink side. The pipeline\'s copy or load activity performs a schema check at execution start and hard-stops on any delta.' },
  null_constraint:      { label: 'Null Constraint Violation',     error_codes: ['SQL-23000: NOT NULL CONSTRAINT VIOLATION','INSERT_REJECTED_NULL_COLUMN','DATA_QUALITY_GATE_FAILED'], confidence: 'high', etr: [60,180],  failure_stage: 'Data Load / Insertion Layer — NOT NULL constraint enforcement on target table',                    diagnosis: 'Source data contains NULL values in one or more columns that carry a NOT NULL constraint at the destination. This typically indicates incomplete upstream data extraction, a missing default value handling rule, or a new mandatory field added to the source system without a corresponding migration on the pipeline.' },
  dependency_violation: { label: 'Dependency Violation',          error_codes: ['PARTITION_NOT_READY','UPSTREAM_DELAY_THRESHOLD_EXCEEDED','EMPTY_DELTA_READ_DETECTED'],    confidence: 'medium', etr: [120,360], failure_stage: 'Trigger / Orchestration Layer — upstream partition or table not available at scheduled execution time', diagnosis: 'A downstream job executed before its upstream dependency completed, resulting in reads against an empty or incomplete partition. Commonly caused by cluster cold-starts, unexpected upstream run duration spikes, or missing dependency gating in the orchestration layer.' },
  volume_anomaly:       { label: 'Volume Anomaly',                error_codes: ['ROW_COUNT_DEVIATION_EXCEEDS_3SIGMA','VOLUME_THRESHOLD_BREACH','ANOMALY_DETECTOR_TRIGGERED'], confidence: 'medium', etr: [90,240],  failure_stage: 'Data Quality Gate — row count or byte volume outside expected statistical bounds',                  diagnosis: 'The pipeline processed a data volume that deviates significantly (>3σ) from the rolling 30-day baseline. May indicate a source system bulk operation, backfill, truncation event, or genuine data loss upstream. Root cause requires distinguishing between expected volume spikes and data integrity issues.' },
  referential_integrity:{ label: 'Referential Integrity Violation',error_codes: ['FK_CONSTRAINT_VIOLATION','ORPHANED_RECORD_DETECTED','REFERENTIAL_CHECK_FAILED'],         confidence: 'high',   etr: [120,300], failure_stage: 'Relational Load Layer — foreign key constraint enforcement at target',                              diagnosis: 'Child records are being inserted before their parent records exist in the target, or parent records have been deleted while child records remain. Typically caused by load ordering issues in multi-table pipelines, out-of-order CDC events, or missing upsert logic for parent entities.' },
  scd_explosion:        { label: 'SCD Type-2 Explosion',          error_codes: ['SCD_TYPE2_CARDINALITY_BREACH','DIMENSION_ROW_COUNT_ANOMALY','MERGE_FANOUT_DETECTED'],      confidence: 'medium', etr: [240,480], failure_stage: 'Dimension Processing Layer — SCD Type-2 merge producing runaway row generation',                  diagnosis: 'The SCD Type-2 merge logic is generating an abnormally high number of new version rows, indicating that a source column used as the change-detection key is fluctuating with every load (e.g. a timestamp, floating-point, or computed field). This causes table cardinality explosion and downstream aggregation failures.' },
  auth_failure:         { label: 'Authentication Failure',        error_codes: ['HTTP_401_UNAUTHORIZED','TOKEN_EXPIRED_OR_REVOKED','SERVICE_PRINCIPAL_AUTH_FAILED'],        confidence: 'low',    etr: [30,90],   failure_stage: 'Connection / Authentication Layer — credential validation failure at service endpoint',            diagnosis: 'The pipeline service principal, API token, or managed identity failed to authenticate against a dependent service. Could be token expiry, a secret rotation not propagated to the pipeline config, a permission scope change, or an IP allowlist update on the target service.' },
  timeout:              { label: 'Pipeline Timeout',              error_codes: ['PIPELINE_TIMEOUT_EXCEEDED','JOB_DURATION_LIMIT_HIT','ACTIVITY_TIMEOUT_ERR'],              confidence: 'low',    etr: [60,180],  failure_stage: 'Execution Layer — job or activity exceeded maximum allowed run duration',                         diagnosis: 'The pipeline run exceeded its configured timeout threshold. May be caused by a data volume spike, degraded source/sink performance, lock contention, resource contention on the compute cluster, or a logic regression causing an unbounded loop or inefficient query plan.' },
  config_drift:         { label: 'Configuration Drift',           error_codes: ['CONFIG_HASH_MISMATCH','ENV_CONFIG_DELTA_DETECTED','PARAMETER_VALIDATION_FAILED'],         confidence: 'low',    etr: [45,120],  failure_stage: 'Initialisation Layer — runtime config diverges from expected baseline',                           diagnosis: 'A configuration value (connection string, parameter file, environment variable, or linked service definition) has drifted from the last known-good state. Often caused by a manual edit outside the deployment pipeline, a failed promotion, or a secrets vault update that altered a dependent value.' },
}
const CONFIDENCE_LABEL = {
  high:   '🟢 High — single clear resolution path identified',
  medium: '🟡 Medium — 2–3 probable causes; diagnostic branching recommended',
  low:    '🔴 Low — multiple unknowns; parallel investigation tracks advised',
}

function fmtDate(ts) {
  if (!ts) return 'Unknown'
  try { return new Date(ts).toLocaleString('en-GB', { timeZone:'UTC', day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) + ' UTC' } catch { return ts }
}
function elapsed(ts) {
  if (!ts) return ''
  const m = Math.round((Date.now() - new Date(ts).getTime()) / 60000)
  if (m < 60) return `${m}m`; if (m < 1440) return `${Math.floor(m/60)}h ${m%60}m`; return `${Math.floor(m/1440)}d ${Math.floor((m%1440)/60)}h`
}
function etrLabel(tag) {
  const m = PATTERN_META[tag]; if (!m) return 'Undetermined'
  const [lo, hi] = m.etr; return lo < 60 ? `${lo}–${hi} minutes` : `${Math.round(lo/60)}–${Math.round(hi/60)} hours`
}
function section(text)  { return { type:'section', text:{ type:'mrkdwn', text } } }
function divider()      { return { type:'divider' } }
function header(text)   { return { type:'header', text:{ type:'plain_text', text, emoji:true } } }

function buildBlocks({ incident: inc, incidentId, engineers, sentBy }) {
  const meta       = PATTERN_META[inc.pattern_tag] || {}
  const sev        = (inc.severity||'info').toLowerCase()
  const sevEmoji   = sev==='critical'?'🔴':sev==='warning'?'🟡':'🔵'
  const confidence = meta.confidence||'low'
  const stepsArr   = inc.suggested_steps||[]
  const engineerList = (engineers||[]).length ? (engineers||[]).map(e=>`• *${e.name}*`).join('\n') : '• Not yet assigned'
  const servicesList = (inc.services_impacted||[]).length ? (inc.services_impacted||[]).map(s=>`\`${s}\``).join('  ·  ') : '`None identified`'
  const errorCodes = (meta.error_codes||['UNKNOWN_ERROR']).join('  |  ')

  let resolutionBlock
  if (confidence === 'high') {
    resolutionBlock = section(`*📋 Resolution Plan*  _(${CONFIDENCE_LABEL[confidence]})_\n\n` + stepsArr.map((s,i)=>`*Step ${i+1}:* ${s}`).join('\n\n'))
  } else {
    const half = Math.ceil(stepsArr.length/2)
    const pri = stepsArr.slice(0,half), sec = stepsArr.slice(half)
    resolutionBlock = section(
      `*📋 Resolution Plan*  _(${CONFIDENCE_LABEL[confidence]})_\n\n` +
      `*▶ Primary Track — investigate in order:*\n${pri.map((s,i)=>`*${i+1}.* ${s}`).join('\n')}\n\n` +
      `*▷ Secondary / Fallback Checks — if primary track yields no root cause:*\n${sec.map((s,i)=>`*${i+1+half}.* ${s}`).join('\n')}`
    )
  }

  return [
    header(`${sevEmoji} ${sev.toUpperCase()} · ${incidentId} · ${inc.client_name}`),
    section(`*${inc.title}*\nPipeline: \`${inc.pipeline_name}\`  ·  Env: \`${inc.environment}\`  ·  Branch: \`${inc.active_branch||'main'}\`  ·  Service: *${inc.cloud_service}*`),
    divider(),
    section(`*🔍 Failure Fingerprint*\n\n*Pattern:*          ${meta.label||inc.pattern_tag}\n*Error Codes:*    \`${errorCodes}\`\n*Failure Stage:*  ${meta.failure_stage||'Unknown'}\n*Detected:*        ${fmtDate(inc.created_at)}   _(${elapsed(inc.created_at)} ago)_\n*Status:*           ${(inc.status||'open').toUpperCase()}`),
    divider(),
    section(`*🧠 Technical Diagnosis — ${meta.label||inc.pattern_tag}*\n\n${meta.diagnosis||inc.root_cause||'No diagnosis available.'}\n\n*Explicit root cause on \`${inc.pipeline_name}\`:*\n> ${inc.root_cause||'See diagnosis above.'}`),
    divider(),
    resolutionBlock,
    divider(),
    section(`*⚡ Impact Assessment*\n\n*Directly Affected Services:*\n${servicesList}\n\n*Estimated Time to Resolution (ETR):*  *${etrLabel(inc.pattern_tag)}*\n_Based on historical resolution data for \`${meta.label||inc.pattern_tag}\` incidents in ${inc.cloud_service} environments._`),
    divider(),
    section(`*👥 Engineers — Engage Immediately*\n\n${engineerList}\n\n_All engineers listed have confirmed access to the \`${inc.client_name}\` environment._`),
    divider(),
    section(`*📄 Alert Report*\n\n*Sent by:*        ${sentBy||'PipelineIQ'}\n*Triggered:*    ${fmtDate(new Date().toISOString())}\n*Incident ID:*  \`${incidentId}\`\n*Client:*          ${inc.client_name}  ·  Cloud: *${(inc.cloud_service||'').split(' ')[0]}*\n*Environment:* \`${inc.environment}\`\n\n_This alert was generated by PipelineIQ — AI-native pipeline observability portal. Investigate via the PipelineIQ portal for full Slack thread history, run logs, and resolution workflow._`),
  ]
}

function slackAlertPlugin() {
  const env = readBackendEnv()
  const WEBHOOK_URL = env.SLACK_WEBHOOK_URL

  return {
    name: 'slack-alert-middleware',
    configureServer(server) {
      server.middlewares.use('/api/send-slack-alert', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return }
        if (req.method !== 'POST')    { res.writeHead(405); res.end(JSON.stringify({ error: 'Method not allowed' })); return }
        if (!WEBHOOK_URL)             { res.writeHead(503); res.end(JSON.stringify({ error: 'SLACK_WEBHOOK_URL is not configured' })); return }

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const payload_in = JSON.parse(body)
            const blocks   = buildBlocks(payload_in)
            const fallback = `${payload_in.incident?.severity?.toUpperCase()} [${payload_in.incidentId}] — ${payload_in.incident?.client_name}: ${payload_in.incident?.title}`
            const payload  = JSON.stringify({ text: fallback, blocks })
            const url = new URL(WEBHOOK_URL)
            const opts = { hostname: url.hostname, path: url.pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }

            const slackReq = https.request(opts, slackRes => {
              let data = ''
              slackRes.on('data', c => { data += c })
              slackRes.on('end', () => {
                if (slackRes.statusCode === 200) { res.writeHead(200); res.end(JSON.stringify({ ok: true, incidentId: payload_in.incidentId })) }
                else { res.writeHead(500); res.end(JSON.stringify({ error: `Slack returned ${slackRes.statusCode}: ${data}` })) }
              })
            })
            slackReq.on('error', err => { res.writeHead(500); res.end(JSON.stringify({ error: err.message })) })
            slackReq.write(payload)
            slackReq.end()
          } catch (err) { res.writeHead(400); res.end(JSON.stringify({ error: err.message })) }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), slackAlertPlugin()],
  server: { port: 5173 },
})
