import { subDays, subHours, subMinutes, format } from 'date-fns'

const now = new Date()
const d = (days, hours = 0, mins = 0) => subMinutes(subHours(subDays(now, days), hours), mins).toISOString()

export const USERS = {
  admin:     { username: 'admin',     name: 'Admin Account',    role: 'admin',           initials: 'AA', client_access: ['__all__'] },
  keerthana: { username: 'keerthana', name: 'Keerthana Vayyasi',role: 'founder',         initials: 'KV', client_access: ['__all__'] },
  mohan:     { username: 'mohan',     name: 'Mohan Gowda T',    role: 'senior_engineer', initials: 'MG', client_access: ['__all__'] },
  owais:     { username: 'owais',     name: 'Owais Khan',       role: 'senior_engineer', initials: 'OK', client_access: ['Spirax Group','CocoBlu Retail','GoldenSands','Rotimatic'] },
  meghana:   { username: 'meghana',   name: 'Meghana Badiger',  role: 'engineer',        initials: 'MB', client_access: ['Spirax Group','Greaves Cotton'] },
  anis:      { username: 'anis',      name: 'Anis Kaarti',      role: 'engineer',        initials: 'AK', client_access: ['Spirax Group'] },
  jayasree:  { username: 'jayasree',  name: 'Jayasree',         role: 'engineer',        initials: 'JA', client_access: ['Spirax Group','GoldenSands'] },
  anosh:     { username: 'anosh',     name: 'Anosh Sood',       role: 'engineer',        initials: 'AS', client_access: ['Rotimatic'] },
  aiswarya:  { username: 'aiswarya',  name: 'Aiswarya Suresh',  role: 'engineer',        initials: 'AS', client_access: ['Rotimatic'] },
}

export const CLIENTS = [
  { id: 1, name: 'PipelineIQ Internal', cloud: 'Azure',        environments: ['prod','staging','dev'] },
  { id: 2, name: 'Spirax Group',        cloud: 'Azure',        environments: ['prod','staging'] },
  { id: 3, name: 'Greaves Cotton',      cloud: 'AWS',          environments: ['prod','staging','dev'] },
  { id: 4, name: 'CocoBlu Retail',      cloud: 'AWS',          environments: ['prod','staging'] },
  { id: 5, name: 'GoldenSands',         cloud: 'Oracle Cloud', environments: ['prod','staging'] },
  { id: 6, name: 'Rotimatic',           cloud: 'AWS',          environments: ['prod','dev'] },
]

const cloudColor = { Azure: 'azure', AWS: 'aws', 'Oracle Cloud': 'oracle' }
export const getCloudColor = (cloud) => cloudColor[cloud] || 'accent'

function buildHistory(sr = 0.93) {
  return Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(now, 29 - i), 'yyyy-MM-dd'),
    status: Math.random() < sr ? 'success' : 'failed',
    duration_minutes: +(Math.random() * 40 + 5).toFixed(1),
  }))
}

export const PIPELINES = {
  1: [ // PipelineIQ Internal
    { id: 101, name: 'Metrics Ingestion Pipeline',    cloud_service: 'Azure Data Factory',       environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.97) },
    { id: 102, name: 'User Activity Transform',       cloud_service: 'Azure Databricks',          environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.95) },
    { id: 103, name: 'Event Log Sync Pipeline',       cloud_service: 'Azure Synapse Analytics',   environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.94) },
    { id: 104, name: 'Feature Flag Refresh',          cloud_service: 'Azure Data Factory',       environment: 'staging', active_branch: 'staging', run_history: buildHistory(0.88) },
    { id: 105, name: 'Retention Archive Pipeline',    cloud_service: 'Azure Databricks',          environment: 'staging', active_branch: 'staging', run_history: buildHistory(0.90) },
    { id: 106, name: 'Audit Log Export',              cloud_service: 'Azure Synapse Analytics',   environment: 'dev',     active_branch: 'main',    run_history: buildHistory(0.80) },
    { id: 107, name: 'Session Analytics Pipeline',   cloud_service: 'Azure Data Factory',       environment: 'dev',     active_branch: 'feature/session-v2', run_history: buildHistory(0.75) },
    { id: 108, name: 'Internal Reporting Aggregate', cloud_service: 'Azure Databricks',          environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.96) },
    { id: 109, name: 'Config Drift Monitor',          cloud_service: 'Azure Synapse Analytics',   environment: 'staging', active_branch: 'main',    run_history: buildHistory(0.91) },
    { id: 110, name: 'Data Quality Validator',        cloud_service: 'Azure Data Factory',       environment: 'dev',     active_branch: 'main',    run_history: buildHistory(0.82) },
    { id: 111, name: 'Cost Analytics Pipeline',       cloud_service: 'Azure Databricks',          environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.98) },
    { id: 112, name: 'Schema Registry Sync',          cloud_service: 'Azure Synapse Analytics',   environment: 'staging', active_branch: 'staging', run_history: buildHistory(0.87) },
  ],
  2: [ // Spirax Group
    { id: 201, name: 'Customer Master Ingestion',     cloud_service: 'Azure Data Factory',       environment: 'prod',    active_branch: 'main',              run_history: buildHistory(0.90) },
    { id: 202, name: 'Rebate Calculation Transform',  cloud_service: 'Azure Databricks',          environment: 'prod',    active_branch: 'main',              run_history: buildHistory(0.88) },
    { id: 203, name: 'Product Hierarchy Load',        cloud_service: 'Azure Data Factory',       environment: 'staging', active_branch: 'feature/schema-v2', run_history: buildHistory(0.85) },
    { id: 204, name: 'Sales Analytics Pipeline',     cloud_service: 'Azure Databricks',          environment: 'prod',    active_branch: 'main',              run_history: buildHistory(0.93) },
    { id: 205, name: 'Pricing Snapshot Export',       cloud_service: 'Azure Data Factory',       environment: 'prod',    active_branch: 'main',              run_history: buildHistory(0.91) },
    { id: 206, name: 'Inventory Sync Pipeline',       cloud_service: 'Azure Databricks',          environment: 'staging', active_branch: 'staging',           run_history: buildHistory(0.87) },
    { id: 207, name: 'Finance ERP Connector',         cloud_service: 'Azure Data Factory',       environment: 'prod',    active_branch: 'main',              run_history: buildHistory(0.89) },
    { id: 208, name: 'Order Fulfilment Aggregate',   cloud_service: 'Azure Databricks',          environment: 'prod',    active_branch: 'main',              run_history: buildHistory(0.94) },
    { id: 209, name: 'Customer 360 Refresh',          cloud_service: 'Azure Data Factory',       environment: 'staging', active_branch: 'main',              run_history: buildHistory(0.86) },
    { id: 210, name: 'Revenue Attribution Model',     cloud_service: 'Azure Databricks',          environment: 'prod',    active_branch: 'main',              run_history: buildHistory(0.92) },
    { id: 211, name: 'Demand Forecast Pipeline',     cloud_service: 'Azure Data Factory',       environment: 'staging', active_branch: 'staging',           run_history: buildHistory(0.84) },
    { id: 212, name: 'Warranty Claims Ingest',        cloud_service: 'Azure Databricks',          environment: 'prod',    active_branch: 'main',              run_history: buildHistory(0.90) },
    { id: 213, name: 'Supplier Data Reconcile',       cloud_service: 'Azure Data Factory',       environment: 'staging', active_branch: 'main',              run_history: buildHistory(0.88) },
    { id: 214, name: 'Monthly Close Pipeline',        cloud_service: 'Azure Databricks',          environment: 'prod',    active_branch: 'main',              run_history: buildHistory(0.95) },
  ],
  3: [ // Greaves Cotton
    { id: 301, name: 'Raw Orders Ingestion',          cloud_service: 'AWS Glue',            environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.96) },
    { id: 302, name: 'Customer Transform Pipeline',   cloud_service: 'AWS Step Functions',  environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.94) },
    { id: 303, name: 'Inventory Reconciliation',      cloud_service: 'AWS Glue',            environment: 'staging', active_branch: 'main',    run_history: buildHistory(0.91) },
    { id: 304, name: 'Product Catalogue Sync',        cloud_service: 'AWS Lambda',          environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.97) },
    { id: 305, name: 'Finance Daily Close',           cloud_service: 'AWS Glue',            environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.95) },
    { id: 306, name: 'Supplier Data Load',            cloud_service: 'AWS Step Functions',  environment: 'staging', active_branch: 'staging', run_history: buildHistory(0.89) },
    { id: 307, name: 'Compliance Audit Export',       cloud_service: 'AWS Lambda',          environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.98) },
    { id: 308, name: 'Demand Forecast Aggregate',    cloud_service: 'AWS Glue',            environment: 'dev',     active_branch: 'main',    run_history: buildHistory(0.85) },
    { id: 309, name: 'Warranty Data Pipeline',        cloud_service: 'AWS Step Functions',  environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.93) },
    { id: 310, name: 'Dealer Network Sync',           cloud_service: 'AWS Glue',            environment: 'staging', active_branch: 'staging', run_history: buildHistory(0.88) },
    { id: 311, name: 'Service History Archive',       cloud_service: 'AWS Lambda',          environment: 'dev',     active_branch: 'main',    run_history: buildHistory(0.82) },
    { id: 312, name: 'Parts Inventory Monitor',       cloud_service: 'AWS Glue',            environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.96) },
    { id: 313, name: 'ERP Integration Pipeline',      cloud_service: 'AWS Step Functions',  environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.94) },
  ],
  4: [ // CocoBlu Retail
    { id: 401, name: 'Retail Transaction Ingest',    cloud_service: 'AWS Glue',            environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.92) },
    { id: 402, name: 'Product Catalogue Transform',  cloud_service: 'AWS Step Functions',  environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.90) },
    { id: 403, name: 'Customer Segmentation Load',   cloud_service: 'AWS Glue',            environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.94) },
    { id: 404, name: 'Store Performance Pipeline',   cloud_service: 'AWS Step Functions',  environment: 'staging', active_branch: 'staging', run_history: buildHistory(0.87) },
    { id: 405, name: 'Loyalty Programme Sync',       cloud_service: 'AWS Glue',            environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.91) },
    { id: 406, name: 'Inventory Reorder Monitor',    cloud_service: 'AWS Lambda',          environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.95) },
    { id: 407, name: 'Promotions Analytics',         cloud_service: 'AWS Step Functions',  environment: 'staging', active_branch: 'main',    run_history: buildHistory(0.88) },
    { id: 408, name: 'POS Integration Pipeline',     cloud_service: 'AWS Glue',            environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.89) },
    { id: 409, name: 'Finance Reconcile Pipeline',   cloud_service: 'AWS Step Functions',  environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.93) },
    { id: 410, name: 'Returns Processing Pipeline',  cloud_service: 'AWS Glue',            environment: 'staging', active_branch: 'staging', run_history: buildHistory(0.86) },
    { id: 411, name: 'Supplier Data Sync',           cloud_service: 'AWS Lambda',          environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.97) },
  ],
  5: [ // GoldenSands
    { id: 501, name: 'GoldenGate Replication',       cloud_service: 'Oracle GoldenGate',        environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.88) },
    { id: 502, name: 'Financial Consolidation',      cloud_service: 'Oracle Data Integrator',   environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.90) },
    { id: 503, name: 'Customer Dimension Load',      cloud_service: 'Oracle GoldenGate',        environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.85) },
    { id: 504, name: 'Management Reporting Sync',    cloud_service: 'Oracle Data Integrator',   environment: 'staging', active_branch: 'staging', run_history: buildHistory(0.88) },
    { id: 505, name: 'Compliance Data Export',       cloud_service: 'Oracle GoldenGate',        environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.92) },
    { id: 506, name: 'Transactions Archive',         cloud_service: 'Oracle Data Integrator',   environment: 'staging', active_branch: 'main',    run_history: buildHistory(0.87) },
    { id: 507, name: 'Data Warehouse Refresh',       cloud_service: 'Oracle GoldenGate',        environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.91) },
    { id: 508, name: 'BI Aggregation Pipeline',      cloud_service: 'Oracle Data Integrator',   environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.89) },
    { id: 509, name: 'Source System Sync',           cloud_service: 'Oracle GoldenGate',        environment: 'staging', active_branch: 'staging', run_history: buildHistory(0.86) },
    { id: 510, name: 'Regulatory Reporting Load',    cloud_service: 'Oracle Data Integrator',   environment: 'prod',    active_branch: 'main',    run_history: buildHistory(0.93) },
  ],
  6: [ // Rotimatic
    { id: 601, name: 'IoT Telemetry Ingest',          cloud_service: 'AWS Glue',           environment: 'prod',  active_branch: 'main',    run_history: buildHistory(0.95) },
    { id: 602, name: 'Device Health Aggregate',       cloud_service: 'AWS Step Functions', environment: 'prod',  active_branch: 'main',    run_history: buildHistory(0.93) },
    { id: 603, name: 'Recipe Analytics Pipeline',     cloud_service: 'AWS Glue',           environment: 'prod',  active_branch: 'main',    run_history: buildHistory(0.91) },
    { id: 604, name: 'Firmware Version Lookup',       cloud_service: 'AWS Lambda',         environment: 'dev',   active_branch: 'main',    run_history: buildHistory(0.88) },
    { id: 605, name: 'Customer Lifecycle Transform',  cloud_service: 'AWS Glue',           environment: 'prod',  active_branch: 'main',    run_history: buildHistory(0.94) },
    { id: 606, name: 'Quality Monitoring Pipeline',   cloud_service: 'AWS Step Functions', environment: 'dev',   active_branch: 'main',    run_history: buildHistory(0.85) },
    { id: 607, name: 'Subscription Events Sync',      cloud_service: 'AWS Lambda',         environment: 'prod',  active_branch: 'main',    run_history: buildHistory(0.96) },
    { id: 608, name: 'Predictive Maintenance Load',   cloud_service: 'AWS Glue',           environment: 'prod',  active_branch: 'main',    run_history: buildHistory(0.92) },
    { id: 609, name: 'Usage Analytics Pipeline',      cloud_service: 'AWS Step Functions', environment: 'dev',   active_branch: 'feature/ml-v3', run_history: buildHistory(0.80) },
    { id: 610, name: 'Support Ticket Correlator',     cloud_service: 'AWS Glue',           environment: 'prod',  active_branch: 'main',    run_history: buildHistory(0.90) },
    { id: 611, name: 'Device Config Archive',         cloud_service: 'AWS Lambda',         environment: 'dev',   active_branch: 'main',    run_history: buildHistory(0.83) },
    { id: 612, name: 'Baking Session Enrichment',     cloud_service: 'AWS Glue',           environment: 'prod',  active_branch: 'main',    run_history: buildHistory(0.97) },
  ],
}

function slackThread(people, incidentTitle, pattern) {
  const msgs = [
    `Just got paged on #pipeline-alerts — ${incidentTitle.toLowerCase().substring(0, 60)}. Pulling job logs now.`,
    `Confirmed. The run errored at step 3. Stack trace in CloudWatch / Azure Monitor.`,
    `This matches what we saw last week. Upstream change wasn't communicated to us.`,
    `Reproducing in staging now. Give me ~10 mins.`,
    `Staging repro confirmed. Raising a hotfix PR — branch: fix/${pattern}-patch.`,
    `PR up. Tagging for review. Quick turnaround needed.`,
    `Reviewed and approved. Merging to staging first, then prod.`,
    `Prod deploy done. Monitoring for 10 mins then closing thread.`,
    `All clear. Closing thread — resolved.`,
  ]
  const names = ['Mohan Gowda T','Owais Khan','Anis Kaarti','Meghana Badiger','Jayasree','Anosh Sood','Aiswarya Suresh','Keerthana Vayyasi']
  const count = 6 + Math.floor(Math.random() * 3)
  return msgs.slice(0, count).map((msg, i) => {
    const author = names[i % names.length]
    return {
      author,
      avatar_initials: author.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(),
      timestamp: subMinutes(now, (count - i) * 9).toISOString(),
      message: msg,
    }
  })
}

