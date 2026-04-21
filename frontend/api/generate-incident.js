import OpenAI from 'openai'

const CONTEXT = `
You are generating realistic data pipeline incidents for PipelineIQ, an AI-native pipeline observability portal for a data engineering consultancy.

CLIENT PORTFOLIOS:
- Spirax Group (Azure): pipelines include Customer Master Ingestion, Rebate Calculation Transform, Sales Analytics Pipeline, Pricing Snapshot Export, Finance ERP Connector, Revenue Attribution Model, Warranty Claims Ingest, Monthly Close Pipeline, Order Fulfilment Aggregate, Demand Forecast Pipeline
- Greaves Cotton (AWS): pipelines include Raw Orders Ingestion, Customer Transform Pipeline, Finance Daily Close, Product Catalogue Sync, Compliance Audit Export, ERP Integration Pipeline, Supplier Data Load, Warranty Data Pipeline
- CocoBlu Retail (AWS): pipelines include Retail Transaction Ingest, Customer Segmentation Load, Loyalty Programme Sync, POS Integration Pipeline, Finance Reconcile Pipeline, Inventory Reorder Monitor, Returns Processing Pipeline, Store Performance Pipeline
- GoldenSands (Oracle Cloud): pipelines include GoldenGate Replication, Financial Consolidation, Customer Dimension Load, BI Aggregation Pipeline, Regulatory Reporting Load, Transactions Archive, Data Warehouse Refresh
- Rotimatic (AWS): pipelines include IoT Telemetry Ingest, Device Health Aggregate, Recipe Analytics Pipeline, Predictive Maintenance Load, Baking Session Enrichment, Quality Monitoring Pipeline, Subscription Events Sync

CLOUD SERVICES BY PLATFORM:
- Azure: Azure Data Factory, Azure Databricks, Azure Synapse Analytics
- AWS: AWS Glue, AWS Step Functions, AWS Lambda
- Oracle Cloud: Oracle GoldenGate, Oracle Data Integrator

FAILURE PATTERNS:
- schema_drift: upstream schema change breaks sink table DDL
- null_constraint: NULL values rejected by NOT NULL constraint at target
- volume_anomaly: row count spike or drop outside 3σ baseline
- dependency_violation: downstream job executes before upstream completes
- referential_integrity: FK constraint violation due to load ordering or missing parent records
- scd_explosion: SCD Type-2 merge generates runaway version rows from volatile change-key column
- auth_failure: service principal / token / credential failure at connection time
- timeout: pipeline or job exceeded maximum execution duration
- config_drift: runtime configuration diverges from last-known-good baseline
`

const PROMPT = `${CONTEXT}

Generate ONE realistic production pipeline incident. Return ONLY valid JSON, no markdown, no explanation:

{
  "title": "<specific title naming the pipeline + error type + key detail, e.g. row count, table name, error code>",
  "client_name": "<one client from the list above>",
  "pipeline_name": "<pipeline matching that client>",
  "environment": "prod",
  "severity": "<critical or warning — critical if data loss/corruption, warning if degraded or delayed>",
  "cloud_service": "<matching cloud service for that client's platform>",
  "pattern_tag": "<one of the 9 patterns>",
  "active_branch": "main",
  "root_cause": "<3–4 technically precise sentences naming the exact pipeline, specific error message or code, the root technical cause, and downstream impact on dependent services>",
  "suggested_steps": [
    "<5–6 actionable steps; include exact CLI commands, SQL, or code snippets where relevant; be specific about tool, table, and parameter names>"
  ],
  "services_impacted": ["<3–4 specific downstream services or dashboards that are disrupted>"]
}

Rules:
- Title must include the pipeline name and a specific detail (e.g. '71% row drop', 'FK violation on store_id', 'token expired', error code)
- Root cause must name the specific pipeline, the actual failure mode, and what downstream consumers are affected
- Steps must be executable — include real CLI commands (az, aws, ggsci, spark, etc.), SQL, or Python where relevant
- Pick clients and patterns that feel varied — do not repeat the same pattern twice in a row
- Severity: critical if prod data is missing, corrupted, or a primary business process is blocked; warning otherwise`

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const apiKey = process.env.AZURE_OPENAI_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'AZURE_OPENAI_API_KEY is not configured' })

  const client = new OpenAI({
    baseURL: 'https://pipeline-iq-resource.services.ai.azure.com/api/projects/pipeline-iq/openai/v1/',
    apiKey,
  })

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-5.4-mini',
      messages: [{ role: 'user', content: PROMPT }],
      temperature: 0.88,
      max_completion_tokens: 1400,
    })

    const text = completion.choices[0].message.content.trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Model returned no JSON')

    const inc = JSON.parse(jsonMatch[0])

    // Validate required fields
    const required = ['title','client_name','pipeline_name','environment','severity','cloud_service','pattern_tag','root_cause','suggested_steps','services_impacted']
    for (const f of required) {
      if (!inc[f]) throw new Error(`Missing field: ${f}`)
    }

    // Stamp runtime fields
    inc.id             = 9000 + (Math.floor(Date.now() / 1000) % 1000) // stable-ish ID
    inc.status         = 'open'
    inc.created_at     = new Date().toISOString()
    inc.resolved_at    = null
    inc.resolution_time_minutes = null
    inc.assigned_to    = null
    inc.people_involved = []
    inc.slack_thread   = []
    inc.notification_log = []
    inc._ai_generated  = true

    return res.status(200).json({ incident: inc })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
