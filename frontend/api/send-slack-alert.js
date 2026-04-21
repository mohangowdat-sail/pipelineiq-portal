// ── Pattern intelligence ─────────────────────────────────────────────────────

const PATTERN_META = {
  schema_drift: {
    label: 'Schema Drift',
    error_codes: ['SCHEMA_VALIDATION_FAILED', 'ADF-COPY-SCHEMA-MISMATCH-001'],
    failure_stage: 'Schema Validation / Copy Activity — sink DDL out of sync with source',
    confidence: 'high',
    etr: [120, 240],
    diagnosis: (inc) =>
      `The upstream source for \`${inc.pipeline_name}\` had a schema change (new, renamed, or type-altered columns) that was not coordinated with the sink table DDL. ` +
      `The copy/load activity performs a schema assertion at execution start and halts on any column delta. ` +
      `Check the source changelog or CRM/ERP deployment notes from the last 48h for undocumented schema migrations.`,
    code_fix: (inc) => {
      const svc = inc.cloud_service || ''
      if (svc.includes('Oracle') || svc.includes('Data Integrator')) return (
        `-- Identify missing columns in sink vs source\n` +
        `SELECT column_name FROM all_tab_columns WHERE table_name = 'SOURCE_TABLE'\n` +
        `MINUS\n` +
        `SELECT column_name FROM all_tab_columns WHERE table_name = 'SINK_TABLE';\n\n` +
        `-- Add missing columns (adjust types to match source DDL)\n` +
        `ALTER TABLE SINK_TABLE ADD new_column_1 VARCHAR2(100) DEFAULT NULL;\n` +
        `ALTER TABLE SINK_TABLE ADD new_column_2 NUMBER(18,2)  DEFAULT NULL;`
      )
      if (svc.includes('AWS')) return (
        `# Detect column delta (run in Glue or via boto3)\n` +
        `import boto3, json\n` +
        `glue = boto3.client('glue')\n` +
        `schema = glue.get_table(DatabaseName='your_db', Name='source_table')['Table']['StorageDescriptor']['Columns']\n` +
        `print(json.dumps([c['Name'] for c in schema], indent=2))\n\n` +
        `# Apply missing columns to Redshift/Athena sink\n` +
        `ALTER TABLE sink_schema.target_table ADD COLUMN new_col_1 VARCHAR(255);\n` +
        `ALTER TABLE sink_schema.target_table ADD COLUMN new_col_2 BIGINT DEFAULT 0;`
      )
      // Azure default
      return (
        `-- Identify column delta between source and sink\n` +
        `SELECT c.COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS c\n` +
        `WHERE c.TABLE_NAME = 'source_view'\n` +
        `  AND c.COLUMN_NAME NOT IN (\n` +
        `    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'sink_table'\n` +
        `);\n\n` +
        `-- Add missing columns to sink (adjust types from source DDL)\n` +
        `ALTER TABLE dbo.sink_table ADD new_column_1 NVARCHAR(100) NULL;\n` +
        `ALTER TABLE dbo.sink_table ADD new_column_2 BIGINT        NULL;\n` +
        `ALTER TABLE dbo.sink_table ADD new_column_3 DATETIME2     NULL;`
      )
    },
  },

  null_constraint: {
    label: 'Null Constraint Violation',
    error_codes: ['SQL-23000: NOT NULL CONSTRAINT VIOLATION', 'INSERT_REJECTED_NULL_COLUMN'],
    failure_stage: 'Data Load / Insertion Layer — NOT NULL constraint on target table',
    confidence: 'high',
    etr: [60, 180],
    diagnosis: (inc) =>
      `\`${inc.pipeline_name}\` is attempting to insert rows where one or more columns have NULL values, but the target table enforces NOT NULL on those columns. ` +
      `This typically means the source system introduced records with missing mandatory fields, or a transformation step is producing NULLs ` +
      `due to a mismatched join key or an unhandled COALESCE. Run a NULL audit on the staging dataset before the load step.`,
    code_fix: (inc) => {
      const svc = inc.cloud_service || ''
      if (svc.includes('Databricks') || svc.includes('Glue') || svc.includes('Step')) return (
        `# Databricks / PySpark — audit NULLs before load\n` +
        `null_counts = df.select([\n` +
        `    F.count(F.when(F.col(c).isNull(), c)).alias(c) for c in df.columns\n` +
        `]).collect()[0].asDict()\n` +
        `null_cols = {k: v for k, v in null_counts.items() if v > 0}\n` +
        `assert not null_cols, f"NULL values found in NOT NULL columns: {null_cols}"\n\n` +
        `# Apply safe default before load (unblocks pipeline; raise ticket to fix upstream)\n` +
        `df = df.fillna({'category_code': 'UNCATEGORISED', 'status_flag': 'UNKNOWN'})`
      )
      return (
        `-- Identify NULL rows before the failing INSERT\n` +
        `SELECT COUNT(*) AS null_count, column_name\n` +
        `FROM staging.pre_load_view\n` +
        `WHERE column_name IS NULL\n` +
        `GROUP BY column_name;\n\n` +
        `-- Quick unblock: apply default to NULL rows in staging\n` +
        `UPDATE staging.pre_load_view\n` +
        `SET    category_code = 'UNCATEGORISED'\n` +
        `WHERE  category_code IS NULL;\n\n` +
        `-- Long-term: add default constraint to target column\n` +
        `ALTER TABLE dbo.target_table\n` +
        `  ADD CONSTRAINT df_category_code DEFAULT 'UNCATEGORISED' FOR category_code;`
      )
    },
  },

  dependency_violation: {
    label: 'Dependency Violation',
    error_codes: ['PARTITION_NOT_READY', 'UPSTREAM_DELAY_THRESHOLD_EXCEEDED', 'EMPTY_DELTA_READ_DETECTED'],
    failure_stage: 'Orchestration / Trigger Layer — upstream partition unavailable at scheduled execution time',
    confidence: 'medium',
    etr: [120, 360],
    diagnosis: (inc) =>
      `\`${inc.pipeline_name}\` triggered while its upstream dependency had not yet completed, causing the job to read an empty or stale partition. ` +
      `This is a recurring pattern in this orchestration chain — the upstream pipeline has variable run duration (cluster cold-start, data volume spikes) ` +
      `but the downstream trigger uses a fixed schedule rather than a partition-readiness gate. ` +
      `Inspect the upstream job's last 5 run durations and compare against the fixed schedule gap.`,
    code_fix: (inc) => {
      const svc = inc.cloud_service || ''
      if (svc.includes('Databricks')) return (
        `# Add partition readiness check at the start of the downstream notebook\n` +
        `from delta.tables import DeltaTable\n` +
        `import time\n\n` +
        `def wait_for_partition(table_path, partition_col, partition_val, timeout_s=1800, interval_s=60):\n` +
        `    deadline = time.time() + timeout_s\n` +
        `    while time.time() < deadline:\n` +
        `        df = spark.read.format('delta').load(table_path)\n` +
        `        if df.filter(f"{partition_col} = '{partition_val}'").count() > 0:\n` +
        `            return True\n` +
        `        time.sleep(interval_s)\n` +
        `    raise TimeoutError(f"Upstream partition {partition_val} not ready after {timeout_s}s")\n\n` +
        `wait_for_partition('/mnt/delta/upstream_table', 'run_date', dbutils.widgets.get('run_date'))`
      )
      return (
        `// ADF — replace fixed schedule trigger with tumbling window + dependency gate\n` +
        `// In the downstream pipeline JSON, add a dependency activity:\n` +
        `{\n` +
        `  "name": "Check_Upstream_Partition",\n` +
        `  "type": "Until",\n` +
        `  "typeProperties": {\n` +
        `    "expression": { "value": "@greater(activity('Get_Row_Count').output.firstRow.cnt, 0)", "type": "Expression" },\n` +
        `    "timeout": "0.01:00:00",\n` +
        `    "activities": [\n` +
        `      { "name": "Get_Row_Count", "type": "Lookup", "linkedServiceName": "...", "query": "SELECT COUNT(*) AS cnt FROM upstream_table WHERE run_date = '@{pipeline().parameters.run_date}'" },\n` +
        `      { "name": "Wait_60s", "type": "Wait", "typeProperties": { "waitTimeInSeconds": 60 } }\n` +
        `    ]\n` +
        `  }\n` +
        `}`
      )
    },
  },

  volume_anomaly: {
    label: 'Volume Anomaly',
    error_codes: ['ROW_COUNT_DEVIATION_EXCEEDS_3SIGMA', 'VOLUME_THRESHOLD_BREACH'],
    failure_stage: 'Data Quality Gate — row count or byte volume outside 3σ statistical bounds',
    confidence: 'medium',
    etr: [90, 240],
    diagnosis: (inc) =>
      `\`${inc.pipeline_name}\` processed a data volume that deviates significantly (>3σ) from the rolling 30-day baseline. ` +
      `This requires disambiguation: is this a legitimate upstream bulk load (backfill, batch catch-up), or is it data loss / duplication? ` +
      `Pull the source system's row count for the same date range and compare against historical averages. ` +
      `A volume drop typically indicates upstream truncation or extraction failure; a spike typically indicates a reprocessing event or deduplication regression.`,
    code_fix: () => (
      `-- Statistical baseline check (run against source and sink)\n` +
      `WITH daily_counts AS (\n` +
      `  SELECT run_date, COUNT(*) AS row_count\n` +
      `  FROM   fact_table\n` +
      `  WHERE  run_date >= DATEADD(day, -30, GETDATE())\n` +
      `  GROUP BY run_date\n` +
      `),\n` +
      `stats AS (\n` +
      `  SELECT AVG(row_count) AS avg_cnt, STDEV(row_count) AS std_cnt FROM daily_counts\n` +
      `)\n` +
      `SELECT d.run_date, d.row_count,\n` +
      `       ABS(d.row_count - s.avg_cnt) / NULLIF(s.std_cnt, 0) AS z_score\n` +
      `FROM   daily_counts d, stats s\n` +
      `ORDER BY z_score DESC;`
    ),
  },

  referential_integrity: {
    label: 'Referential Integrity Violation',
    error_codes: ['FK_CONSTRAINT_VIOLATION', 'ORPHANED_RECORD_DETECTED'],
    failure_stage: 'Relational Load Layer — FK constraint failure on target',
    confidence: 'high',
    etr: [120, 300],
    diagnosis: (inc) =>
      `\`${inc.pipeline_name}\` is inserting child records before their parent records exist in the target, or referencing parent IDs that have been deleted. ` +
      `This typically happens when multi-table pipelines load in the wrong dependency order, ` +
      `or when CDC (change data capture) events arrive out of sequence. ` +
      `Identify the orphaned foreign keys and determine whether the parent record is missing from the source extract or simply hasn't been loaded yet.`,
    code_fix: () => (
      `-- Identify orphaned records before load\n` +
      `SELECT child.id, child.parent_id\n` +
      `FROM   staging.child_records child\n` +
      `WHERE  NOT EXISTS (\n` +
      `  SELECT 1 FROM dbo.parent_table p WHERE p.id = child.parent_id\n` +
      `);\n\n` +
      `-- Option 1: Re-order the load — parents first\n` +
      `-- Run the parent pipeline activity before the child activity in ADF/Glue.\n\n` +
      `-- Option 2: Defer FK check during bulk load (SQL Server)\n` +
      `ALTER TABLE dbo.child_table NOCHECK CONSTRAINT fk_parent_id;\n` +
      `-- ... run load ...\n` +
      `ALTER TABLE dbo.child_table WITH CHECK CHECK CONSTRAINT fk_parent_id;`
    ),
  },

  scd_explosion: {
    label: 'SCD Type-2 Explosion',
    error_codes: ['SCD_TYPE2_CARDINALITY_BREACH', 'MERGE_FANOUT_DETECTED'],
    failure_stage: 'Dimension Processing Layer — SCD Type-2 merge generating runaway new versions',
    confidence: 'medium',
    etr: [240, 480],
    diagnosis: (inc) =>
      `The SCD Type-2 merge in \`${inc.pipeline_name}\` is treating a volatile column as part of its change-detection hash, ` +
      `causing every row to register as "changed" on every run. This is a common issue when audit timestamps, floating-point fields, ` +
      `or system-generated computed columns are inadvertently included in the hash key. ` +
      `The result is unbounded cardinality growth in the dimension table and downstream aggregation failures. ` +
      `Inspect the hash/checksum function in the merge logic and exclude non-semantic columns.`,
    code_fix: () => (
      `-- Identify the volatile column causing runaway versions\n` +
      `SELECT business_key, COUNT(*) AS version_count\n` +
      `FROM   dim_table\n` +
      `WHERE  is_current = 1\n` +
      `GROUP BY business_key\n` +
      `HAVING COUNT(*) > 1  -- should always be 1 for active SCD2\n` +
      `ORDER BY version_count DESC;\n\n` +
      `-- Fix: exclude volatile columns from the change-detection hash\n` +
      `-- Before (wrong — includes last_updated_ts):\n` +
      `-- HASHBYTES('SHA2_256', CONCAT(name, status, last_updated_ts))\n\n` +
      `-- After (correct — semantic business attributes only):\n` +
      `SET change_hash = HASHBYTES('SHA2_256', CONCAT(\n` +
      `  ISNULL(CAST(name       AS NVARCHAR(MAX)), ''),\n` +
      `  ISNULL(CAST(status     AS NVARCHAR(MAX)), ''),\n` +
      `  ISNULL(CAST(region_code AS NVARCHAR(MAX)), '')\n` +
      `  -- DO NOT include: last_updated_ts, row_version, computed_col\n` +
      `))`
    ),
  },

  auth_failure: {
    label: 'Authentication Failure',
    error_codes: ['HTTP_401_UNAUTHORIZED', 'TOKEN_EXPIRED_OR_REVOKED', 'SERVICE_PRINCIPAL_AUTH_FAILED'],
    failure_stage: 'Connection / Authentication Layer — credential validation failure at service endpoint',
    confidence: 'low',
    etr: [30, 90],
    diagnosis: (inc) =>
      `\`${inc.pipeline_name}\` failed to authenticate against a downstream service. ` +
      `This could be a token expiry, a secret rotation that was not propagated to the pipeline's linked service or secrets vault, ` +
      `a service principal permission scope change, or an IP allowlist update on the target. ` +
      `Because there are multiple auth failure modes, proceed through the diagnostic tracks in order — do not assume a single cause.`,
    code_fix: (inc) => {
      const svc = inc.cloud_service || ''
      if (svc.includes('Azure')) return (
        `# Check service principal token and expiry (Azure CLI)\n` +
        `az ad sp show --id <service-principal-id> --query "appId,displayName" -o json\n` +
        `az ad app credential list --id <app-id> --query "[].{endDate:endDateTime,keyId:keyId}" -o table\n\n` +
        `# Rotate the secret if expired\n` +
        `az ad app credential reset --id <app-id> --years 1\n\n` +
        `# Verify the new secret is updated in Key Vault\n` +
        `az keyvault secret set --vault-name <kv-name> --name <secret-name> --value "<new-secret>"\n\n` +
        `# Re-test the linked service connection in ADF\n` +
        `az datafactory linked-service create --factory-name <adf-name> --resource-group <rg> ...`
      )
      if (svc.includes('Oracle')) return (
        `-- Check credential in Oracle Wallet / password expiry\n` +
        `SELECT username, account_status, expiry_date, lock_date\n` +
        `FROM   dba_users\n` +
        `WHERE  username = 'PIPELINE_SVC_USER';\n\n` +
        `-- Unlock and reset if expired\n` +
        `ALTER USER pipeline_svc_user IDENTIFIED BY "<new_password>" ACCOUNT UNLOCK;`
      )
      return (
        `# Check IAM role trust policy and token (AWS)\n` +
        `aws sts get-caller-identity\n` +
        `aws iam get-role --role-name <pipeline-role-name>\n\n` +
        `# Verify Secrets Manager value is current\n` +
        `aws secretsmanager get-secret-value --secret-id <secret-name> --query 'SecretString'\n\n` +
        `# Force token refresh for Glue job execution role\n` +
        `aws glue update-job --job-name <job-name> --job-update Role=arn:aws:iam::<account>:role/<role>`
      )
    },
  },

  timeout: {
    label: 'Pipeline Timeout',
    error_codes: ['PIPELINE_TIMEOUT_EXCEEDED', 'JOB_DURATION_LIMIT_HIT', 'ACTIVITY_TIMEOUT_ERR'],
    failure_stage: 'Execution Layer — job or activity exceeded maximum allowed run duration',
    confidence: 'low',
    etr: [60, 180],
    diagnosis: (inc) =>
      `\`${inc.pipeline_name}\` exceeded its configured execution timeout. ` +
      `The root cause is ambiguous at alert time — this could be a data volume spike, degraded I/O on source or sink, ` +
      `lock contention on the target table, a missing index causing a full scan, or a logic regression (unbounded loop, Cartesian join). ` +
      `Pull the execution plan and resource utilisation metrics from the last successful run and compare against this failed run.`,
    code_fix: (inc) => {
      const svc = inc.cloud_service || ''
      if (svc.includes('Databricks') || svc.includes('Glue')) return (
        `# Check Spark execution plan for skew, Cartesian joins, full scans\n` +
        `df.explain(mode='cost')  # or 'extended' for full logical + physical plan\n\n` +
        `# Identify data skew on partition key\n` +
        `df.groupBy(spark_partition_id()).count().orderBy('count', ascending=False).show(20)\n\n` +
        `# If timeout is a hard limit, increase it (Databricks job cluster)\n` +
        `# In job JSON:\n` +
        `# "timeout_seconds": 7200  # increase from current value\n\n` +
        `# Add adaptive query execution to handle skew automatically\n` +
        `spark.conf.set("spark.sql.adaptive.enabled", "true")\n` +
        `spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")`
      )
      return (
        `-- Identify long-running queries on the target (SQL Server / Azure SQL)\n` +
        `SELECT TOP 10 r.session_id, r.status, r.cpu_time, r.total_elapsed_time,\n` +
        `       r.logical_reads, t.text AS query_text\n` +
        `FROM   sys.dm_exec_requests r\n` +
        `CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t\n` +
        `ORDER BY r.total_elapsed_time DESC;\n\n` +
        `-- Check for blocking locks\n` +
        `SELECT blocking_session_id, session_id, wait_type, wait_time, wait_resource\n` +
        `FROM   sys.dm_exec_requests\n` +
        `WHERE  blocking_session_id <> 0;\n\n` +
        `-- Increase ADF activity timeout (pipeline JSON)\n` +
        `-- "timeout": "02:00:00"  -- HH:MM:SS format`
      )
    },
  },

  config_drift: {
    label: 'Configuration Drift',
    error_codes: ['CONFIG_HASH_MISMATCH', 'ENV_CONFIG_DELTA_DETECTED', 'PARAMETER_VALIDATION_FAILED'],
    failure_stage: 'Initialisation Layer — runtime configuration diverges from last known-good baseline',
    confidence: 'low',
    etr: [45, 120],
    diagnosis: (inc) =>
      `\`${inc.pipeline_name}\` failed during initialisation because a runtime configuration value (connection string, parameter file, ` +
      `environment variable, or linked service definition) does not match the expected baseline. ` +
      `This typically results from a manual edit to the environment outside the deployment pipeline, ` +
      `a partial promotion, or a secrets vault rotation that changed a value the pipeline was not updated to reflect. ` +
      `Diff the current pipeline config against the last-deployed version in source control.`,
    code_fix: (inc) => {
      const svc = inc.cloud_service || ''
      if (svc.includes('Azure')) return (
        `# Export current ADF pipeline / linked service config and diff against git\n` +
        `az datafactory pipeline show \\\n` +
        `  --factory-name <adf-name> --resource-group <rg> \\\n` +
        `  --name "${inc.pipeline_name}" > /tmp/current_pipeline.json\n\n` +
        `# Compare against the version in source control\n` +
        `git diff HEAD -- adf/pipeline/"${inc.pipeline_name}.json" /tmp/current_pipeline.json\n\n` +
        `# If a linked service connection string changed, update and republish\n` +
        `az datafactory linked-service create \\\n` +
        `  --factory-name <adf-name> --resource-group <rg> \\\n` +
        `  --name <linked-service> --properties @linked_service_correct.json`
      )
      return (
        `# Verify current Glue job parameters against the source-controlled version\n` +
        `aws glue get-job --job-name "<job-name>" \\\n` +
        `  --query 'Job.{Script:Command.ScriptLocation,Args:DefaultArguments}' --output json \\\n` +
        `  > /tmp/current_job.json\n\n` +
        `diff /tmp/current_job.json ./glue_jobs/<job-name>.json\n\n` +
        `# Re-apply correct configuration from source control\n` +
        `aws glue update-job --job-name "<job-name>" --job-update file://./glue_jobs/<job-name>.json`
      )
    },
  },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(ts) {
  if (!ts) return 'Unknown'
  try {
    return new Date(ts).toLocaleString('en-GB', {
      timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }) + ' UTC'
  } catch { return ts }
}

function elapsed(ts) {
  if (!ts) return ''
  const m = Math.round((Date.now() - new Date(ts).getTime()) / 60000)
  if (m < 60)   return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ${m % 60}m ago`
  return `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h ago`
}

function etrLabel(tag) {
  const m = PATTERN_META[tag]; if (!m) return 'Undetermined'
  const [lo, hi] = m.etr
  return lo < 60 ? `${lo}–${hi} minutes` : `${Math.round(lo / 60)}–${Math.round(hi / 60)} hours`
}

const CONFIDENCE_NOTE = {
  high:   'High — single clear resolution path. Follow steps in order.',
  medium: 'Medium — 2–3 probable causes. Work primary track first; escalate to secondary if no result within 45 minutes.',
  low:    'Low — multiple failure modes possible. Run all diagnostic tracks in parallel; do not assume single cause.',
}

function s(text) { return { type: 'section', text: { type: 'mrkdwn', text } } }
function d()     { return { type: 'divider' } }

// ── Block builder ────────────────────────────────────────────────────────────

function buildBlocks({ incident: inc, incidentId, engineers, sentBy }) {
  const meta       = PATTERN_META[inc.pattern_tag] || {}
  const sev        = (inc.severity || 'info').toLowerCase()
  const sevFlag    = sev === 'critical' ? '[CRITICAL]' : sev === 'warning' ? '[WARNING]' : '[INFO]'
  const confidence = meta.confidence || 'low'
  const stepsArr   = inc.suggested_steps || []
  const errorCodes = (meta.error_codes || ['UNKNOWN_ERROR']).join('   |   ')
  const diagnosis  = inc.root_cause || (typeof meta.diagnosis === 'function' ? meta.diagnosis(inc) : 'No diagnosis available.')
  const codeFix    = typeof meta.code_fix  === 'function' ? meta.code_fix(inc)  : null

  // ── Resolution plan ──
  let resolutionText
  if (confidence === 'high') {
    resolutionText =
      `*Resolution Plan*   _Confidence: ${CONFIDENCE_NOTE.high}_\n\n` +
      stepsArr.map((s, i) => `*${i + 1}.* ${s}`).join('\n')
  } else {
    const half = Math.ceil(stepsArr.length / 2)
    const pri  = stepsArr.slice(0, half)
    const sec  = stepsArr.slice(half)
    resolutionText =
      `*Resolution Plan*   _Confidence: ${CONFIDENCE_NOTE[confidence]}_\n\n` +
      `*Primary track:*\n` + pri.map((s, i) => `${i + 1}. ${s}`).join('\n') +
      (sec.length ? `\n\n*Secondary / fallback (if primary yields no root cause):*\n` + sec.map((s, i) => `${i + 1 + half}. ${s}`).join('\n') : '')
  }

  const engineerLines = (engineers || []).length
    ? (engineers || []).map(e => `• ${e.name}`).join('\n')
    : '• Not yet assigned'

  const serviceLines = (inc.services_impacted || []).length
    ? (inc.services_impacted || []).map(s => `• ${s}`).join('\n')
    : '• None identified'

  const blocks = [
    // Header
    {
      type: 'header',
      text: { type: 'plain_text', text: `${sevFlag}  ${incidentId}  —  ${inc.client_name}`, emoji: true },
    },

    s(
      `*${inc.title}*\n\n` +
      `Pipeline:     \`${inc.pipeline_name}\`\n` +
      `Environment:  \`${inc.environment}\`   Branch: \`${inc.active_branch || 'main'}\`\n` +
      `Service:      ${inc.cloud_service}\n` +
      `Detected:     ${fmtDate(inc.created_at)}   (${elapsed(inc.created_at)})\n` +
      `Status:       ${(inc.status || 'OPEN').toUpperCase()}`
    ),

    d(),

    // Failure fingerprint
    s(
      `*Failure Fingerprint*\n\n` +
      `Pattern:        ${meta.label || inc.pattern_tag}\n` +
      `Error Codes:  \`${errorCodes}\`\n` +
      `Failure Stage:  ${meta.failure_stage || 'Unknown'}`
    ),

    d(),

    // Technical diagnosis
    s(`*Technical Diagnosis*\n\n${diagnosis}`),

    d(),

    // Code fix
    ...(codeFix ? [s(`*Suggested Code Fix*\n\`\`\`\n${codeFix}\n\`\`\``), d()] : []),

    // Resolution plan
    s(resolutionText),

    d(),

    // Impact + ETR
    s(
      `*Impact Assessment*\n\n` +
      `Services affected:\n${serviceLines}\n\n` +
      `Estimated time to resolution:  *${etrLabel(inc.pattern_tag)}*\n` +
      `_Based on ${meta.label || inc.pattern_tag} resolution history across ${inc.cloud_service} environments._`
    ),

    d(),

    // Engineers
    s(`*Engineers — Engage Now*\n\n${engineerLines}`),

    d(),

    // Footer
    s(
      `Sent by *${sentBy || 'PipelineIQ'}*   ·   ${fmtDate(new Date().toISOString())}   ·   Incident \`${incidentId}\`\n` +
      `_PipelineIQ — Pipeline Observability Portal_`
    ),
  ]

  return blocks
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) return res.status(503).json({ error: 'SLACK_WEBHOOK_URL is not configured on the server.' })

  const { incident, incidentId, engineers, sentBy } = req.body
  if (!incident) return res.status(400).json({ error: 'Missing incident data' })

  const blocks   = buildBlocks({ incident, incidentId, engineers, sentBy })
  const fallback = `${(incident.severity || 'INFO').toUpperCase()} [${incidentId}] — ${incident.client_name}: ${incident.title}`

  try {
    const slackRes = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text: fallback, blocks }),
    })

    if (!slackRes.ok) {
      const errText = await slackRes.text()
      return res.status(500).json({ error: `Slack returned: ${errText}` })
    }

    return res.status(200).json({ ok: true, incidentId })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