function notifLog(client, title) {
  return [
    { channel: 'Slack', sent_at: subHours(now, 2).toISOString(), recipients: ['mohan','owais'], message_preview: `[CRITICAL] ${title} — ${client}. Auto-alert triggered via PipelineIQ.` },
    { channel: 'Slack', sent_at: subMinutes(subHours(now, 1), 55).toISOString(), recipients: ['mohan','owais','keerthana'], message_preview: `Incident opened: ${title}. Engineers notified on #pipeline-alerts.` },
    { channel: 'Email', sent_at: subMinutes(subHours(now, 1), 50).toISOString(), recipients: ['mohan','keerthana'], message_preview: `PipelineIQ alert: ${title} on ${client} requires attention.` },
  ]
}

export const INCIDENTS = [
  // ── Spirax Group (14) ──────────────────────────────────────────────────────
  {
    id: 1, title: 'Critical schema mismatch on Customer Master ingestion pipeline',
    client_name: 'Spirax Group', pipeline_name: 'Customer Master Ingestion', environment: 'prod',
    severity: 'critical', status: 'open', cloud_service: 'Azure Data Factory', pattern_tag: 'schema_drift',
    root_cause: 'The upstream CRM team deployed a change to the Customer Master table on 12 April that added three new NOT NULL columns without coordinating with the data engineering team. Azure Data Factory\'s copy activity is now failing at the schema validation step because the sink table definition in Azure SQL does not include these columns, causing a hard stop on row insertion.',
    suggested_steps: [
      'Check the ADF copy activity error log in Azure Monitor for the exact column names causing the violation.',
      'Compare the source CRM schema with the current sink table DDL to identify all column deltas.',
      'Raise a PR to add the three missing columns to the sink table with NULL defaults for historical rows.',
      'Deploy the DDL change to staging and run the pipeline in debug mode to confirm end-to-end success.',
      'Coordinate with the CRM team to establish a schema change notification process going forward.',
    ],
    services_impacted: ['Customer 360 Dashboard','Salesforce Sync Service','Revenue Attribution Model'],
    created_at: d(0, 2), resolved_at: null, resolution_time_minutes: null,
    assigned_to: null, people_involved: ['owais','anis'],
    slack_thread: slackThread(['Owais Khan','Anis Kaarti'], 'Critical schema mismatch', 'schema_drift'),
    notification_log: notifLog('Spirax Group','Critical schema mismatch on Customer Master ingestion pipeline'),
  },
  {
    id: 2, title: 'Dependency violation blocking Rebate Calculation pipeline in prod',
    client_name: 'Spirax Group', pipeline_name: 'Rebate Calculation Transform', environment: 'prod',
    severity: 'critical', status: 'open', cloud_service: 'Azure Databricks', pattern_tag: 'dependency_violation',
    root_cause: 'The Rebate Calculation Databricks job has a hard dependency on the Pricing Snapshot delta table written by an upstream pipeline scheduled 30 minutes earlier. On 13 April the upstream pipeline experienced a 47-minute delay due to a Databricks cluster autoscale event, causing the Rebate Calculation job to read an empty partition and produce incorrect aggregates downstream.',
    suggested_steps: [
      'Inspect the Databricks job run timeline in the Azure Databricks UI to confirm the exact delay window.',
      'Add an explicit data quality assertion at the start of the Rebate Calculation notebook to halt if the pricing snapshot partition is empty.',
      'Introduce a conditional trigger in ADF that checks for partition availability before invoking the downstream job.',
      'Backfill the 13 April rebate data once the upstream pipeline is confirmed healthy.',
      'Review cluster autoscale settings for the upstream pipeline to reduce cold-start delays.',
    ],
    services_impacted: ['Rebate Reporting Service','Finance ERP Connector','Monthly Close Pipeline'],
    created_at: d(0, 3), resolved_at: null, resolution_time_minutes: null,
    assigned_to: null, people_involved: ['mohan','anis','meghana'],
    slack_thread: slackThread(['Mohan Gowda T','Anis Kaarti','Meghana Badiger'], 'Dependency violation rebate', 'dependency_violation'),
    notification_log: notifLog('Spirax Group','Dependency violation blocking Rebate Calculation pipeline'),
  },
  {
    id: 3, title: 'Null constraint violation on product hierarchy staging load',
    client_name: 'Spirax Group', pipeline_name: 'Product Hierarchy Load', environment: 'staging',
    severity: 'warning', status: 'investigating', cloud_service: 'Azure Databricks', pattern_tag: 'null_constraint',
    root_cause: 'The product hierarchy staging load job is inserting NULL values into the `category_code` column which has a NOT NULL constraint in the staging database. This is caused by incomplete data in the source ERP export — approximately 340 product SKUs introduced in the last batch are missing category assignments in the source system.',
    suggested_steps: [
      'Query the staging database for all rows where `category_code IS NULL` to determine the full scope.',
      'Cross-reference the NULL SKUs against the ERP source export to confirm they lack category assignments at source.',
      'Apply a default category code (\'UNCATEGORISED\') as a temporary measure to unblock the pipeline.',
      'Raise a ticket with the ERP team to backfill category assignments for the affected 340 SKUs.',
      'Add a pre-load data quality check in the Databricks notebook that flags NULL category codes before insertion.',
    ],
    services_impacted: ['Product Catalogue API','Inventory Sync Service'],
    created_at: d(1, 1), resolved_at: null, resolution_time_minutes: null,
    assigned_to: 'anis', people_involved: ['anis','meghana'],
    slack_thread: slackThread(['Anis Kaarti','Meghana Badiger'], 'Null constraint violation', 'null_constraint'),
    notification_log: notifLog('Spirax Group','Null constraint violation on product hierarchy staging load'),
  },
  {
    id: 4, title: 'Upstream delay causing dependency cascade (occurrence 2)',
    client_name: 'Spirax Group', pipeline_name: 'Factory Ingestion Pipeline', environment: 'prod',
    severity: 'warning', status: 'resolved', cloud_service: 'Azure Data Factory', pattern_tag: 'dependency_violation',
    root_cause: 'A delayed upstream pipeline caused downstream jobs to read stale or empty partitions. This is the second occurrence this month, stemming from the same ADF trigger chain lacking proper dependency gating.',
    suggested_steps: ['Identify the delayed upstream job.','Check downstream job output.','Apply conditional trigger logic.','Validate data completeness.','Document the fix.'],
    services_impacted: ['Downstream Reporting','Finance Aggregation'],
    created_at: d(5, 4), resolved_at: d(5, 2), resolution_time_minutes: 118,
    assigned_to: 'mohan', people_involved: ['mohan','anis'],
    slack_thread: slackThread(['Mohan Gowda T','Anis Kaarti'], 'Dependency cascade', 'dependency_violation'),
    notification_log: notifLog('Spirax Group','Upstream delay causing dependency cascade'),
  },
  {
    id: 5, title: 'Upstream delay causing dependency cascade (occurrence 3)',
    client_name: 'Spirax Group', pipeline_name: 'Pricing Snapshot Export', environment: 'prod',
    severity: 'warning', status: 'resolved', cloud_service: 'Azure Data Factory', pattern_tag: 'dependency_violation',
    root_cause: 'Third recurrence of the dependency cascade issue. Upstream ADF pipeline delayed by a cluster warm-up event, causing downstream consumers to read incomplete partitions.',
    suggested_steps: ['Review ADF trigger chain configuration.','Add partition completeness check.','Implement retry with backoff.','Alert on partition availability timeout.','Update incident runbook.'],
    services_impacted: ['Revenue Attribution Model','Finance Aggregation'],
    created_at: d(9, 3), resolved_at: d(9, 1), resolution_time_minutes: 95,
    assigned_to: 'mohan', people_involved: ['mohan','meghana'],
    slack_thread: slackThread(['Mohan Gowda T','Meghana Badiger'], 'Dependency cascade 3', 'dependency_violation'),
    notification_log: notifLog('Spirax Group','Upstream delay causing dependency cascade occurrence 3'),
  },
  {
    id: 6, title: 'Upstream delay causing dependency cascade (occurrence 4)',
    client_name: 'Spirax Group', pipeline_name: 'Finance ERP Connector', environment: 'prod',
    severity: 'critical', status: 'resolved', cloud_service: 'Azure Databricks', pattern_tag: 'dependency_violation',
    root_cause: 'Fourth recurrence. Autoscale event on Databricks cluster caused 52-minute startup delay, triggering cascade across 3 downstream jobs.',
    suggested_steps: ['Pin cluster size to avoid autoscale delays.','Add SLA breach alert on job start time.','Implement warm pool configuration.','Coordinate with Azure support on autoscale SLA.','Backfill affected aggregates.'],
    services_impacted: ['Finance ERP Connector','Monthly Close Pipeline','Revenue Attribution Model'],
    created_at: d(15, 5), resolved_at: d(15, 2), resolution_time_minutes: 142,
    assigned_to: 'mohan', people_involved: ['mohan','owais'],
    slack_thread: slackThread(['Mohan Gowda T','Owais Khan'], 'Dependency cascade 4', 'dependency_violation'),
    notification_log: notifLog('Spirax Group','Dependency cascade occurrence 4'),
  },
  {
    id: 7, title: 'Upstream delay causing dependency cascade (occurrence 5)',
    client_name: 'Spirax Group', pipeline_name: 'Order Fulfilment Aggregate', environment: 'prod',
    severity: 'warning', status: 'resolved', cloud_service: 'Azure Data Factory', pattern_tag: 'dependency_violation',
    root_cause: 'Fifth occurrence of the dependency cascade pattern. The ADF pipeline trigger chain remains ungated despite previous incidents. Permanent fix scheduled for next sprint.',
    suggested_steps: ['Apply temporary partition gate workaround.','Escalate permanent fix to sprint planning.','Monitor with 15-min lag alert.','Validate backfill output.','Update stakeholders.'],
    services_impacted: ['Order Fulfilment Service','Demand Forecast Pipeline'],
    created_at: d(22, 3), resolved_at: d(22, 1), resolution_time_minutes: 87,
    assigned_to: 'anis', people_involved: ['anis','meghana'],
    slack_thread: slackThread(['Anis Kaarti','Meghana Badiger'], 'Dependency cascade 5', 'dependency_violation'),
    notification_log: notifLog('Spirax Group','Dependency cascade occurrence 5'),
  },
  {
    id: 8, title: 'Schema drift on customer segment dimension table',
    client_name: 'Spirax Group', pipeline_name: 'Customer 360 Refresh', environment: 'staging',
    severity: 'warning', status: 'resolved', cloud_service: 'Azure Data Factory', pattern_tag: 'schema_drift',
    root_cause: 'Source system added 2 columns to the customer segment dimension without notice. ADF mapping data flow failed during the type-casting step.',
    suggested_steps: ['Identify new columns via ADF schema inspection.','Update mapping data flow to include new fields.','Validate in staging.','Promote to prod.','Set up schema change alert.'],
    services_impacted: ['Customer 360 Dashboard','Segmentation API'],
    created_at: d(10, 2), resolved_at: d(10, 0), resolution_time_minutes: 65,
    assigned_to: 'meghana', people_involved: ['meghana','anis'],
    slack_thread: slackThread(['Meghana Badiger','Anis Kaarti'], 'Schema drift customer segment', 'schema_drift'),
    notification_log: notifLog('Spirax Group','Schema drift on customer segment dimension'),
  },
  {
    id: 9, title: 'ADF timeout on large rebate dataset backfill',
    client_name: 'Spirax Group', pipeline_name: 'Sales Analytics Pipeline', environment: 'prod',
    severity: 'warning', status: 'resolved', cloud_service: 'Azure Data Factory', pattern_tag: 'timeout',
    root_cause: 'A 90-day historical backfill of rebate records exceeded the 2-hour ADF activity timeout. The job was processing 140M rows in a single batch without partitioning.',
    suggested_steps: ['Split the backfill into 7-day chunks.','Set partition key on date column.','Increase activity timeout to 4 hours for backfill runs.','Monitor progress via ADF monitoring.','Schedule off-peak.'],
    services_impacted: ['Rebate Reporting Service','Finance Aggregation'],
    created_at: d(13, 4), resolved_at: d(13, 1), resolution_time_minutes: 78,
    assigned_to: 'anis', people_involved: ['anis','mohan'],
    slack_thread: slackThread(['Anis Kaarti','Mohan Gowda T'], 'ADF timeout backfill', 'timeout'),
    notification_log: notifLog('Spirax Group','ADF timeout on large rebate backfill'),
  },
  {
    id: 10, title: 'SCD Type 2 explosion on customer dimension',
    client_name: 'Spirax Group', pipeline_name: 'Customer Master Ingestion', environment: 'staging',
    severity: 'warning', status: 'resolved', cloud_service: 'Azure Databricks', pattern_tag: 'scd_explosion',
    root_cause: 'A non-critical attribute was incorrectly included in the SCD Type 2 change detection logic, causing the dimension table to generate a new version row for every daily load regardless of meaningful changes. Row count grew 30× over 3 weeks.',
    suggested_steps: ['Identify the offending attribute in the SCD mapping.','Remove it from the change hash calculation.','Deduplicate the dimension table to remove phantom version rows.','Validate current_flag integrity.','Deploy to prod.'],
    services_impacted: ['Customer 360 Dashboard','Segmentation Service'],
    created_at: d(18, 2), resolved_at: d(17, 20), resolution_time_minutes: 45,
    assigned_to: 'meghana', people_involved: ['meghana','mohan'],
    slack_thread: slackThread(['Meghana Badiger','Mohan Gowda T'], 'SCD explosion', 'scd_explosion'),
    notification_log: notifLog('Spirax Group','SCD explosion on customer dimension'),
  },
  {
    id: 11, title: 'Config drift on ADF integration runtime after Azure maintenance',
    client_name: 'Spirax Group', pipeline_name: 'Supplier Data Reconcile', environment: 'prod',
    severity: 'info', status: 'resolved', cloud_service: 'Azure Data Factory', pattern_tag: 'config_drift',
    root_cause: 'Azure platform maintenance reset the integration runtime concurrency setting from 8 to the default of 4, halving throughput on the supplier reconciliation pipeline without triggering an alert.',
    suggested_steps: ['Inspect ADF IR configuration for concurrency settings.','Restore concurrency to 8.','Add a configuration baseline check to the deployment pipeline.','Set an alert on IR performance SLA breach.','Document in runbook.'],
    services_impacted: ['Supplier Reconciliation Dashboard'],
    created_at: d(20, 6), resolved_at: d(20, 4), resolution_time_minutes: 35,
    assigned_to: 'anis', people_involved: ['anis'],
    slack_thread: slackThread(['Anis Kaarti'], 'Config drift ADF IR', 'config_drift'),
    notification_log: notifLog('Spirax Group','Config drift on ADF integration runtime'),
  },
  {
    id: 12, title: 'Referential integrity failure on sales order foreign keys',
    client_name: 'Spirax Group', pipeline_name: 'Revenue Attribution Model', environment: 'prod',
    severity: 'warning', status: 'resolved', cloud_service: 'Azure Databricks', pattern_tag: 'referential_integrity',
    root_cause: 'The revenue attribution Databricks pipeline joined sales orders to a product dimension that had been partially refreshed, leaving orphan foreign key references for approximately 1,200 recently created products.',
    suggested_steps: ['Identify orphan foreign key rows via a NOT IN subquery.','Check the product dimension refresh schedule for timing issues.','Add a referential integrity check step before the join.','Patch the orphan rows by re-running the dimension refresh.','Add a foreign key assertion to the test suite.'],
    services_impacted: ['Revenue Attribution Model','Finance Reporting'],
    created_at: d(25, 3), resolved_at: d(25, 1), resolution_time_minutes: 55,
    assigned_to: 'meghana', people_involved: ['meghana','owais'],
    slack_thread: slackThread(['Meghana Badiger','Owais Khan'], 'Referential integrity', 'referential_integrity'),
    notification_log: notifLog('Spirax Group','Referential integrity failure on sales orders'),
  },
  {
    id: 13, title: 'Volume anomaly on warranty claims daily ingest',
    client_name: 'Spirax Group', pipeline_name: 'Warranty Claims Ingest', environment: 'prod',
    severity: 'info', status: 'resolved', cloud_service: 'Azure Data Factory', pattern_tag: 'volume_anomaly',
    root_cause: 'Warranty claims ingestion processed 380% of the expected daily volume due to a batch resubmission from the warranty management system following their system upgrade. The data was valid but the spike was not anticipated.',
    suggested_steps: ['Confirm with the warranty team that the spike is a resubmission, not a data quality issue.','Validate deduplication logic handled the resubmission correctly.','Check for duplicate warranty records in the target table.','Adjust the volume anomaly threshold to account for upgrade windows.','Add a notes field to the monitoring dashboard for planned volume events.'],
    services_impacted: ['Warranty Reporting Dashboard'],
    created_at: d(27, 4), resolved_at: d(27, 2), resolution_time_minutes: 28,
    assigned_to: 'anis', people_involved: ['anis'],
    slack_thread: slackThread(['Anis Kaarti'], 'Volume anomaly warranty', 'volume_anomaly'),
    notification_log: notifLog('Spirax Group','Volume anomaly on warranty claims ingest'),
  },
  {
    id: 14, title: 'Null constraint on customer contact data after ERP migration',
    client_name: 'Spirax Group', pipeline_name: 'Customer Master Ingestion', environment: 'prod',
    severity: 'warning', status: 'resolved', cloud_service: 'Azure Data Factory', pattern_tag: 'null_constraint',
    root_cause: 'Following an ERP system migration, approximately 2,100 customer records were migrated without a valid email address, causing the data pipeline to fail on a NOT NULL constraint on the contact_email field in the target Azure SQL table.',
    suggested_steps: ['Identify the affected customer records using a NULL filter query.','Apply a default placeholder email (\'noreply@spiraxsarco.com\') to unblock the pipeline.','Flag the records for manual review by the ERP migration team.','Add a pre-load NULL check to the ADF data flow.','Track remediation progress in the ERP project board.'],
    services_impacted: ['Customer Comms Service','CRM Sync Pipeline'],
    created_at: d(29, 5), resolved_at: d(29, 2), resolution_time_minutes: 70,
    assigned_to: 'mohan', people_involved: ['mohan','meghana'],
    slack_thread: slackThread(['Mohan Gowda T','Meghana Badiger'], 'Null constraint ERP migration', 'null_constraint'),
    notification_log: notifLog('Spirax Group','Null constraint after ERP migration'),
  },

  // ── Greaves Cotton (6 — all resolved) ──────────────────────────────────────
  {
    id: 15, title: 'Schema change on raw orders table broke Glue ETL job',
    client_name: 'Greaves Cotton', pipeline_name: 'Raw Orders Ingestion', environment: 'prod',
    severity: 'critical', status: 'resolved', cloud_service: 'AWS Glue', pattern_tag: 'schema_drift',
    root_cause: 'The upstream order management team added a `discount_pct` decimal column to the raw orders table and renamed `unit_price` to `unit_price_inr`. The Glue ETL job failed during the schema mapping step as neither field was registered in the Glue Data Catalog.',
    suggested_steps: ['Update the Glue Data Catalog table definition to include `discount_pct` and the renamed field.','Test the updated job in staging with a sample of the new data.','Validate that downstream BI queries are updated to reference the renamed column.','Re-run the failed partition to backfill today\'s data.','Establish a schema change review gate in the CI/CD process for source systems.'],
    services_impacted: ['Sales Dashboard','Inventory Reorder Service'],
    created_at: d(8, 3), resolved_at: d(8, 1), resolution_time_minutes: 88,
    assigned_to: 'meghana', people_involved: ['meghana','mohan'],
    slack_thread: slackThread(['Meghana Badiger','Mohan Gowda T'], 'Schema change orders', 'schema_drift'),
    notification_log: notifLog('Greaves Cotton','Schema change on raw orders table'),
  },
  {
    id: 16, title: 'Unexpected 3× volume spike on daily transactions pipeline',
    client_name: 'Greaves Cotton', pipeline_name: 'Finance Daily Close', environment: 'prod',
    severity: 'critical', status: 'resolved', cloud_service: 'AWS Step Functions', pattern_tag: 'volume_anomaly',
    root_cause: 'A month-end batch reprocessing job in the source ERP system submitted 3× the normal daily transaction volume. The Step Functions state machine did not have an upper-bound guard on record count, causing memory exhaustion on the processing Lambda function.',
    suggested_steps: ['Confirm with finance team that the spike is a valid month-end reprocessing event.','Increase Lambda memory allocation from 512MB to 2GB for the processing step.','Add a record count guard to the state machine to chunk oversized inputs.','Re-run the failed execution with the updated configuration.','Add volume alerting at ±150% of 7-day rolling average.'],
    services_impacted: ['Finance Reporting','Accounts Payable API','Monthly Close Pipeline'],
    created_at: d(11, 4), resolved_at: d(11, 2), resolution_time_minutes: 75,
    assigned_to: 'mohan', people_involved: ['mohan','meghana'],
    slack_thread: slackThread(['Mohan Gowda T','Meghana Badiger'], 'Volume spike transactions', 'volume_anomaly'),
    notification_log: notifLog('Greaves Cotton','Volume spike on daily transactions'),
  },
  {
    id: 17, title: 'AWS Glue job timed out on large historical backfill',
    client_name: 'Greaves Cotton', pipeline_name: 'Dealer Network Sync', environment: 'prod',
    severity: 'warning', status: 'resolved', cloud_service: 'AWS Glue', pattern_tag: 'timeout',
    root_cause: 'A 6-month historical backfill of dealer transaction data exceeded the Glue job 2880-second timeout. The job processed data as a single DPU without partitioning, causing it to run sequentially rather than in parallel.',
    suggested_steps: ['Partition the backfill by month (6 separate Glue job runs).','Set `NumberOfWorkers` to 10 G.2X for the backfill window.','Monitor CloudWatch Glue metrics for DPU utilisation.','Validate data completeness post-backfill.','Document the backfill approach for future reference.'],
    services_impacted: ['Dealer Network Dashboard','Sales Forecast Model'],
    created_at: d(14, 2), resolved_at: d(14, 0), resolution_time_minutes: 52,
    assigned_to: 'meghana', people_involved: ['meghana'],
    slack_thread: slackThread(['Meghana Badiger'], 'Glue timeout backfill', 'timeout'),
    notification_log: notifLog('Greaves Cotton','Glue job timeout on backfill'),
  },
  {
    id: 18, title: 'Null values in customer_id field failed NOT NULL constraint',
    client_name: 'Greaves Cotton', pipeline_name: 'Customer Transform Pipeline', environment: 'staging',
    severity: 'warning', status: 'resolved', cloud_service: 'AWS Glue', pattern_tag: 'null_constraint',
    root_cause: 'A subset of guest checkout records in the source RDS database do not have a customer_id assigned. The Glue transformation job was not filtering these records before writing to the staging Redshift table which enforces NOT NULL on customer_id.',
    suggested_steps: ['Add a filter step in the Glue job to exclude guest checkout records from the transformation.','Alternatively, assign a surrogate ID for guest records (e.g. UUID).','Validate the fix handles edge cases like partially completed checkouts.','Run regression tests on the downstream customer analytics views.','Update data dictionary to document guest checkout handling.'],
    services_impacted: ['Customer Analytics','Segmentation Pipeline'],
    created_at: d(17, 5), resolved_at: d(17, 3), resolution_time_minutes: 42,
    assigned_to: 'meghana', people_involved: ['meghana','mohan'],
    slack_thread: slackThread(['Meghana Badiger','Mohan Gowda T'], 'Null customer_id', 'null_constraint'),
    notification_log: notifLog('Greaves Cotton','Null values in customer_id field'),
  },
  {
    id: 19, title: 'Lambda config drift caused silent data drop on event pipeline',
    client_name: 'Greaves Cotton', pipeline_name: 'ERP Integration Pipeline', environment: 'prod',
    severity: 'warning', status: 'resolved', cloud_service: 'AWS Lambda', pattern_tag: 'config_drift',
    root_cause: 'A Lambda environment variable `TARGET_S3_BUCKET` was pointing to the staging bucket instead of production following a deployment where the wrong environment variables were applied. The Lambda ran successfully but silently wrote all events to the staging bucket, creating a 3-day data gap in production.',
    suggested_steps: ['Immediately update the Lambda environment variable to the correct production S3 bucket.','Identify the 3-day data gap and copy the misrouted files from staging to production S3.','Verify downstream pipeline picks up the backfill data correctly.','Add a deployment validation check that confirms environment variable values match the target environment.','Add a CloudWatch alarm on the production bucket for zero-file windows.'],
    services_impacted: ['ERP Analytics','Compliance Audit Trail'],
    created_at: d(20, 6), resolved_at: d(20, 3), resolution_time_minutes: 95,
    assigned_to: 'mohan', people_involved: ['mohan','meghana'],
    slack_thread: slackThread(['Mohan Gowda T','Meghana Badiger'], 'Lambda config drift', 'config_drift'),
    notification_log: notifLog('Greaves Cotton','Lambda config drift silent data drop'),
  },
  {
    id: 20, title: 'Referential integrity error on product-to-category join',
    client_name: 'Greaves Cotton', pipeline_name: 'Product Catalogue Sync', environment: 'prod',
    severity: 'warning', status: 'resolved', cloud_service: 'AWS Step Functions', pattern_tag: 'referential_integrity',
    root_cause: 'The product catalogue sync pipeline joined products to a category hierarchy dimension that was partially refreshed. New product categories added in the source EBS system did not yet exist in the warehouse dimension, resulting in NULL category references for 890 new products.',
    suggested_steps: ['Run a LEFT ANTI JOIN query to identify all products without matching category records.','Trigger an on-demand category dimension refresh to pull in the new categories.','Re-run the product catalogue sync after the dimension refresh.','Add a referential integrity assertion step before the final write.','Set up a dependency trigger so the product sync always waits for category refresh completion.'],
    services_impacted: ['Product Catalogue API','Merchandising Dashboard'],
    created_at: d(24, 4), resolved_at: d(24, 2), resolution_time_minutes: 60,
    assigned_to: 'meghana', people_involved: ['meghana','mohan'],
    slack_thread: slackThread(['Meghana Badiger','Mohan Gowda T'], 'Referential integrity product', 'referential_integrity'),
    notification_log: notifLog('Greaves Cotton','Referential integrity product-category join'),
  },

  // ── CocoBlu Retail (8) ────────────────────────────────────────────────────
  {
    id: 21, title: 'Retail transaction volume anomaly — 47% below expected threshold',
    client_name: 'CocoBlu Retail', pipeline_name: 'Retail Transaction Ingest', environment: 'prod',
    severity: 'warning', status: 'open', cloud_service: 'AWS Glue', pattern_tag: 'volume_anomaly',
    root_cause: 'The daily retail transaction ingestion pipeline processed 47% fewer records than the rolling 7-day average on 14 April. No AWS Glue job errors were raised, indicating the job completed successfully but the source data extraction from the upstream POS system returned fewer records than expected. This could indicate a POS connector issue, a source-side filtering change, or a genuine business volume drop.',
    suggested_steps: [
      'Check the AWS Glue job run metrics in CloudWatch to confirm job completion status and actual record counts.',
      'Compare today\'s POS connector extraction log against the last 7 days to identify where the volume drop originates.',
      'Contact the retail operations team to confirm whether a business event explains the volume drop.',
      'If a connector issue is confirmed, restart the POS connector and trigger a partial re-extraction.',
      'Add a volume threshold alert to CloudWatch so this pattern is caught within 30 minutes of job completion.',
    ],
    services_impacted: ['Retail Analytics Dashboard','Inventory Reorder Service','Finance Daily Close'],
    created_at: d(0, 1), resolved_at: null, resolution_time_minutes: null,
    assigned_to: null, people_involved: [],
    slack_thread: slackThread(['Owais Khan','Mohan Gowda T'], 'Volume anomaly retail', 'volume_anomaly'),
    notification_log: notifLog('CocoBlu Retail','Retail transaction volume anomaly'),
  },
  {
    id: 22, title: 'Schema change broke product catalogue Glue transform',
    client_name: 'CocoBlu Retail', pipeline_name: 'Product Catalogue Transform', environment: 'prod',
    severity: 'critical', status: 'resolved', cloud_service: 'AWS Glue', pattern_tag: 'schema_drift',
    root_cause: 'The product information management system team added 4 new fields to the product master export. The Glue job failed during the Parquet write step because the schema in the Data Catalog was out of date.',
    suggested_steps: ['Update Glue Data Catalog schema.','Test with new fields in staging.','Validate downstream BI reports.','Re-run failed partition.','Set up schema evolution alerts.'],
    services_impacted: ['Product Catalogue API','Merchandising Dashboard'],
    created_at: d(5, 3), resolved_at: d(5, 1), resolution_time_minutes: 65,
    assigned_to: 'owais', people_involved: ['owais','mohan'],
    slack_thread: slackThread(['Owais Khan','Mohan Gowda T'], 'Schema drift product', 'schema_drift'),
    notification_log: notifLog('CocoBlu Retail','Schema change product catalogue Glue'),
  },
  {
    id: 23, title: 'Step Functions state machine timed out on order aggregation',
    client_name: 'CocoBlu Retail', pipeline_name: 'Finance Reconcile Pipeline', environment: 'prod',
    severity: 'warning', status: 'resolved', cloud_service: 'AWS Step Functions', pattern_tag: 'timeout',
    root_cause: 'The weekly order aggregation Step Functions state machine hit the 1-year execution timeout after being inadvertently left in a WAIT state for 11 months. The machine was waiting for a callback token that was never delivered due to a Lambda deployment that removed the callback handler.',
    suggested_steps: ['Terminate the stale execution via the Step Functions console.','Locate and restore the missing callback token handler in the Lambda deployment.','Re-deploy the Lambda with the correct callback implementation.','Add a CloudWatch alarm on Step Functions executions older than 24 hours.','Review all state machines for orphaned executions.'],
    services_impacted: ['Finance Reconciliation','Weekly Revenue Report'],
    created_at: d(7, 2), resolved_at: d(7, 0), resolution_time_minutes: 48,
    assigned_to: 'owais', people_involved: ['owais'],
    slack_thread: slackThread(['Owais Khan'], 'Step Functions timeout', 'timeout'),
    notification_log: notifLog('CocoBlu Retail','Step Functions timeout order aggregation'),
  },
  {
    id: 24, title: 'Null customer_tier field caused downstream segmentation failure',
    client_name: 'CocoBlu Retail', pipeline_name: 'Customer Segmentation Load', environment: 'prod',
    severity: 'warning', status: 'resolved', cloud_service: 'AWS Glue', pattern_tag: 'null_constraint',
    root_cause: 'A batch of 5,400 newly acquired customers had NULL values in the `customer_tier` field because the CRM onboarding workflow did not assign a tier during bulk import. The segmentation pipeline\'s NOT NULL constraint on this field caused a full batch failure.',
    suggested_steps: ['Identify affected records with NULL customer_tier.','Apply default tier \'bronze\' to unblock the pipeline.','Raise request to CRM team to backfill customer tiers.','Add a pre-load validation step with clear NULL handling logic.','Add an alert on NULL rates above 1% for key dimension fields.'],
    services_impacted: ['Customer Segmentation API','Personalisation Service'],
    created_at: d(9, 4), resolved_at: d(9, 2), resolution_time_minutes: 38,
    assigned_to: 'owais', people_involved: ['owais','mohan'],
    slack_thread: slackThread(['Owais Khan','Mohan Gowda T'], 'Null customer_tier', 'null_constraint'),
    notification_log: notifLog('CocoBlu Retail','Null customer_tier segmentation failure'),
  },
  {
    id: 25, title: 'Lambda environment config drift — wrong S3 bucket target',
    client_name: 'CocoBlu Retail', pipeline_name: 'POS Integration Pipeline', environment: 'prod',
    severity: 'warning', status: 'resolved', cloud_service: 'AWS Lambda', pattern_tag: 'config_drift',
    root_cause: 'An environment variable update intended for the staging Lambda function was applied to the production function. The production POS integration Lambda wrote 2 hours of transaction data to the staging S3 bucket before the misrouting was detected by the monitoring team.',
    suggested_steps: ['Restore correct production S3 bucket in Lambda environment variables.','Copy misrouted transaction files from staging to production S3 path.','Trigger downstream pipeline to reprocess the 2-hour gap.','Implement environment separation using AWS SSM Parameter Store.','Add deployment approval gate for production Lambda updates.'],
    services_impacted: ['POS Analytics','Store Performance Dashboard','Finance Daily Close'],
    created_at: d(12, 5), resolved_at: d(12, 3), resolution_time_minutes: 72,
    assigned_to: 'owais', people_involved: ['owais','mohan'],
    slack_thread: slackThread(['Owais Khan','Mohan Gowda T'], 'Config drift Lambda', 'config_drift'),
    notification_log: notifLog('CocoBlu Retail','Lambda config drift wrong S3 bucket'),
  },
  {
    id: 26, title: 'Dependency violation on daily inventory reconciliation',
    client_name: 'CocoBlu Retail', pipeline_name: 'Inventory Reorder Monitor', environment: 'prod',
    severity: 'critical', status: 'resolved', cloud_service: 'AWS Glue', pattern_tag: 'dependency_violation',
    root_cause: 'The daily inventory reconciliation Glue job ran before the upstream stock movement pipeline completed, reading a partial dataset and producing an inventory position report that understated stock by 12% across all warehouses.',
    suggested_steps: ['Add a Step Functions wait step between the stock movement pipeline and reconciliation job.','Implement a data availability check using a Glue crawler trigger.','Re-run today\'s inventory reconciliation with the full dataset.','Alert the supply chain team about the inaccurate report.','Update the pipeline dependency graph documentation.'],
    services_impacted: ['Inventory Management System','Reorder Automation','Supply Chain Dashboard'],
    created_at: d(16, 3), resolved_at: d(16, 1), resolution_time_minutes: 90,
    assigned_to: 'owais', people_involved: ['owais','mohan'],
    slack_thread: slackThread(['Owais Khan','Mohan Gowda T'], 'Dependency inventory', 'dependency_violation'),
    notification_log: notifLog('CocoBlu Retail','Dependency violation inventory reconciliation'),
  },
  {
    id: 27, title: 'Referential integrity error on store-to-region mapping',
    client_name: 'CocoBlu Retail', pipeline_name: 'Store Performance Pipeline', environment: 'prod',
    severity: 'warning', status: 'resolved', cloud_service: 'AWS Glue', pattern_tag: 'referential_integrity',
    root_cause: 'Three new stores opened in the last week but were not added to the region mapping dimension table. The store performance pipeline produced NULL region values for these stores, causing GROUP BY region queries in the BI layer to silently drop their data.',
    suggested_steps: ['Add the 3 new stores to the region mapping dimension table.','Re-run the store performance pipeline to regenerate correct regional aggregates.','Add a NOT IN assertion step to the pipeline to detect unmapped stores before aggregation.','Set up a process for the store operations team to notify data engineering when new stores open.','Add a data freshness check on the region mapping table.'],
    services_impacted: ['Regional Performance Dashboard','Finance Regional Roll-up'],
    created_at: d(19, 4), resolved_at: d(19, 2), resolution_time_minutes: 55,
    assigned_to: 'owais', people_involved: ['owais'],
    slack_thread: slackThread(['Owais Khan'], 'Referential integrity store-region', 'referential_integrity'),
    notification_log: notifLog('CocoBlu Retail','Referential integrity store-to-region mapping'),
  },
  {
    id: 28, title: 'SCD Type 2 explosion on loyalty programme dimension table',
    client_name: 'CocoBlu Retail', pipeline_name: 'Loyalty Programme Sync', environment: 'staging',
    severity: 'warning', status: 'resolved', cloud_service: 'AWS Glue', pattern_tag: 'scd_explosion',
    root_cause: 'The loyalty points balance was included in the SCD Type 2 change detection hash. Since loyalty points update on every purchase transaction, this caused a new dimension row to be created for every customer on every transaction day. The loyalty dimension grew from 2M to 148M rows in 3 weeks.',
    suggested_steps: ['Remove `points_balance` from the SCD2 change detection hash.','Add it as a Type 1 (overwrite) attribute instead.','Run a deduplicate job to collapse the dimension back to one row per customer.','Validate current_flag and effective_date integrity post-dedup.','Add a row count growth alert on key dimension tables.'],
    services_impacted: ['Loyalty Programme API','Customer Analytics'],
    created_at: d(23, 5), resolved_at: d(23, 3), resolution_time_minutes: 110,
    assigned_to: 'mohan', people_involved: ['mohan','owais'],
    slack_thread: slackThread(['Mohan Gowda T','Owais Khan'], 'SCD explosion loyalty', 'scd_explosion'),
    notification_log: notifLog('CocoBlu Retail','SCD explosion loyalty programme dimension'),
  },

  // ── GoldenSands (9) ──────────────────────────────────────────────────────
  {
    id: 29, title: 'Oracle GoldenGate authentication failure — prod replication halted',
    client_name: 'GoldenSands', pipeline_name: 'GoldenGate Replication', environment: 'prod',
    severity: 'critical', status: 'open', cloud_service: 'Oracle GoldenGate', pattern_tag: 'auth_failure',
    root_cause: 'The Oracle GoldenGate replication process lost its database connection at 01:30 UTC on 14 April after the database service account password was rotated as part of the quarterly credential refresh cycle. The rotation was not communicated to the data engineering team, and the GoldenGate Extract process was not updated with the new credentials, causing all replication streams to halt.',
    suggested_steps: [
      'Retrieve the new service account credentials from the Oracle Cloud Vault via the OCI CLI.',
      'Update the GoldenGate credential store using the GGSCI command line and restart the Extract process.',
      'Verify replication lag in the GoldenGate Monitor to confirm the stream has caught up.',
      'Coordinate with the DBA team to be included in the credential rotation notification process.',
      'Implement automated credential refresh using OCI Secrets integration to prevent recurrence.',
    ],
    services_impacted: ['Data Warehouse Sync','Reporting Layer','Downstream BI Platform'],
    created_at: d(0, 4), resolved_at: null, resolution_time_minutes: null,
    assigned_to: null, people_involved: ['jayasree','owais'],
    slack_thread: slackThread(['Jayasree','Owais Khan'], 'GoldenGate auth failure', 'auth_failure'),
    notification_log: notifLog('GoldenSands','GoldenGate authentication failure prod replication halted'),
  },
  {
    id: 30, title: 'Oracle Data Integrator service account locked after repeated auth failures',
    client_name: 'GoldenSands', pipeline_name: 'Financial Consolidation', environment: 'prod',
    severity: 'critical', status: 'open', cloud_service: 'Oracle Data Integrator', pattern_tag: 'auth_failure',
    root_cause: 'The Oracle Data Integrator agent service account was locked by the Oracle database security policy after 5 consecutive failed authentication attempts. Failures began when a configuration file was overwritten during a routine OS patch, replacing the credential reference with a placeholder value.',
    suggested_steps: [
      'Unlock the service account using Oracle DBA console or SQLPLUS with SYSDBA privileges.',
      'Restore the correct credential reference in the ODI agent configuration file from the last known good backup.',
      'Restart the ODI agent and confirm it can authenticate to the master and work repositories.',
      'Run a smoke test on the highest-priority ODI interface to verify end-to-end data flow.',
      'Review the OS patch process to ensure data engineering config files are excluded from automated overwrites.',
    ],
    services_impacted: ['ODI Repository','Financial Consolidation Pipeline','Management Reporting'],
    created_at: d(1, 2), resolved_at: null, resolution_time_minutes: null,
    assigned_to: null, people_involved: ['jayasree','mohan'],
    slack_thread: slackThread(['Jayasree','Mohan Gowda T'], 'ODI account locked', 'auth_failure'),
    notification_log: notifLog('GoldenSands','ODI service account locked auth failures'),
  },
  {
    id: 31, title: 'GoldenGate credential expiry — auth failure (occurrence 3)',
    client_name: 'GoldenSands', pipeline_name: 'GoldenGate Replication', environment: 'staging',
    severity: 'warning', status: 'resolved', cloud_service: 'Oracle GoldenGate', pattern_tag: 'auth_failure',
    root_cause: 'Recurring authentication failure caused by credential expiry in the GoldenGate configuration. Third occurrence this week — service account credentials were not refreshed in the GoldenGate credential store after the Oracle Vault rotation.',
    suggested_steps: ['Retrieve updated credentials from Oracle Vault.','Update GoldenGate credential store via GGSCI.','Restart the affected Extract process.','Verify replication lag normalised.','Escalate credential rotation automation to backlog.'],
    services_impacted: ['Staging BI Layer','QA Data Platform'],
    created_at: d(3, 3), resolved_at: d(3, 1), resolution_time_minutes: 58,
    assigned_to: 'jayasree', people_involved: ['jayasree','owais'],
    slack_thread: slackThread(['Jayasree','Owais Khan'], 'Auth failure 3', 'auth_failure'),
    notification_log: notifLog('GoldenSands','GoldenGate auth failure occurrence 3'),
  },
  {
    id: 32, title: 'GoldenGate credential expiry — auth failure (occurrence 4)',
    client_name: 'GoldenSands', pipeline_name: 'Source System Sync', environment: 'staging',
    severity: 'warning', status: 'resolved', cloud_service: 'Oracle GoldenGate', pattern_tag: 'auth_failure',
    root_cause: 'Fourth occurrence of the GoldenGate credential expiry pattern in 7 days. The Oracle Vault rotation cycle is set to every 90 days but the GoldenGate process does not subscribe to rotation events, requiring manual updates each time.',
    suggested_steps: ['Update GoldenGate credentials immediately.','Implement OCI Secrets webhook to auto-update GGSCI on rotation.','Add monitoring alert for GGSCI auth failure exit codes.','Review all Oracle Vault secret consumers for the same vulnerability.','Schedule permanent fix sprint story.'],
    services_impacted: ['Source System Staging','QA Reporting Layer'],
    created_at: d(5, 4), resolved_at: d(5, 2), resolution_time_minutes: 72,
    assigned_to: 'jayasree', people_involved: ['jayasree','mohan'],
    slack_thread: slackThread(['Jayasree','Mohan Gowda T'], 'Auth failure 4', 'auth_failure'),
    notification_log: notifLog('GoldenSands','GoldenGate auth failure occurrence 4'),
  },
  {
    id: 33, title: 'Schema change on source table disrupted ODI mapping',
    client_name: 'GoldenSands', pipeline_name: 'Data Warehouse Refresh', environment: 'prod',
    severity: 'warning', status: 'resolved', cloud_service: 'Oracle Data Integrator', pattern_tag: 'schema_drift',
    root_cause: 'A source Oracle OLTP table had two columns renamed and one new column added as part of a monthly release. The ODI mapping was not updated to reflect these changes, causing the interface to fail at the column resolution step.',
    suggested_steps: ['Update the ODI mapping to use the new column names.','Add the new source column to the target datastore definition.','Run the updated interface in simulation mode to validate.','Promote to production with a scheduled maintenance window.','Establish a change notification process with the OLTP team.'],
    services_impacted: ['Data Warehouse Sync','Financial Reporting'],
    created_at: d(8, 3), resolved_at: d(8, 1), resolution_time_minutes: 82,
    assigned_to: 'jayasree', people_involved: ['jayasree','owais'],
    slack_thread: slackThread(['Jayasree','Owais Khan'], 'Schema drift ODI', 'schema_drift'),
    notification_log: notifLog('GoldenSands','Schema drift ODI mapping disruption'),
  },
  {
    id: 34, title: 'Unexpected volume spike on financial transactions extract',
    client_name: 'GoldenSands', pipeline_name: 'GoldenGate Replication', environment: 'prod',
    severity: 'warning', status: 'resolved', cloud_service: 'Oracle GoldenGate', pattern_tag: 'volume_anomaly',
    root_cause: 'A year-end restatement process generated 8× the normal transaction volume in the source OLTP system. GoldenGate captured all change events correctly but the downstream ODI aggregation step ran out of temporary tablespace in the Oracle target database.',
    suggested_steps: ['Increase Oracle temporary tablespace quota for the aggregation step.','Re-run the failed ODI interface after the tablespace increase.','Coordinate with the DBA to predict tablespace needs for year-end processes.','Add a tablespace utilisation alert threshold at 80%.','Document the year-end procedure for data engineering.'],
    services_impacted: ['Financial Consolidation','Regulatory Reporting'],
    created_at: d(12, 5), resolved_at: d(12, 2), resolution_time_minutes: 95,
    assigned_to: 'mohan', people_involved: ['mohan','jayasree'],
    slack_thread: slackThread(['Mohan Gowda T','Jayasree'], 'Volume spike finance', 'volume_anomaly'),
    notification_log: notifLog('GoldenSands','Volume spike financial transactions extract'),
  },
  {
    id: 35, title: 'SCD Type 2 explosion on customer dimension in data warehouse',
    client_name: 'GoldenSands', pipeline_name: 'Customer Dimension Load', environment: 'prod',
    severity: 'critical', status: 'resolved', cloud_service: 'Oracle Data Integrator', pattern_tag: 'scd_explosion',
    root_cause: 'A transient attribute (`last_login_ts`) was included in the SCD2 change detection logic in the ODI mapping. Since customers log in daily, this generated a new dimension row for every customer every day. The customer dimension grew 45× in 4 weeks, causing severe performance degradation in the BI layer.',
    suggested_steps: ['Remove `last_login_ts` from the SCD2 change hash in the ODI mapping.','Reclassify it as a Type 1 (overwrite) attribute.','Run a deduplication job using the Oracle Analytical Function LAG to identify and collapse phantom rows.','Validate current_flag correctness after deduplication.','Add a row count growth rate alert on the customer dimension table.'],
    services_impacted: ['Customer BI Reports','Segment Analytics','Management Dashboard'],
    created_at: d(16, 4), resolved_at: d(16, 1), resolution_time_minutes: 135,
    assigned_to: 'mohan', people_involved: ['mohan','jayasree','owais'],
    slack_thread: slackThread(['Mohan Gowda T','Jayasree','Owais Khan'], 'SCD explosion customer', 'scd_explosion'),
    notification_log: notifLog('GoldenSands','SCD explosion customer dimension'),
  },
  {
    id: 36, title: 'OCI config drift — wrong compute shape for ODI agent',
    client_name: 'GoldenSands', pipeline_name: 'Management Reporting Sync', environment: 'staging',
    severity: 'info', status: 'resolved', cloud_service: 'Oracle Data Integrator', pattern_tag: 'config_drift',
    root_cause: 'The ODI agent compute instance was scaled down to VM.Standard.E2.1 during cost optimisation without notifying the data engineering team. The reduced CPU/memory caused ODI interfaces to run 4× slower, causing SLA breaches on the morning reporting jobs.',
    suggested_steps: ['Scale the ODI agent instance back to the approved VM.Standard2.4 shape.','Confirm ODI interface runtimes have returned to SLA.','Add a compute shape check to the infrastructure monitoring runbook.','Require data engineering sign-off on any compute shape changes for ODI agents.','Document approved compute specifications for each ODI agent in the architecture runbook.'],
    services_impacted: ['Management Reporting','Executive Dashboard'],
    created_at: d(20, 6), resolved_at: d(20, 4), resolution_time_minutes: 40,
    assigned_to: 'jayasree', people_involved: ['jayasree'],
    slack_thread: slackThread(['Jayasree'], 'OCI config drift', 'config_drift'),
    notification_log: notifLog('GoldenSands','OCI config drift wrong compute shape'),
  },
  {
    id: 37, title: 'ODI interface timeout on large historical data reload',
    client_name: 'GoldenSands', pipeline_name: 'Transactions Archive', environment: 'staging',
    severity: 'warning', status: 'resolved', cloud_service: 'Oracle Data Integrator', pattern_tag: 'timeout',
    root_cause: 'A full-history reload of the archived transactions table timed out after 6 hours. The ODI interface was configured with a single-threaded execution mode and was processing 2.1 billion rows sequentially without parallelism.',
    suggested_steps: ['Enable parallel execution in the ODI interface using the IKM Oracle Insert (Parallel) knowledge module.','Set degree of parallelism to 8 based on the agent compute shape.','Split the reload into 12 monthly batches to manage transaction scope.','Monitor Oracle AWR reports for query plan changes during the reload.','Validate row counts post-reload against source system.'],
    services_impacted: ['Transactions Archive','Audit Reporting'],
    created_at: d(25, 3), resolved_at: d(25, 1), resolution_time_minutes: 68,
    assigned_to: 'jayasree', people_involved: ['jayasree','mohan'],
    slack_thread: slackThread(['Jayasree','Mohan Gowda T'], 'ODI timeout reload', 'timeout'),
    notification_log: notifLog('GoldenSands','ODI timeout historical data reload'),
  },

  // ── Rotimatic (8) ─────────────────────────────────────────────────────────
  {
    id: 38, title: 'Schema drift on IoT telemetry ingest pipeline — resolved in 6 min',
    client_name: 'Rotimatic', pipeline_name: 'IoT Telemetry Ingest', environment: 'prod',
    severity: 'warning', status: 'resolved', cloud_service: 'AWS Glue', pattern_tag: 'schema_drift',
    root_cause: 'The IoT telemetry Glue ingestion job failed when the firmware team pushed an update to the device telemetry payload that added two new fields and renamed `motor_speed_rpm` to `motor_rpm_actual`. The Glue schema registry was not updated in advance, causing Avro deserialization to fail. The fix was applied in 6 minutes by updating the Glue schema registry.',
    suggested_steps: ['Update the Glue Schema Registry with the new Avro schema.','Restart the Glue streaming job and confirm records are deserializing correctly.','Validate a sample of records in the target S3 data lake.','Establish a schema change notification process with the firmware team.','Add schema evolution checks to the Glue job to alert on field mismatches.'],
    services_impacted: ['Device Analytics Dashboard','Quality Monitoring Service'],
    created_at: d(1, 0, 10), resolved_at: d(1, 0, 4), resolution_time_minutes: 6,
    assigned_to: 'anosh', people_involved: ['anosh','aiswarya','mohan'],
    slack_thread: slackThread(['Anosh Sood','Aiswarya Suresh','Mohan Gowda T'], 'Schema drift telemetry', 'schema_drift'),
    notification_log: notifLog('Rotimatic','Schema drift IoT telemetry ingest resolved in 6 min'),
  },
  {
    id: 39, title: 'Telemetry volume anomaly — device count 30% below baseline',
    client_name: 'Rotimatic', pipeline_name: 'Device Health Aggregate', environment: 'prod',
    severity: 'warning', status: 'resolved', cloud_service: 'AWS Glue', pattern_tag: 'volume_anomaly',
    root_cause: 'Device telemetry volume dropped 30% below the 7-day rolling baseline during a firmware OTA update window. Devices in the middle of the update cycle stop transmitting telemetry for 2–8 minutes, and with 18% of the fleet updating simultaneously, the pipeline saw an apparent volume anomaly.',
    suggested_steps: ['Confirm with firmware team that an OTA update window was active.','Add a firmware update event flag to the monitoring dashboard to suppress volume alerts during planned OTA windows.','Validate that telemetry catches up after the update window closes.','Review device count metrics against expected fleet size.','Document OTA window exclusion logic in the monitoring runbook.'],
    services_impacted: ['Device Analytics Dashboard','Fleet Health Monitor'],
    created_at: d(4, 3), resolved_at: d(4, 1), resolution_time_minutes: 35,
    assigned_to: 'anosh', people_involved: ['anosh','aiswarya'],
    slack_thread: slackThread(['Anosh Sood','Aiswarya Suresh'], 'Volume anomaly devices', 'volume_anomaly'),
    notification_log: notifLog('Rotimatic','Telemetry volume anomaly device count'),
  },
  {
    id: 40, title: 'Step Functions timeout on daily device health aggregation',
    client_name: 'Rotimatic', pipeline_name: 'Quality Monitoring Pipeline', environment: 'dev',
    severity: 'warning', status: 'resolved', cloud_service: 'AWS Step Functions', pattern_tag: 'timeout',
    root_cause: 'The daily device health aggregation Step Functions state machine timed out because a new historical metrics backfill step was added to the pipeline without adjusting the execution timeout. The backfill step processes 90 days of data and took 3.8 hours, exceeding the 3-hour state machine timeout.',
    suggested_steps: ['Increase the Step Functions state machine timeout to 8 hours.','Separate the historical backfill into a dedicated pipeline run triggered weekly.','Add a CloudWatch metric for state machine execution duration.','Validate the daily incremental run without the backfill step.','Document the backfill schedule in the pipeline README.'],
    services_impacted: ['Device Health Dashboard','Predictive Maintenance Model'],
    created_at: d(7, 4), resolved_at: d(7, 2), resolution_time_minutes: 45,
    assigned_to: 'aiswarya', people_involved: ['aiswarya','anosh'],
    slack_thread: slackThread(['Aiswarya Suresh','Anosh Sood'], 'Step Functions timeout device', 'timeout'),
    notification_log: notifLog('Rotimatic','Step Functions timeout device health aggregation'),
  },
  {
    id: 41, title: 'Null device_serial field caused constraint violation in DynamoDB',
    client_name: 'Rotimatic', pipeline_name: 'Firmware Version Lookup', environment: 'dev',
    severity: 'warning', status: 'resolved', cloud_service: 'AWS Lambda', pattern_tag: 'null_constraint',
    root_cause: 'A batch of development test devices registered in the dev environment did not have device serial numbers assigned, causing NULL values in the partition key field when the Lambda function attempted to write to DynamoDB. DynamoDB does not permit NULL partition keys.',
    suggested_steps: ['Add a NULL guard in the Lambda function to skip records without a device serial.','Log skipped records to a dead-letter queue for later review.','Remove the invalid test device records from the source registration system.','Add device serial validation to the device registration workflow.','Update the Lambda unit tests to cover the NULL device_serial case.'],
    services_impacted: ['Firmware Lookup Service','Device Registration API'],
    created_at: d(10, 5), resolved_at: d(10, 3), resolution_time_minutes: 28,
    assigned_to: 'anosh', people_involved: ['anosh'],
    slack_thread: slackThread(['Anosh Sood'], 'Null device_serial', 'null_constraint'),
    notification_log: notifLog('Rotimatic','Null device_serial constraint violation DynamoDB'),
  },
  {
    id: 42, title: 'Dependency violation on firmware version lookup table',
    client_name: 'Rotimatic', pipeline_name: 'Recipe Analytics Pipeline', environment: 'prod',
    severity: 'warning', status: 'resolved', cloud_service: 'AWS Glue', pattern_tag: 'dependency_violation',
    root_cause: 'The recipe analytics Glue job depends on the firmware version lookup table being refreshed daily. On this occasion, the lookup table refresh job failed silently due to a Lambda concurrency limit being hit. The recipe analytics job ran with a stale lookup table, producing incorrect firmware version annotations on recipe records.',
    suggested_steps: ['Check Lambda concurrency metrics in CloudWatch for the lookup refresh function.','Increase Lambda reserved concurrency for the firmware lookup refresher.','Add an existence and freshness check to the recipe analytics job before proceeding.','Re-run recipe analytics with the correctly refreshed lookup table.','Add a SNS alert if the lookup table refresh job fails or produces zero records.'],
    services_impacted: ['Recipe Analytics Dashboard','Product Quality Reports'],
    created_at: d(13, 3), resolved_at: d(13, 1), resolution_time_minutes: 55,
    assigned_to: 'aiswarya', people_involved: ['aiswarya','anosh'],
    slack_thread: slackThread(['Aiswarya Suresh','Anosh Sood'], 'Dependency firmware lookup', 'dependency_violation'),
    notification_log: notifLog('Rotimatic','Dependency violation firmware lookup table'),
  },
  {
    id: 43, title: 'Lambda config drift — incorrect environment variable in prod',
    client_name: 'Rotimatic', pipeline_name: 'Subscription Events Sync', environment: 'prod',
    severity: 'warning', status: 'resolved', cloud_service: 'AWS Lambda', pattern_tag: 'config_drift',
    root_cause: 'During a Terraform deployment, the `STRIPE_WEBHOOK_SECRET` environment variable for the subscription events Lambda was updated with the test key instead of the production key. Subscription events were accepted but webhook signature validation silently failed, causing all subscription change events to be dropped.',
    suggested_steps: ['Replace the test `STRIPE_WEBHOOK_SECRET` with the correct production key in the Lambda configuration.','Check the dead-letter queue for dropped subscription events and determine the time window.','Replay dropped events from the Stripe Dashboard event log for the affected window.','Add a Stripe webhook test in the deployment CI pipeline to validate the secret before promotion.','Add a CloudWatch alarm on the DLQ message count for the subscription Lambda.'],
    services_impacted: ['Subscription Management','Billing Analytics','CRM Sync'],
    created_at: d(17, 6), resolved_at: d(17, 4), resolution_time_minutes: 62,
    assigned_to: 'anosh', people_involved: ['anosh','mohan'],
    slack_thread: slackThread(['Anosh Sood','Mohan Gowda T'], 'Config drift Lambda subscription', 'config_drift'),
    notification_log: notifLog('Rotimatic','Lambda config drift Stripe webhook secret'),
  },
  {
    id: 44, title: 'Referential integrity error on recipe-to-device mapping',
    client_name: 'Rotimatic', pipeline_name: 'Baking Session Enrichment', environment: 'prod',
    severity: 'info', status: 'resolved', cloud_service: 'AWS Glue', pattern_tag: 'referential_integrity',
    root_cause: 'The baking session enrichment pipeline joins session events to a recipe master table. A new set of 45 community recipes published through the app were not yet present in the data warehouse recipe master table when the enrichment pipeline ran. This resulted in NULL recipe metadata for baking sessions from those recipes.',
    suggested_steps: ['Trigger an immediate recipe master refresh to pull in the new community recipes.','Re-run the baking session enrichment pipeline for the affected time window.','Add a referential integrity check before the join step that logs unmatched recipe IDs.','Set up a near-real-time CDC pipeline from the recipe service to the data warehouse.','Add a daily reconciliation job to detect recipe ID gaps.'],
    services_impacted: ['Baking Analytics Dashboard','Recipe Recommendation Engine'],
    created_at: d(20, 4), resolved_at: d(20, 3), resolution_time_minutes: 22,
    assigned_to: 'aiswarya', people_involved: ['aiswarya'],
    slack_thread: slackThread(['Aiswarya Suresh'], 'Referential integrity recipe-device', 'referential_integrity'),
    notification_log: notifLog('Rotimatic','Referential integrity recipe-to-device mapping'),
  },
  {
    id: 45, title: 'SCD Type 2 explosion on device lifecycle dimension',
    client_name: 'Rotimatic', pipeline_name: 'Customer Lifecycle Transform', environment: 'dev',
    severity: 'warning', status: 'resolved', cloud_service: 'AWS Glue', pattern_tag: 'scd_explosion',
    root_cause: 'The device lifecycle SCD Type 2 dimension was tracking a `battery_charge_pct` attribute, which changes with every telemetry pulse. This caused a new dimension version to be created for each device approximately every 15 minutes, generating ~96 rows per device per day.',
    suggested_steps: ['Remove `battery_charge_pct` from the SCD2 change detection attributes.','Move it to the fact table as a point-in-time measure instead.','Run a deduplication job on the device lifecycle dimension to collapse spurious version rows.','Validate device version history is still meaningful after deduplication.','Add SCD dimension row count monitoring.'],
    services_impacted: ['Device Lifecycle Analytics','Support Ticket Correlator'],
    created_at: d(24, 5), resolved_at: d(24, 3), resolution_time_minutes: 80,
    assigned_to: 'anosh', people_involved: ['anosh','mohan'],
    slack_thread: slackThread(['Anosh Sood','Mohan Gowda T'], 'SCD explosion device lifecycle', 'scd_explosion'),
    notification_log: notifLog('Rotimatic','SCD explosion device lifecycle dimension'),
  },

  // ── PipelineIQ Internal (7 — all resolved/green) ──────────────────────────
  {
    id: 46, title: 'Internal ADF config drift after staging environment reset',
    client_name: 'PipelineIQ Internal', pipeline_name: 'Metrics Ingestion Pipeline', environment: 'prod',
    severity: 'info', status: 'resolved', cloud_service: 'Azure Data Factory', pattern_tag: 'config_drift',
    root_cause: 'A staging environment reset script inadvertently applied staging-level ADF integration runtime settings to the production environment. The change halved the maximum parallel copy activity threads, causing the metrics ingestion pipeline to run at 50% throughput for 6 hours before detection.',
    suggested_steps: ['Restore production IR settings from the last known good Terraform state.','Validate throughput has returned to baseline.','Add a Terraform drift detection job to alert on IR config changes.','Separate staging and prod environment scripts with explicit environment guards.','Add throughput SLA monitoring to the metrics ingestion dashboard.'],
    services_impacted: ['Internal Metrics Dashboard','Engineering Reporting'],
    created_at: d(5, 3), resolved_at: d(5, 1), resolution_time_minutes: 42,
    assigned_to: 'mohan', people_involved: ['mohan','keerthana'],
    slack_thread: slackThread(['Mohan Gowda T','Keerthana Vayyasi'], 'Config drift ADF internal', 'config_drift'),
    notification_log: notifLog('PipelineIQ Internal','Internal ADF config drift staging reset'),
  },
  {
    id: 47, title: 'Schema evolution on internal metrics table broke Synapse pipeline',
    client_name: 'PipelineIQ Internal', pipeline_name: 'User Activity Transform', environment: 'staging',
    severity: 'info', status: 'resolved', cloud_service: 'Azure Synapse Analytics', pattern_tag: 'schema_drift',
    root_cause: 'A new `session_source` enum column was added to the internal metrics table to track web vs. CLI vs. IDE usage. The Synapse pipeline\'s schema inference did not pick up the new column automatically, and the fixed column mapping in the pipeline definition rejected rows containing the new field.',
    suggested_steps: ['Update the Synapse pipeline column mapping to include `session_source`.','Enable schema evolution mode in the data flow sink settings.','Re-run the staging pipeline to ingest the backlog.','Add schema evolution tests to the pipeline CI run.','Document the schema versioning policy for internal metrics tables.'],
    services_impacted: ['Internal Usage Analytics'],
    created_at: d(9, 4), resolved_at: d(9, 3), resolution_time_minutes: 25,
    assigned_to: 'mohan', people_involved: ['mohan'],
    slack_thread: slackThread(['Mohan Gowda T'], 'Schema drift internal metrics', 'schema_drift'),
    notification_log: notifLog('PipelineIQ Internal','Schema evolution internal metrics Synapse'),
  },
  {
    id: 48, title: 'Databricks job timeout on 90-day retention archive run',
    client_name: 'PipelineIQ Internal', pipeline_name: 'Retention Archive Pipeline', environment: 'prod',
    severity: 'info', status: 'resolved', cloud_service: 'Azure Databricks', pattern_tag: 'timeout',
    root_cause: 'The 90-day data retention archive job exceeded the Databricks cluster job timeout of 4 hours. The job was processing the full dataset without date partitioning, and a recent 4× growth in internal event volume caused processing time to exceed the configured limit.',
    suggested_steps: ['Partition the archive job by week (13 weekly runs instead of one).','Increase the Databricks job cluster timeout to 6 hours for the archive job specifically.','Add a run time monitoring alert at 3.5 hours to give early warning.','Validate archived data integrity after the re-run.','Review retention policy to assess whether 90 days can be reduced.'],
    services_impacted: ['Internal Data Retention','Compliance Archive'],
    created_at: d(13, 5), resolved_at: d(13, 3), resolution_time_minutes: 55,
    assigned_to: 'mohan', people_involved: ['mohan'],
    slack_thread: slackThread(['Mohan Gowda T'], 'Databricks timeout archive', 'timeout'),
    notification_log: notifLog('PipelineIQ Internal','Databricks timeout 90-day retention archive'),
  },
  {
    id: 49, title: 'Unexpected volume spike in internal event log pipeline',
    client_name: 'PipelineIQ Internal', pipeline_name: 'Event Log Sync Pipeline', environment: 'staging',
    severity: 'info', status: 'resolved', cloud_service: 'Azure Synapse Analytics', pattern_tag: 'volume_anomaly',
    root_cause: 'A load test run by the platform team generated 14× normal event volume in the staging event log. The Synapse pipeline was not configured to handle such volumes in staging and ran out of allocated DWU capacity, causing all staging analytics jobs to queue behind it.',
    suggested_steps: ['Coordinate load test windows with the data engineering team to avoid pipeline contention.','Add a DWU auto-scaling policy for staging with an upper bound.','Implement load test event tagging so pipeline monitoring can identify synthetic traffic.','Add a stage-level concurrency control to prevent single jobs from monopolising DWU.','Update the load testing runbook to include data platform coordination steps.'],
    services_impacted: ['Staging Analytics Environment'],
    created_at: d(17, 4), resolved_at: d(17, 3), resolution_time_minutes: 30,
    assigned_to: 'mohan', people_involved: ['mohan','keerthana'],
    slack_thread: slackThread(['Mohan Gowda T','Keerthana Vayyasi'], 'Volume spike event log', 'volume_anomaly'),
    notification_log: notifLog('PipelineIQ Internal','Volume spike internal event log staging'),
  },
  {
    id: 50, title: 'Null constraint on internal user session table — staging',
    client_name: 'PipelineIQ Internal', pipeline_name: 'Session Analytics Pipeline', environment: 'staging',
    severity: 'info', status: 'resolved', cloud_service: 'Azure Data Factory', pattern_tag: 'null_constraint',
    root_cause: 'Internal integration tests running against the staging session analytics pipeline were generating synthetic session records without a `user_agent` field. The staging target table added a NOT NULL constraint on `user_agent` in the last schema migration that was not reflected in the test data generator.',
    suggested_steps: ['Update the internal test data generator to include a valid `user_agent` value.','Re-run the affected test suite against staging.','Review all NOT NULL column changes in recent migrations for test coverage gaps.','Add a schema contract test that validates test data against the current staging schema.','Update the test fixture documentation.'],
    services_impacted: ['Staging Session Analytics'],
    created_at: d(21, 6), resolved_at: d(21, 5), resolution_time_minutes: 18,
    assigned_to: 'mohan', people_involved: ['mohan'],
    slack_thread: slackThread(['Mohan Gowda T'], 'Null user_agent staging', 'null_constraint'),
    notification_log: notifLog('PipelineIQ Internal','Null constraint user session staging'),
  },
  {
    id: 51, title: 'Dependency violation in internal reporting pipeline chain',
    client_name: 'PipelineIQ Internal', pipeline_name: 'Internal Reporting Aggregate', environment: 'prod',
    severity: 'info', status: 'resolved', cloud_service: 'Azure Databricks', pattern_tag: 'dependency_violation',
    root_cause: 'The internal reporting aggregate Databricks job was triggered before the upstream cost analytics pipeline had completed its daily run. The reporting job read yesterday\'s cost data instead of today\'s, producing a one-day-stale report that was distributed to stakeholders before the data team noticed.',
    suggested_steps: ['Add an ADF dependency check between the cost analytics pipeline and the reporting aggregate job.','Rerun the reporting aggregate with today\'s cost data and resend the corrected report.','Add a `data_date` field to report outputs so consumers can detect stale reports.','Set up a Slack alert when the reporting pipeline produces data older than 4 hours.','Update the ADF pipeline trigger to enforce sequential execution.'],
    services_impacted: ['Internal Reporting Dashboard','Executive Briefing'],
    created_at: d(25, 4), resolved_at: d(25, 2), resolution_time_minutes: 48,
    assigned_to: 'mohan', people_involved: ['mohan','keerthana'],
    slack_thread: slackThread(['Mohan Gowda T','Keerthana Vayyasi'], 'Dependency reporting internal', 'dependency_violation'),
    notification_log: notifLog('PipelineIQ Internal','Dependency violation internal reporting chain'),
  },
  {
    id: 52, title: 'SCD explosion on internal feature flag dimension table',
    client_name: 'PipelineIQ Internal', pipeline_name: 'Feature Flag Refresh', environment: 'dev',
    severity: 'info', status: 'resolved', cloud_service: 'Azure Synapse Analytics', pattern_tag: 'scd_explosion',
    root_cause: 'A `last_evaluated_ms` timestamp was included in the SCD2 change detection for the internal feature flag dimension. Feature flag evaluations occur thousands of times per minute, causing the dimension to grow at an exponential rate and crashing the Synapse dedicated SQL pool with an out-of-space error.',
    suggested_steps: ['Remove `last_evaluated_ms` from the SCD2 change detection logic immediately.','Archive the bloated dimension table to cold storage.','Recreate the dimension using a deduplication snapshot approach.','Validate feature flag assignments are correct in the recreated dimension.','Add a dimension table row count SLA alert.'],
    services_impacted: ['Feature Flag Service','A/B Testing Platform'],
    created_at: d(29, 5), resolved_at: d(29, 3), resolution_time_minutes: 75,
    assigned_to: 'mohan', people_involved: ['mohan'],
    slack_thread: slackThread(['Mohan Gowda T'], 'SCD explosion feature flag', 'scd_explosion'),
    notification_log: notifLog('PipelineIQ Internal','SCD explosion feature flag dimension'),
  },

  // ── New open incidents ─────────────────────────────────────────────────────
  {
    id: 53, title: 'Sales Analytics row count dropped 71% vs 30-day baseline — ERP extraction suspected',
    client_name: 'Spirax Group', pipeline_name: 'Sales Analytics Pipeline', environment: 'prod',
    severity: 'critical', status: 'open', cloud_service: 'Azure Databricks', pattern_tag: 'volume_anomaly',
    root_cause: 'The Sales Analytics Pipeline daily run on 15 April processed 287K rows against a 30-day rolling average of 991K rows — a 71% volume drop that triggered the anomaly detection gate at 3σ deviation. The upstream ADF copy activity from the Spirax ERP (SAP S/4HANA) completed in 4 minutes versus the usual 38 minutes, strongly suggesting a partial or failed extraction at source. Downstream Revenue Attribution Model and Finance ERP Connector are both consuming stale data from yesterday\'s load.',
    suggested_steps: [
      'Validate the ADF copy activity row count in Azure Monitor — check the "rows read" metric against the source SAP delta view.',
      'Log into the SAP S/4HANA source system and confirm whether the delta extraction view (ZSALES_DELTA_V) returned the expected result set for today\'s date.',
      'If the source extraction is confirmed partial, trigger a full re-extract for today\'s date partition using the ADF debug run with explicit partition filter.',
      'Place a data hold on the Revenue Attribution Model and Finance ERP Connector downstream jobs until source data is confirmed healthy.',
      'After re-extract, validate row counts per sales org match the expected distribution before releasing downstream jobs.',
      'Raise a ticket with the SAP Basis team to investigate the delta view performance degradation that caused the short extraction window.',
    ],
    services_impacted: ['Revenue Attribution Model', 'Finance ERP Connector', 'Rebate Reporting Service', 'Executive Sales Dashboard'],
    created_at: d(0, 1, 15), resolved_at: null, resolution_time_minutes: null,
    assigned_to: null, people_involved: ['mohan', 'owais', 'meghana'],
    slack_thread: slackThread(['Mohan Gowda T', 'Owais Khan', 'Meghana Badiger'], 'Sales analytics volume drop', 'volume_anomaly'),
    notification_log: notifLog('Spirax Group', 'Sales Analytics row count dropped 71% vs baseline'),
  },
  {
    id: 54, title: 'GoldenGate Replication halted — Oracle service account token expired, 3 prod tables affected',
    client_name: 'GoldenSands', pipeline_name: 'GoldenGate Replication', environment: 'prod',
    severity: 'critical', status: 'open', cloud_service: 'Oracle GoldenGate', pattern_tag: 'auth_failure',
    root_cause: 'The Oracle GoldenGate service account GGADMIN had its OCI IAM token expire at 02:14 UTC on 15 April as part of the automated 90-day rotation policy. The token rotation in OCI Vault completed successfully but the updated credential was not propagated to the GoldenGate credential store (GGSCI), which holds a static copy. GoldenGate\'s EXTRACT and REPLICAT processes for three production tables — TRANSACTIONS, CUSTOMER_MASTER, and GL_ENTRIES — have been halted since 02:14 UTC. Approximately 7.2 hours of CDC lag has accumulated. The Financial Consolidation and BI Aggregation pipelines are consuming stale snapshots.',
    suggested_steps: [
      'SSH into the GoldenGate host and run: `GGSCI> INFO ALL` to confirm EXTRACT and REPLICAT process states.',
      'Retrieve the current valid credential from OCI Vault: `oci secrets secret-bundle get --secret-id <ocid>`.',
      'Update the GGSCI credential store: `GGSCI> ALTER CREDENTIALSTORE ADD USER ggadmin@<tns_alias> PASSWORD <new_token> ALIAS gg_prod_alias`.',
      'Restart EXTRACT processes: `GGSCI> START EXTRACT EXT_PROD` and monitor for successful trail file writes.',
      'Restart REPLICAT processes and verify lag is decreasing: `GGSCI> INFO REPLICAT REP_PROD, DETAIL`.',
      'Once lag is cleared, validate row counts for TRANSACTIONS, CUSTOMER_MASTER, GL_ENTRIES between source and target.',
      'Implement OCI Events + Functions automation to push rotated credentials to GGSCI on every vault rotation to prevent recurrence.',
    ],
    services_impacted: ['Financial Consolidation Pipeline', 'BI Aggregation Pipeline', 'Regulatory Reporting Load', 'Management Reporting Sync'],
    created_at: d(0, 7, 46), resolved_at: null, resolution_time_minutes: null,
    assigned_to: null, people_involved: ['jayasree', 'owais'],
    slack_thread: slackThread(['Jayasree', 'Owais Khan'], 'GoldenGate auth failure replication halted', 'auth_failure'),
    notification_log: notifLog('GoldenSands', 'GoldenGate Replication halted — service account token expired'),
  },
  {
    id: 55, title: 'SCD Type-2 explosion on Customer Segmentation Load — 847K phantom rows in 2 runs',
    client_name: 'CocoBlu Retail', pipeline_name: 'Customer Segmentation Load', environment: 'prod',
    severity: 'warning', status: 'open', cloud_service: 'AWS Glue', pattern_tag: 'scd_explosion',
    root_cause: 'The Customer Segmentation Load Glue job uses a SHA-256 hash of customer attributes to detect SCD Type-2 changes. A code change deployed on 13 April inadvertently added `last_web_session_ts` (a high-cardinality real-time field updated on every website visit) to the hash key set. Every customer record now registers as "changed" on every load, causing 423K new version rows per run. Two runs have executed since the deploy, producing 847K phantom versions. The DIM_CUSTOMER table has grown from 1.2M to 2.05M rows. Downstream Loyalty Programme Sync and Store Performance Pipeline are consuming inflated customer segments, distorting cohort analytics.',
    suggested_steps: [
      'Immediately pause the Customer Segmentation Load Glue job schedule to prevent further phantom row generation.',
      'In the Glue script, remove `last_web_session_ts` from the `change_key_cols` list passed to the SCD2 merge function.',
      'Delete the 847K phantom version rows: identify them via `WHERE effective_from >= \'2026-04-13\' AND is_current = FALSE AND hash_diff != lag(hash_diff) OVER (PARTITION BY customer_key ORDER BY effective_from)`, then DELETE.',
      'Restore correct `is_current = TRUE` flags for the legitimate current version rows.',
      'Validate row count returns to 1.2M ± 5% and spot-check 20 high-activity customers to confirm version history is clean.',
      'Re-enable the Glue job schedule and monitor for 2 consecutive clean runs before notifying downstream teams.',
      'Add a Glue job metric alert: if new SCD2 rows in a single run exceed 10% of total dimension size, halt and page on-call.',
    ],
    services_impacted: ['Loyalty Programme Sync', 'Store Performance Pipeline', 'Customer Analytics Dashboard', 'Promotions Analytics'],
    created_at: d(0, 3, 30), resolved_at: null, resolution_time_minutes: null,
    assigned_to: null, people_involved: ['owais'],
    slack_thread: slackThread(['Owais Khan'], 'SCD explosion customer segmentation', 'scd_explosion'),
    notification_log: notifLog('CocoBlu Retail', 'SCD explosion on Customer Segmentation Load'),
  },
  {
    id: 56, title: 'IoT Telemetry Ingest writing to deprecated S3 prefix — 6h of device data misdirected',
    client_name: 'Rotimatic', pipeline_name: 'IoT Telemetry Ingest', environment: 'prod',
    severity: 'warning', status: 'open', cloud_service: 'AWS Glue', pattern_tag: 'config_drift',
    root_cause: 'A Terraform apply on 14 April updated the Rotimatic prod S3 bucket structure, migrating telemetry from `s3://rotimatic-prod-data/telemetry/raw/` to `s3://rotimatic-prod-data/v2/telemetry/raw/`. The Glue job parameter `--output_prefix` was updated in the staging job definition but the production job definition was not updated in the same apply due to a workspace targeting error (`-target` flag excluded the prod module). Since 22:00 UTC on 14 April the Glue job has been writing 6h of IoT telemetry from ~14,000 active devices to the old prefix. Device Health Aggregate and Predictive Maintenance Load are reading from the new prefix and seeing zero records, producing empty aggregates.',
    suggested_steps: [
      'Update the prod Glue job parameter immediately: `aws glue update-job --job-name rotimatic-iot-telemetry-ingest --job-update \'{"DefaultArguments": {"--output_prefix": "s3://rotimatic-prod-data/v2/telemetry/raw/"}}\'`.',
      'Trigger a manual Glue job run to confirm the next batch writes to the correct prefix.',
      'Copy the 6h of misdirected data from the old prefix to the new one: `aws s3 cp s3://rotimatic-prod-data/telemetry/raw/ s3://rotimatic-prod-data/v2/telemetry/raw/ --recursive --exclude "*" --include "2026/04/15/0[0-5]*"`.',
      'Re-run Device Health Aggregate and Predictive Maintenance Load for the 22:00–04:00 UTC window to backfill correct aggregates.',
      'Fix the Terraform workspace targeting error and re-apply to ensure prod and staging definitions stay in sync.',
      'Add a Glue job config drift check to CI: before any Terraform apply, compare prod vs staging job parameters and fail if they diverge beyond expected deltas.',
    ],
    services_impacted: ['Device Health Aggregate', 'Predictive Maintenance Load', 'Quality Monitoring Pipeline', 'Support Ticket Correlator'],
    created_at: d(0, 4, 0), resolved_at: null, resolution_time_minutes: null,
    assigned_to: null, people_involved: ['anosh', 'aiswarya'],
    slack_thread: slackThread(['Anosh Sood', 'Aiswarya Suresh'], 'Config drift IoT telemetry wrong S3 prefix', 'config_drift'),
    notification_log: notifLog('Rotimatic', 'IoT Telemetry Ingest writing to deprecated S3 prefix'),
  },
]

