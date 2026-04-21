
// ── Client architecture personas ──────────────────────────────────────────────
const CLIENT_PERSONAS = {
  'Spirax Group': `
Spirax Group runs on Azure. Their data platform:
- Orchestration: Azure Data Factory (ADF) — copy activities, pipelines, triggers
- Compute: Azure Databricks (Spark notebooks, Delta Lake)
- Serving: Azure Synapse Analytics, Azure SQL Database
- Storage: Azure Data Lake Storage Gen2 (raw / curated / serving zones)
- Secrets: Azure Key Vault; Observability: Azure Monitor, Log Analytics
- Source systems: SAP ERP, CRM, Rebate Management, Finance ERP
Key pipelines: Customer Master Ingestion, Rebate Calculation Transform, Sales Analytics Pipeline,
Pricing Snapshot Export, Finance ERP Connector, Revenue Attribution Model, Warranty Claims Ingest,
Monthly Close Pipeline, Order Fulfilment Aggregate, Demand Forecast Pipeline.
Known weak spots: schema drift from CRM/ERP deployments without coordination, ADF linked service
auth failures on service principal rotation, SCD Type-2 explosions in rebate dimension processing.`,

  'Greaves Cotton': `
Greaves Cotton runs on AWS. Their data platform:
- ETL: AWS Glue (PySpark jobs), Python shell jobs
- Orchestration: AWS Step Functions, EventBridge triggers
- Triggers / quality gates: AWS Lambda
- Warehouse: Amazon Redshift; Data lake: Amazon S3 (raw/stage/curated)
- Secrets: AWS Secrets Manager; IAM roles per job
- Source systems: SAP ERP, supplier portals, product catalogue feed
Key pipelines: Raw Orders Ingestion, Customer Transform Pipeline, Finance Daily Close,
Product Catalogue Sync, Compliance Audit Export, ERP Integration Pipeline, Supplier Data Load,
Warranty Data Pipeline.
Known weak spots: Glue DPU capacity on large batch days, Step Functions timeouts on ERP extract,
Redshift table locks during concurrent daily close loads.`,

  'CocoBlu Retail': `
CocoBlu Retail runs on AWS. Their data platform:
- ETL: AWS Glue (retail transaction processing)
- Orchestration: AWS Step Functions
- Real-time events: AWS Lambda processing DynamoDB streams from POS
- Warehouse: Amazon Redshift; Data lake: Amazon S3
- Real-time store: Amazon DynamoDB (loyalty events, POS state)
- Source systems: POS terminals, loyalty platform, inventory management
Key pipelines: Retail Transaction Ingest, Customer Segmentation Load, Loyalty Programme Sync,
POS Integration Pipeline, Finance Reconcile Pipeline, Inventory Reorder Monitor,
Returns Processing Pipeline, Store Performance Pipeline.
Known weak spots: volume anomalies from promotional events (Black Friday, flash sales), POS
schema changes from firmware updates, loyalty deduplication logic fragility, returns data timing.`,

  'GoldenSands': `
GoldenSands runs on Oracle Cloud. Their data platform:
- CDC replication: Oracle GoldenGate (source OLTP → ADW staging)
- Transformation: Oracle Data Integrator (ODI) mappings and interfaces
- Warehouse: Oracle Autonomous Data Warehouse (ADW)
- Staging: Oracle Object Storage
- Source systems: core banking, regulatory reporting system, treasury
Key pipelines: GoldenGate Replication, Financial Consolidation, Customer Dimension Load,
BI Aggregation Pipeline, Regulatory Reporting Load, Transactions Archive, Data Warehouse Refresh.
Known weak spots: GoldenGate trail file gaps on network instability, ODI mapping failures when
source schema drifts, auth failures on ADW wallet rotation, referential integrity issues in
financial consolidation when GL and sub-ledger loads run out of order.`,

  'Rotimatic': `
Rotimatic runs on AWS. Their data platform handles IoT device telemetry at scale:
- Ingestion: AWS IoT Core → Amazon Kinesis Data Streams / Firehose
- Stream processing: AWS Lambda (per-device enrichment, anomaly detection)
- Batch: AWS Glue (daily aggregation, predictive maintenance features)
- State store: Amazon DynamoDB (device state, session tracking)
- Analytics: Amazon Redshift, S3 data lake
- Source: Rotimatic IoT devices (firmware-driven telemetry schema)
Key pipelines: IoT Telemetry Ingest, Device Health Aggregate, Recipe Analytics Pipeline,
Predictive Maintenance Load, Baking Session Enrichment, Quality Monitoring Pipeline,
Subscription Events Sync.
Known weak spots: IoT schema drift from firmware version mismatches, Kinesis shard hot-spotting
on device fleet events, Lambda cold-start timeouts on bursty telemetry, DynamoDB throughput
throttling during peak baking hours.`,

  'PipelineIQ Internal': `
PipelineIQ Internal runs on Azure. Internal monitoring and tooling pipelines:
- Azure Data Factory for internal ETL and metrics collection
- Azure Monitor + Application Insights for platform observability
- Azure DevOps for CI/CD pipeline automation
- Azure SQL for internal reporting and portal data
Key pipelines: usage analytics ingestion, system health aggregation, internal metrics pipelines.`,
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.AZURE_OPENAI_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'AZURE_OPENAI_API_KEY not configured' })

  const { incident, messages } = req.body
  if (!incident || !Array.isArray(messages)) return res.status(400).json({ error: 'Missing incident or messages' })

  const persona = CLIENT_PERSONAS[incident.client_name] || `Client: ${incident.client_name}. Cloud: ${incident.cloud_service}.`

  const systemPrompt = `You are PipelineIQ's incident intelligence assistant, embedded in an incident detail panel.

CLIENT ARCHITECTURE — ${incident.client_name}:
${persona}

CURRENT INCIDENT:
- ID: INC-${String(incident.id).padStart(4, '0')}
- Title: ${incident.title}
- Pipeline: ${incident.pipeline_name}
- Cloud service: ${incident.cloud_service}
- Pattern: ${incident.pattern_tag}
- Severity: ${incident.severity} | Status: ${incident.status}
- Root cause: ${incident.root_cause}
- Suggested steps: ${(incident.suggested_steps || []).join(' | ')}
- Services impacted: ${(incident.services_impacted || []).join(', ')}

RULES:
- Be concise. 2–4 sentences unless a CLI command or SQL snippet genuinely helps.
- Answer specifically using the incident and client context above.
- If you are not confident about something, say so clearly — do not guess or invent specifics.
- Do not make up row counts, timestamps, or error codes not present in the incident.
- If asked outside the scope of this incident or platform, say so briefly.
- Plain text only — no markdown headers. Short bullet lists are fine when listing steps.`

  const endpoint = 'https://pipeline-iq-resource.services.ai.azure.com/api/projects/pipeline-iq/openai/v1/chat/completions'

  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-12),
        ],
        temperature: 0.2,
        max_completion_tokens: 400,
      }),
    })
    if (!upstream.ok) {
      const errText = await upstream.text()
      throw new Error(`Azure OpenAI ${upstream.status}: ${errText.slice(0, 400)}`)
    }
    const completion = await upstream.json()

    const reply = completion.choices[0].message.content.trim()
    return res.status(200).json({ reply })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