// ── Live incident rotation engine ─────────────────────────────────────────
// Every 2.5 hours a new time bucket starts. Three incidents from the pool
// are surfaced: newest = open, previous bucket = investigating, two buckets
// ago = just resolved. The existing 20-second poll in Incidents.jsx picks up
// status changes automatically — no backend or API key required.

const BUCKET_MS = 2.5 * 60 * 60 * 1000

function bucketStart(n) { return new Date(n * BUCKET_MS).toISOString() }
function bucketMins(n)  { return Math.round((Date.now() - n * BUCKET_MS) / 60000) }

// Engineers available per client for realistic assignment
const CLIENT_ENGINEERS = {
  'Spirax Group':        ['owais', 'meghana', 'anis'],
  'Greaves Cotton':      ['meghana'],
  'CocoBlu Retail':      ['owais'],
  'GoldenSands':         ['jayasree', 'owais'],
  'Rotimatic':           ['anosh', 'aiswarya'],
  'PipelineIQ Internal': ['mohan'],
}

// Pool of 14 pre-written ephemeral incidents — varied clients, patterns, severities
const EPHEMERAL_POOL = [
  {
    _id: 1001,
    title: 'Warranty Claims Ingest — dependency gate missing, downstream jobs reading empty partition',
    client_name: 'Spirax Group', pipeline_name: 'Warranty Claims Ingest', environment: 'prod',
    severity: 'critical', cloud_service: 'Azure Data Factory', pattern_tag: 'dependency_violation',
    active_branch: 'main',
    root_cause: 'The Warranty Claims ADF pipeline triggered at 06:00 UTC before the upstream Product Hierarchy Load (staging → prod promotion) had written its completion marker. The Warranty Claims job read an empty `warranty_staging` partition and produced zero rows in the `fact_warranty_claims` table. Downstream Monthly Close Pipeline consumed the empty fact table and produced a zero-balance warranty accrual for April.',
    suggested_steps: ['Check ADF monitoring for the upstream pipeline completion time vs the Warranty Claims trigger time.','Add a Lookup activity in ADF that polls the completion marker file before the main copy activity.','Rerun the Warranty Claims pipeline for today\'s date once the upstream partition is confirmed complete.','Backfill the Monthly Close Pipeline for the affected warranty accrual period.','Update the ADF trigger schedule to add a 45-minute buffer or switch to event-based trigger on partition arrival.'],
    services_impacted: ['Monthly Close Pipeline', 'Finance ERP Connector', 'Warranty Claims Dashboard'],
  },
  {
    _id: 1002,
    title: 'Raw Orders Ingestion schema mismatch — new `fulfilment_channel` column rejected at sink',
    client_name: 'Greaves Cotton', pipeline_name: 'Raw Orders Ingestion', environment: 'prod',
    severity: 'critical', cloud_service: 'AWS Glue', pattern_tag: 'schema_drift',
    active_branch: 'main',
    root_cause: 'The Greaves Cotton ERP team deployed an update to the orders extract view on 14 April that added a `fulfilment_channel` VARCHAR(30) column (values: DEALER, DIRECT, OEM). The AWS Glue job uses a static schema mapping in its DynamicFrame cast step. On the next run the schema assertion failed with `GlueException: Column not found in target schema: fulfilment_channel`. The Raw Orders Ingestion job has not completed since 04:30 UTC, leaving today\'s orders absent from the data warehouse. Downstream Finance Daily Close and Customer Transform Pipeline are both blocked.',
    suggested_steps: ['In the Glue script, add `fulfilment_channel` to the schema mapping dict with type StringType.','Update the Redshift/Athena sink table DDL: `ALTER TABLE raw.orders ADD COLUMN fulfilment_channel VARCHAR(30)`.','Test with a Glue development endpoint against a sample of today\'s extract before promoting the job change.','Trigger a manual backfill run for the missed window once the schema fix is deployed.','Set up a Glue schema drift alert using AWS Glue Data Quality rules: `ColumnCount >= expected`.'],
    services_impacted: ['Finance Daily Close', 'Customer Transform Pipeline', 'Dealer Network Sync'],
  },
  {
    _id: 1003,
    title: 'Retail Transaction Ingest exceeded 2h timeout processing Black Friday catch-up batch',
    client_name: 'CocoBlu Retail', pipeline_name: 'Retail Transaction Ingest', environment: 'prod',
    severity: 'warning', cloud_service: 'AWS Glue', pattern_tag: 'timeout',
    active_branch: 'main',
    root_cause: 'A 3-day historical backfill of retail transaction records (approx 42M rows) was queued from the POS remediation project and executed as a single Glue job run. The job hit the 2-hour AWS Glue timeout limit with 18% of rows remaining unprocessed. The incomplete run left a mixed state in the transactions fact table: days 1-2 of the backfill were committed, day 3 was partially written. The Finance Reconcile Pipeline consumed the partial data and produced an unbalanced reconciliation report for that period.',
    suggested_steps: ['Split the remaining backfill into day-sized partitions and run as separate Glue jobs with explicit `--partition_date` parameters.','Add a job bookmark checkpoint at partition boundaries to allow resume on timeout.','Increase the Glue job `--timeout` parameter to 240 minutes for backfill runs only (use separate job definition).','Identify and delete the partially written day-3 partition before re-running to avoid duplicates.','Set a row-count assertion in the Finance Reconcile Pipeline to halt if transaction count for a date deviates > 5% from POS source counts.'],
    services_impacted: ['Finance Reconcile Pipeline', 'Store Performance Pipeline', 'Promotions Analytics'],
  },
  {
    _id: 1004,
    title: 'BI Aggregation Pipeline volume spike — ODI job processed 3.1M rows vs 820K baseline',
    client_name: 'GoldenSands', pipeline_name: 'BI Aggregation Pipeline', environment: 'prod',
    severity: 'warning', cloud_service: 'Oracle Data Integrator', pattern_tag: 'volume_anomaly',
    active_branch: 'main',
    root_cause: 'The BI Aggregation ODI package processed 3.1M rows in last night\'s run against a 30-day average of 820K rows — a 278% spike. Investigation of the source financial transactions table shows that a period-end restatement for Q1 FY26 was loaded directly into the source OLTP by the Finance team without coordinating with the data team. The restatement inserted revised records with new row IDs rather than updating existing ones, causing the full population of revised records to be treated as net-new by ODI\'s incremental load logic.',
    suggested_steps: ['Determine the scope of the restatement: identify all rows with `is_restatement = TRUE` or `source_batch_id` matching the Q1 restatement batch.','Remove the duplicate original rows from the data warehouse fact tables where restated versions now exist.','Re-run the BI Aggregation package in full-refresh mode for the Q1 period to produce clean aggregates.','Notify the Management Reporting team that Q1 figures in the BI tool may be overstated until the reprocessing completes.','Establish a data governance process requiring the Finance team to notify the data engineering team before loading restatements directly to OLTP.'],
    services_impacted: ['Management Reporting Sync', 'Regulatory Reporting Load', 'Financial Consolidation'],
  },
  {
    _id: 1005,
    title: 'Device Health Aggregate — NULL device_firmware_version violating NOT NULL constraint',
    client_name: 'Rotimatic', pipeline_name: 'Device Health Aggregate', environment: 'prod',
    severity: 'warning', cloud_service: 'AWS Step Functions', pattern_tag: 'null_constraint',
    active_branch: 'main',
    root_cause: 'A firmware rollback was pushed to 312 Rotimatic devices on 14 April that temporarily set `device_firmware_version` to NULL in the device registry until the rollback completed. The IoT Telemetry Ingest job captured telemetry during this window and passed NULL firmware versions into the Device Health Aggregate Step Functions workflow. The final Lambda step that writes to the `device_health_facts` DynamoDB table failed with `ValidationException: One or more parameter values were invalid: An AttributeValue may not contain a null value`.',
    suggested_steps: ['In the Step Functions Lambda function, add a COALESCE/default: replace NULL `device_firmware_version` with `"ROLLBACK_IN_PROGRESS"` before the DynamoDB write.','Identify the 312 devices affected by the firmware rollback and confirm their firmware version is now populated correctly post-rollback.','Re-process the affected telemetry window by re-running the Step Functions execution with a corrected input payload for the NULL records.','Add a data quality step at the start of the workflow that checks for NULL device identifiers and routes them to a dead-letter queue rather than failing the entire execution.','Coordinate with the firmware team to hold back telemetry ingestion or send a placeholder version string during rollback windows.'],
    services_impacted: ['Quality Monitoring Pipeline', 'Predictive Maintenance Load', 'Support Ticket Correlator'],
  },
  {
    _id: 1006,
    title: 'Metrics Ingestion Pipeline — linked service config drift after Azure maintenance window',
    client_name: 'PipelineIQ Internal', pipeline_name: 'Metrics Ingestion Pipeline', environment: 'prod',
    severity: 'info', cloud_service: 'Azure Data Factory', pattern_tag: 'config_drift',
    active_branch: 'main',
    root_cause: 'An Azure planned maintenance event on 14 April rotated the managed identity credential for the ADF integration runtime used by the Metrics Ingestion Pipeline. The ADF linked service for Azure SQL still referenced the old managed identity object ID. On the next pipeline run the linked service connection test failed with `ManagedIdentityCredentialAuthenticationFailedException`. The pipeline has not ingested platform metrics since 20:00 UTC on 14 April, leaving a 10-hour gap in the internal observability dashboard.',
    suggested_steps: ['In ADF, navigate to the Metrics Ingestion linked service and update the managed identity reference to the new object ID from the Azure portal.','Run the ADF linked service connection test to confirm successful authentication.','Trigger a manual backfill run of the Metrics Ingestion Pipeline for the 20:00 UTC gap window.','Validate the Internal Reporting Aggregate job picks up the backfilled metrics correctly.','Set up an Azure Monitor alert for ADF linked service authentication failures to catch this class of issue within 15 minutes of occurrence.'],
    services_impacted: ['Internal Observability Dashboard', 'Cost Analytics Pipeline', 'Session Analytics Pipeline'],
  },
  {
    _id: 1007,
    title: 'Revenue Attribution Model — service principal token revoked during Entra ID audit',
    client_name: 'Spirax Group', pipeline_name: 'Revenue Attribution Model', environment: 'prod',
    severity: 'critical', cloud_service: 'Azure Databricks', pattern_tag: 'auth_failure',
    active_branch: 'main',
    root_cause: 'A routine Entra ID (Azure AD) security audit on 15 April identified 6 service principals with stale credentials and revoked their tokens as a remediation action. The Spirax Group Revenue Attribution Model Databricks job uses one of these service principals to authenticate against Azure Key Vault for retrieving database connection strings. With the token revoked, the Databricks job fails at the secret fetch step with `azure.core.exceptions.ClientAuthenticationError: (Unauthorized) Access denied`. All downstream monthly revenue reports are blocked.',
    suggested_steps: ['Rotate the service principal secret in Entra ID: generate a new client secret with a 12-month expiry.','Update the secret value in Azure Key Vault: `az keyvault secret set --vault-name <kv-name> --name spirax-adf-sp-secret --value <new-secret>`.','Update the Databricks secret scope that references this credential: `databricks secrets put --scope spirax-prod --key sp-client-secret`.','Re-run the Revenue Attribution Model Databricks job and confirm it completes successfully through the Key Vault auth step.','Configure an Entra ID credential expiry alert (30-day warning) to prevent uncoordinated revocation events.'],
    services_impacted: ['Monthly Revenue Reports', 'Finance ERP Connector', 'Rebate Calculation Transform'],
  },
  {
    _id: 1008,
    title: 'Finance Daily Close — NULL `cost_centre_code` on 1,847 rows blocking GL reconciliation',
    client_name: 'Greaves Cotton', pipeline_name: 'Finance Daily Close', environment: 'prod',
    severity: 'critical', cloud_service: 'AWS Glue', pattern_tag: 'null_constraint',
    active_branch: 'main',
    root_cause: 'The Greaves Cotton ERP migration team added a new business unit (BU-07: EV Aftermarket) in March. The cost centre mapping table was updated in the source ERP but the Glue ETL reference join that maps cost centres to their codes was not updated to include BU-07 entries. The join produces NULL `cost_centre_code` values for all transactions tagged to BU-07 — 1,847 rows in today\'s run. The Finance Daily Close job enforces NOT NULL on `cost_centre_code` in the Redshift target table, causing the entire daily batch to fail at the COPY step.',
    suggested_steps: ['Add BU-07 cost centre mappings to the Glue reference table S3 file (cost_centre_lookup.json) and redeploy.','Run the Finance Daily Close job in test mode against today\'s batch to confirm the NULL count drops to zero.','If the mapping data is not immediately available, apply a temporary default `cost_centre_code` of \'BU-07-PENDING\' with a NOT NULL relaxation migration, unblock the batch, and reprocess once the correct codes are confirmed.','Notify the Finance team that today\'s reconciliation will be 2-4 hours delayed.','Add a pre-load DQ step to the Glue job that fails fast with a clear error message if any cost_centre_code is NULL, before attempting the Redshift COPY.'],
    services_impacted: ['GL Reconciliation Service', 'Finance Reporting Dashboard', 'Compliance Audit Export'],
  },
  {
    _id: 1009,
    title: 'POS Integration Pipeline — orphaned transaction records failing FK constraint on store_id',
    client_name: 'CocoBlu Retail', pipeline_name: 'POS Integration Pipeline', environment: 'prod',
    severity: 'warning', cloud_service: 'AWS Glue', pattern_tag: 'referential_integrity',
    active_branch: 'main',
    root_cause: 'Three CocoBlu Retail stores (IDs: STR-441, STR-442, STR-443) were closed on 12 April and their records were deleted from the `dim_stores` table as part of the store closure process. However, POS transaction records for these stores continue to arrive in the daily extract because the POS systems at these locations remained online processing void/return transactions for 72 hours post-closure. The Glue job that loads transactions references `dim_stores.store_id` via a FK constraint, causing 2,341 orphaned transaction records to be rejected on each daily run.',
    suggested_steps: ['Insert soft-delete placeholder records for STR-441, STR-442, STR-443 in `dim_stores` with `is_active = FALSE` and `closure_date = 2026-04-12` to satisfy the FK constraint.','Reprocess the rejected transaction batches from 12–15 April once the placeholder store records are inserted.','Update the store closure runbook to include a 5-day delay between logical deactivation and physical deletion from dim_stores, to cover the POS wind-down window.','Add a pre-load check in the Glue job to route orphaned transactions to a quarantine table rather than failing the entire batch.','Coordinate with the Store Operations team to establish a data notification process when stores are scheduled for closure.'],
    services_impacted: ['Finance Reconcile Pipeline', 'Store Performance Pipeline', 'Returns Processing Pipeline'],
  },
  {
    _id: 1010,
    title: 'Financial Consolidation ODI package — parameter file out of sync after environment promotion',
    client_name: 'GoldenSands', pipeline_name: 'Financial Consolidation', environment: 'prod',
    severity: 'warning', cloud_service: 'Oracle Data Integrator', pattern_tag: 'config_drift',
    active_branch: 'main',
    root_cause: 'An ODI package promotion from staging to production on 14 April used an automated deployment script that correctly updated the package XML but did not regenerate the `PROD_FC_PARAMS.properties` file. The properties file still references the staging Oracle DB connection alias (`STGDB1`) instead of the production alias (`PRODDB1`). The Financial Consolidation package ran successfully in test mode (which validates syntax only) but failed at runtime with `ODI-1226: Step LOAD_GL_BALANCES fails after 1 attempt(s): Connection refused: STGDB1`.  ',
    suggested_steps: ['Update `PROD_FC_PARAMS.properties`: change `source.db.alias=STGDB1` to `source.db.alias=PRODDB1`.','Reload the ODI Scenario with the corrected properties file and run a connectivity test.','Re-execute the Financial Consolidation package for today\'s date and validate row counts against the staging run.','Update the deployment script to include a post-promotion validation step that diffs the properties file against a known-good template.','Add an ODI connection alias validation step at the start of every package that logs and fails fast if it detects a non-production alias in the prod environment.'],
    services_impacted: ['Regulatory Reporting Load', 'Management Reporting Sync', 'Data Warehouse Refresh'],
  },
  {
    _id: 1011,
    title: 'IoT Telemetry Ingest timeout — device count spike from firmware OTA update to 18,200 devices',
    client_name: 'Rotimatic', pipeline_name: 'IoT Telemetry Ingest', environment: 'prod',
    severity: 'warning', cloud_service: 'AWS Glue', pattern_tag: 'timeout',
    active_branch: 'main',
    root_cause: 'A firmware OTA update was pushed to 4,200 additional devices on 14 April, increasing the active device fleet from ~14,000 to ~18,200 devices. The IoT Telemetry Ingest Glue job is configured with a fixed DPU allocation of 10 and a 60-minute timeout that was sized for the previous fleet size. The increased volume of telemetry events caused the job to exceed its timeout with 23% of messages unprocessed. The Baking Session Enrichment and Device Health Aggregate jobs downstream consumed an incomplete telemetry set for that run window.',
    suggested_steps: ['Increase the Glue job `MaxCapacity` from 10 to 16 DPUs to handle the expanded device fleet: `aws glue update-job --job-name rotimatic-iot-telemetry --job-update \'{"MaxCapacity": 16.0}\'`.','Extend the timeout to 90 minutes: `"Timeout": 90` in the job update payload.','Enable Glue auto-scaling to dynamically adjust DPU allocation based on input data volume.','Re-run the incomplete window by providing the timestamp range as job parameters to process the 23% of missed messages.','Set up a CloudWatch alarm that fires when the Glue job run duration exceeds 80% of the timeout threshold, giving an early warning before the next timeout.'],
    services_impacted: ['Baking Session Enrichment', 'Device Health Aggregate', 'Predictive Maintenance Load'],
  },
  {
    _id: 1012,
    title: 'Session Analytics Pipeline — volume anomaly, 0 rows processed after Azure Synapse pause event',
    client_name: 'PipelineIQ Internal', pipeline_name: 'Session Analytics Pipeline', environment: 'dev',
    severity: 'info', cloud_service: 'Azure Data Factory', pattern_tag: 'volume_anomaly',
    active_branch: 'feature/session-v2',
    root_cause: 'The Azure Synapse dedicated SQL pool used by the internal Session Analytics Pipeline in the dev environment was automatically paused by the cost management policy at 22:00 UTC (idle threshold: 2 hours). The ADF pipeline triggered at 23:00 UTC and the copy activity connected successfully to the paused Synapse pool, but the resume-on-connect operation took 14 minutes — longer than the activity\'s default 10-minute connection timeout. The copy activity wrote 0 rows and exited cleanly (no error), causing a false-success run. The Internal Reporting Aggregate consumed the empty session dataset and produced a zero-session report.',
    suggested_steps: ['Add a pre-copy ADF Web Activity that calls the Synapse REST API to resume the pool and poll until status = Online before the copy activity begins.','Increase the copy activity connection timeout from 10 minutes to 25 minutes to handle resume latency.','Add a post-copy Validation Activity that checks the rows-written metric and fails the pipeline if count is 0.','Consider adjusting the Synapse auto-pause threshold from 2 hours to 4 hours for the dev environment to reduce resume frequency.','Add a pipeline run annotation in ADF Monitor when a Synapse resume event occurs so the data team can correlate slow runs with pool state transitions.'],
    services_impacted: ['Internal Observability Dashboard', 'Internal Reporting Aggregate'],
  },
  {
    _id: 1013,
    title: 'Supplier Data Reconcile — referential integrity violation on supplier_tier foreign key',
    client_name: 'Spirax Group', pipeline_name: 'Supplier Data Reconcile', environment: 'staging',
    severity: 'warning', cloud_service: 'Azure Data Factory', pattern_tag: 'referential_integrity',
    active_branch: 'main',
    root_cause: 'The Spirax procurement team introduced a new supplier tier (TIER-5: Strategic Partners) in the source ERP on 14 April. The `dim_supplier_tier` reference table in the staging warehouse was not updated before the Supplier Data Reconcile pipeline ran. When the pipeline attempted to load supplier records referencing TIER-5, the FK constraint on `fact_supplier.supplier_tier_id` rejected all 47 TIER-5 supplier records. The Demand Forecast Pipeline in staging is consuming supplier data without these 47 entries, producing understated demand forecasts for the new strategic partner tier.',
    suggested_steps: ['Insert the TIER-5 supplier tier record into `dim_supplier_tier` in staging: `INSERT INTO dim_supplier_tier VALUES (5, \'TIER-5\', \'Strategic Partners\', GETDATE())`.','Re-run the Supplier Data Reconcile pipeline for the affected date to load the previously rejected TIER-5 records.','Validate the Demand Forecast Pipeline output includes the new strategic partners in its projections.','Add a lookup-table completeness check to the Supplier Data Reconcile pipeline that validates all FK reference values in the source are present in the target dimension before the main load.','Update the ERP-to-warehouse change coordination process to include reference table updates as a prerequisite step for any new master data category.'],
    services_impacted: ['Demand Forecast Pipeline', 'Finance ERP Connector', 'Inventory Sync Pipeline'],
  },
  {
    _id: 1014,
    title: 'ERP Integration Pipeline — AWS Step Functions execution timeout on large GL extract',
    client_name: 'Greaves Cotton', pipeline_name: 'ERP Integration Pipeline', environment: 'prod',
    severity: 'warning', cloud_service: 'AWS Step Functions', pattern_tag: 'timeout',
    active_branch: 'main',
    root_cause: 'The Greaves Cotton ERP Integration Step Functions workflow includes a synchronous Lambda invocation step that extracts GL entries from the SAP HANA source via JDBC. The March quarter-end resulted in 28M GL entries being available for extraction — 4× the typical daily volume. The Lambda function hit its 15-minute execution limit with 62% of records extracted. The Step Functions workflow caught the Lambda timeout error and retried twice (both timed out), before marking the execution as failed. The Finance Daily Close job downstream has been waiting on the GL extract output for 6 hours.',
    suggested_steps: ['Refactor the Lambda extraction step to use pagination: extract in 500K-row chunks and write each chunk to S3, then trigger the next chunk via a Step Functions iterator loop.','For the immediate unblock, run the extraction directly from a Glue job (no 15-min Lambda limit) with the date range partition as a parameter.','Update the Step Functions state machine to use a Glue job task (`glue:startJobRun`) for large extract operations instead of Lambda.','Add a row-count check at the Step Functions start: if expected GL entry count > 5M, automatically route to the Glue job path.','Set a CloudWatch alarm for Step Functions execution duration exceeding 30 minutes on this workflow.'],
    services_impacted: ['Finance Daily Close', 'Compliance Audit Export', 'GL Reconciliation Service'],
  },
]

function getLiveEphemeralIncidents() {
  const bucket     = Math.floor(Date.now() / BUCKET_MS)
  const poolLen    = EPHEMERAL_POOL.length
  const results    = []

  // Three consecutive pool positions represent open → investigating → resolved
  const positions = [
    { offset: 0, status: 'open',          assigned_to: null,                                    resolved_at: null, resolution_time_minutes: null },
    { offset: 1, status: 'investigating', assigned_to: '_auto_',                                resolved_at: null, resolution_time_minutes: null },
    { offset: 2, status: 'resolved',      assigned_to: '_auto_', resolved_at: '_auto_', resolution_time_minutes: '_auto_' },
  ]

  positions.forEach(({ offset, status, assigned_to, resolved_at, resolution_time_minutes }) => {
    const bucketN  = bucket - offset
    const template = EPHEMERAL_POOL[((bucketN % poolLen) + poolLen) % poolLen]
    const eng      = CLIENT_ENGINEERS[template.client_name] || ['mohan']
    // Pick engineer deterministically from bucket
    const assignee = eng[bucketN % eng.length]
    const createdAt = bucketStart(bucketN)

    const resolvedAtVal = status === 'resolved'
      ? new Date(bucketN * BUCKET_MS + 90 * 60 * 1000).toISOString()
      : null
    const resMins = status === 'resolved'
      ? 85 + (bucketN % 60)
      : null

    results.push({
      ...template,
      id: template._id + bucketN * 100, // unique per bucket
      status,
      created_at: createdAt,
      resolved_at: resolvedAtVal,
      resolution_time_minutes: resMins,
      assigned_to: status === 'open' ? null : assignee,
      people_involved: [assignee],
      slack_thread: slackThread(
        [Object.values(USERS).find(u => u.username === assignee)?.name || assignee],
        template.title.substring(0, 50),
        template.pattern_tag
      ),
      notification_log: notifLog(template.client_name, template.title.substring(0, 60)),
    })
  })

  return results
}

// Analytics helpers
export function getDailyRuns(user) {
  const accessible = getAccessibleClientIds(user)
  const dailyMap = {}
  accessible.forEach(cid => {
    ;(PIPELINES[cid] || []).forEach(p => {
      p.run_history.forEach(r => {
        if (!dailyMap[r.date]) dailyMap[r.date] = { date: r.date, total: 0, failed: 0 }
        dailyMap[r.date].total++
        if (r.status === 'failed') dailyMap[r.date].failed++
      })
    })
  })
  return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)).slice(-14)
}

export function getAccessibleClientIds(user) {
  if (!user) return []
  if (user.client_access.includes('__all__')) return CLIENTS.map(c => c.id)
  return CLIENTS.filter(c => user.client_access.includes(c.name)).map(c => c.id)
}

export function getAccessibleClients(user) {
  if (!user) return []
  if (user.client_access.includes('__all__')) return CLIENTS
  return CLIENTS.filter(c => user.client_access.includes(c.name))
}

export function getAccessibleIncidents(user) {
  if (!user) return []
  const accessible = getAccessibleClients(user).map(c => c.name)
  const staticOnes = INCIDENTS.filter(i => accessible.includes(i.client_name))
  const liveOnes   = getLiveEphemeralIncidents().filter(i => accessible.includes(i.client_name))
  // Live incidents at top so they're visible immediately; deduplicate by id
  const seen = new Set()
  return [...liveOnes, ...staticOnes].filter(i => {
    if (seen.has(i.id)) return false
    seen.add(i.id)
    return true
  })
}

export function getMTTR(user) {
  const incidents = getAccessibleIncidents(user).filter(i => i.resolution_time_minutes)
  if (!incidents.length) return 0
  return Math.round(incidents.reduce((s, i) => s + i.resolution_time_minutes, 0) / incidents.length)
}

export function getPatternData(user) {
  const incidents = getAccessibleIncidents(user)
  const patterns = {}
  incidents.forEach(i => {
    patterns[i.pattern_tag] = (patterns[i.pattern_tag] || 0) + 1
  })
  return Object.entries(patterns).map(([name, value]) => ({ name, value }))
}

export function getClientHealth(user) {
  const liveOnes = getLiveEphemeralIncidents()
  return getAccessibleClients(user).map(c => {
    const pipes = PIPELINES[c.id] || []
    const incidents = [
      ...liveOnes.filter(i => i.client_name === c.name),
      ...INCIDENTS.filter(i => i.client_name === c.name),
    ]
    const openIncidents = incidents.filter(i => i.status !== 'resolved')
    const healthyPipes = pipes.filter(p => {
      const last = p.run_history[p.run_history.length - 1]
      return last?.status === 'success'
    })
    const failedPipes = pipes.length - healthyPipes.length
    const lastRun = pipes.reduce((latest, p) => {
      const last = p.run_history[p.run_history.length - 1]
      return last?.date > latest ? last.date : latest
    }, '')
    // SLA: % of last 7 days runs that succeeded
    const recentRuns = pipes.flatMap(p => p.run_history.slice(-7))
    const sla = recentRuns.length ? Math.round(recentRuns.filter(r => r.status === 'success').length / recentRuns.length * 100) : 100
    return { ...c, healthyPipes: healthyPipes.length, failedPipes, openIncidents: openIncidents.length, lastRun, sla, totalPipes: pipes.length }
  })
}

export const PATTERN_COLORS = {
  schema_drift: '#7C5CBF',
  null_constraint: '#F97316',
  volume_anomaly: '#0EA5E9',
  dependency_violation: '#EF4444',
  referential_integrity: '#22C55E',
  scd_explosion: '#F59E0B',
  auth_failure: '#EC4899',
  timeout: '#8B5CF6',
  config_drift: '#6EE7B7',
}

export const PATTERN_LABELS = {
  schema_drift: 'Schema Drift',
  null_constraint: 'Null Constraint',
  volume_anomaly: 'Volume Anomaly',
  dependency_violation: 'Dependency Violation',
  referential_integrity: 'Referential Integrity',
  scd_explosion: 'SCD Explosion',
  auth_failure: 'Auth Failure',
  timeout: 'Timeout',
  config_drift: 'Config Drift',
}

export const RECURRING_PATTERN_SUMMARIES = {
  dependency_violation: {
    client: 'Spirax Group',
    count: 5,
    summary: 'Spirax Group has experienced 5 dependency_violation incidents over the last 30 days, all stemming from the same ADF trigger chain that lacks partition availability gating between pipeline stages. When the upstream Databricks cluster undergoes autoscale events, a 30–50 minute delay cascades to all downstream jobs. The permanent fix (conditional trigger logic with explicit partition checks) has been scoped but not yet deployed, making recurrence likely until the sprint delivers.',
  },
  auth_failure: {
    client: 'GoldenSands',
    count: 4,
    summary: 'GoldenSands has logged 4 auth_failure incidents in the last 7 days, all caused by Oracle GoldenGate and ODI service accounts not being updated when the Oracle Vault rotates credentials every 90 days. The rotation is automated but does not propagate to the GoldenGate credential store automatically. Until OCI Secrets integration is implemented to push updated credentials to GGSCI on rotation, every quarterly rotation will trigger this incident class.',
  },
}
