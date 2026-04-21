"""Seed script — wipes and re-seeds all data."""
import os, sys, random
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, os.path.dirname(__file__))

from database import engine, SessionLocal
from models import Base, User, Client, Pipeline, Incident, UserRole, IncidentSeverity, IncidentStatus, PatternTag
from auth import hash_password

APP_PASSWORD = os.getenv("APP_PASSWORD", "PipelineIQ2025")

# ── helpers ──────────────────────────────────────────────────────────────────

def days_ago(n, hour=9, minute=0):
    return datetime.utcnow() - timedelta(days=n, hours=random.randint(0, 6), minutes=random.randint(0, 59))

def build_run_history(success_rate=0.92, env="prod"):
    history = []
    for i in range(29, -1, -1):
        d = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        status = "success" if random.random() < success_rate else "failed"
        duration = round(random.uniform(4.5, 45.0), 1)
        history.append({"date": d, "status": status, "duration_minutes": duration})
    return history

def slack_thread(participants, incident_title, pattern):
    now = datetime.utcnow()
    msgs = []
    lines = [
        f"Just got paged — looks like {incident_title.lower()}. Pulling job logs now.",
        "Confirmed. The run started at 03:14 UTC and errored out at step 3. Stack trace in Datadog.",
        "This matches what we saw last Tuesday. Root cause was the upstream schema change on the `orders` table.",
        "I'm reproducing in staging now. Give me 10 mins.",
        "Staging repro confirmed. Raising a hotfix PR — branch: fix/{pattern}-patch.",
        "PR up: #841. Tagging for review. @here please take a look ASAP.",
        "Reviewed and approved. Merging to staging first.",
        "Staging deploy complete. Ran 3 test jobs — all green. Promoting to prod.",
        "Prod deploy done. Monitoring for 10 mins then closing thread.",
    ]
    random.shuffle(participants)
    for idx, line in enumerate(lines[:random.randint(6, 9)]):
        author = participants[idx % len(participants)]
        initials = "".join(p[0].upper() for p in author.split()[:2])
        msgs.append({
            "author": author,
            "avatar_initials": initials,
            "timestamp": (now - timedelta(minutes=90 - idx * 8)).isoformat(),
            "message": line,
        })
    return msgs

def notif_log(client_name, incident_title, people):
    now = datetime.utcnow()
    return [
        {
            "channel": "PagerDuty",
            "sent_at": (now - timedelta(hours=2)).isoformat(),
            "recipients": people[:2],
            "message_preview": f"[CRITICAL] {incident_title} — {client_name}. Auto-page triggered.",
        },
        {
            "channel": "Slack",
            "sent_at": (now - timedelta(hours=1, minutes=55)).isoformat(),
            "recipients": people,
            "message_preview": f"Incident opened: {incident_title}. Check #pipeline-alerts.",
        },
        {
            "channel": "Email",
            "sent_at": (now - timedelta(hours=1, minutes=50)).isoformat(),
            "recipients": people[:3],
            "message_preview": f"PipelineIQ alert: {incident_title} on {client_name} requires attention.",
        },
    ]

# ── seed ─────────────────────────────────────────────────────────────────────

def seed():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # ── Users ────────────────────────────────────────────────────────────────
    users_data = [
        ("admin",     "Admin Account",       UserRole.admin,           ["__all__"]),
        ("keerthana", "Keerthana Vayyasi",    UserRole.founder,         ["__all__"]),
        ("mohan",     "Mohan Gowda T",        UserRole.senior_engineer, ["__all__"]),
        ("owais",     "Owais Khan",           UserRole.senior_engineer, ["Spirax Group", "CocoBlu Retail", "GoldenSands", "Rotimatic"]),
        ("meghana",   "Meghana Badiger",      UserRole.engineer,        ["Spirax Group", "Greaves Cotton"]),
        ("anis",      "Anis Kaarti",          UserRole.engineer,        ["Spirax Group"]),
        ("jayasree",  "Jayasree",             UserRole.engineer,        ["Spirax Group", "GoldenSands"]),
        ("anosh",     "Anosh Sood",           UserRole.engineer,        ["Rotimatic"]),
        ("aiswarya",  "Aiswarya Suresh",      UserRole.engineer,        ["Rotimatic"]),
    ]
    users = {}
    for uname, name, role, access in users_data:
        u = User(username=uname, name=name, role=role,
                 hashed_password=hash_password(APP_PASSWORD), client_access=access)
        db.add(u)
        users[uname] = name
    db.commit()

    # ── Clients ──────────────────────────────────────────────────────────────
    clients_data = [
        ("PipelineIQ Internal", "Azure",        ["prod", "staging", "dev"]),
        ("Spirax Group",        "Azure",         ["prod", "staging"]),
        ("Greaves Cotton",      "AWS",           ["prod", "staging", "dev"]),
        ("CocoBlu Retail",      "AWS",           ["prod", "staging"]),
        ("GoldenSands",         "Oracle Cloud",  ["prod", "staging"]),
        ("Rotimatic",           "AWS",           ["prod", "dev"]),
    ]
    clients = {}
    for cname, cloud, envs in clients_data:
        c = Client(name=cname, cloud=cloud, environments=envs)
        db.add(c)
        db.flush()
        clients[cname] = c
    db.commit()

    # ── Pipelines ────────────────────────────────────────────────────────────
    def add_pipelines(client_name, service_list, env_list, count=12, branches=None):
        c = clients[client_name]
        created = []
        for i in range(count):
            env = env_list[i % len(env_list)]
            branch = "main"
            if branches and i < len(branches):
                branch = branches[i]
            p = Pipeline(
                name=f"{service_list[i % len(service_list)].split()[-1]} {['Ingestion', 'Transform', 'Load', 'Sync', 'Export', 'Validate', 'Archive', 'Monitor', 'Reconcile', 'Publish', 'Aggregate', 'Refresh'][i % 12]} Pipeline",
                client_id=c.id,
                cloud_service=service_list[i % len(service_list)],
                environment=env,
                active_branch=branch,
                run_history=build_run_history(success_rate=0.93 if env == "prod" else 0.85),
            )
            db.add(p)
            created.append(p)
        return created

    add_pipelines("PipelineIQ Internal",
        ["Azure Data Factory", "Azure Databricks", "Azure Synapse Analytics"],
        ["prod", "staging", "dev"], count=12)

    # Spirax — one prod pipeline on a feature branch to trigger warning banner
    spirax_branches = [None, None, "feature/schema-v2", None, None, None, None, None, None, None, None, None, None, None]
    add_pipelines("Spirax Group",
        ["Azure Data Factory", "Azure Databricks"],
        ["prod", "staging"], count=14, branches=["main","main","feature/schema-v2","main","main","main","main","main","main","main","main","main","main","main"])

    add_pipelines("Greaves Cotton",
        ["AWS Glue", "AWS Step Functions", "AWS Lambda"],
        ["prod", "staging", "dev"], count=13)

    add_pipelines("CocoBlu Retail",
        ["AWS Glue", "AWS Step Functions"],
        ["prod", "staging"], count=11)

    add_pipelines("GoldenSands",
        ["Oracle Data Integrator", "Oracle GoldenGate"],
        ["prod", "staging"], count=10)

    add_pipelines("Rotimatic",
        ["AWS Glue", "AWS Step Functions", "AWS Lambda"],
        ["prod", "dev"], count=12)

    db.commit()

    # ── Incidents ────────────────────────────────────────────────────────────
    def make_incident(title, client, pipeline, env, sev, status, cloud_svc, pattern,
                      root_cause, steps, impacted, created, resolved=None,
                      assigned=None, people=None, res_minutes=None):
        if people is None:
            people = []
        thread_names = [users.get(p, p) for p in (people or ["mohan", "owais"])]
        i = Incident(
            title=title, client_name=client, pipeline_name=pipeline,
            environment=env, severity=sev, status=status,
            cloud_service=cloud_svc, pattern_tag=pattern,
            root_cause=root_cause, suggested_steps=steps,
            services_impacted=impacted, created_at=created,
            resolved_at=resolved, resolution_time_minutes=res_minutes,
            assigned_to=assigned, people_involved=people,
            slack_thread=slack_thread(thread_names or ["Mohan Gowda T", "Owais Khan"], title, pattern.value),
            notification_log=notif_log(client, title, thread_names),
        )
        db.add(i)

    # ── Spirax Group (14) ────────────────────────────────────────────────────
    # 2 open + critical
    make_incident(
        "Critical schema mismatch on Customer Master ingestion pipeline",
        "Spirax Group", "Factory Ingestion Pipeline", "prod",
        IncidentSeverity.critical, IncidentStatus.open,
        "Azure Data Factory", PatternTag.schema_drift,
        "The upstream CRM team deployed a change to the Customer Master table on 12 April that added three new NOT NULL columns without coordinating with the data engineering team. Azure Data Factory's copy activity is now failing at the schema validation step because the sink table definition in Azure SQL does not include these columns, causing a hard stop on row insertion.",
        ["Check the ADF copy activity error log in Azure Monitor for the exact column names causing the violation.",
         "Compare the source CRM schema with the current sink table DDL to identify all column deltas.",
         "Raise a PR to add the three missing columns to the sink table with appropriate NULL defaults for historical rows.",
         "Deploy the DDL change to staging and run the pipeline in debug mode to confirm end-to-end success.",
         "Coordinate with the CRM team to establish a schema change notification process going forward."],
        ["Customer 360 Dashboard", "Salesforce Sync Service", "Revenue Attribution Model"],
        created=days_ago(0), people=["owais", "anis"], assigned=None,
    )
    make_incident(
        "Dependency violation blocking Rebate Calculation pipeline in prod",
        "Spirax Group", "Databricks Transform Pipeline", "prod",
        IncidentSeverity.critical, IncidentStatus.open,
        "Azure Databricks", PatternTag.dependency_violation,
        "The Rebate Calculation Databricks job has a hard dependency on the Pricing Snapshot delta table which is written by an upstream pipeline scheduled 30 minutes earlier. On 13 April the upstream pipeline experienced a 47-minute delay due to a Databricks cluster autoscale event, causing the Rebate Calculation job to read an empty partition and produce incorrect aggregates downstream.",
        ["Inspect the Databricks job run timeline in the Azure Databricks UI to confirm the exact delay window.",
         "Add an explicit data quality assertion at the start of the Rebate Calculation notebook to halt if the pricing snapshot partition is empty.",
         "Introduce a conditional trigger in ADF that checks for partition availability before invoking the downstream job.",
         "Backfill the 13 April rebate data once the upstream pipeline is confirmed healthy.",
         "Review cluster autoscale settings for the upstream pipeline to reduce cold-start delays."],
        ["Rebate Reporting Service", "Finance ERP Connector", "Monthly Close Pipeline"],
        created=days_ago(0), people=["mohan", "anis", "meghana"], assigned=None,
    )
    # 1 investigating
    make_incident(
        "Null constraint violation on product hierarchy staging load",
        "Spirax Group", "Databricks Load Pipeline", "staging",
        IncidentSeverity.warning, IncidentStatus.investigating,
        "Azure Databricks", PatternTag.null_constraint,
        "The product hierarchy staging load job is inserting NULL values into the `category_code` column which has a NOT NULL constraint defined in the staging database. This is being caused by incomplete data in the source ERP export — approximately 340 product SKUs introduced in the last batch are missing category assignments in the source system.",
        ["Query the staging database for all rows where `category_code IS NULL` to determine the full scope.",
         "Cross-reference the NULL SKUs against the ERP source export to confirm they lack category assignments at source.",
         "Apply a default category code ('UNCATEGORISED') as a temporary measure to unblock the pipeline.",
         "Raise a ticket with the ERP team to backfill category assignments for the affected 340 SKUs.",
         "Add a pre-load data quality check in the Databricks notebook that flags NULL category codes before insertion."],
        ["Product Catalogue API", "Inventory Sync Service"],
        created=days_ago(1), people=["anis", "meghana"], assigned="anis",
    )
    # dependency_violation x5 over 30 days (including the one above that's open)
    for n, dago in enumerate([5, 9, 15, 22]):
        make_incident(
            f"Upstream pipeline delay causing dependency cascade (occurrence {n+2})",
            "Spirax Group", "Factory Ingestion Pipeline", "prod",
            IncidentSeverity.warning, IncidentStatus.resolved,
            "Azure Data Factory", PatternTag.dependency_violation,
            "A delayed upstream pipeline caused downstream jobs to read stale or empty partitions, producing incorrect aggregates. This is the fourth occurrence this month, all stemming from the same ADF trigger chain that lacks proper dependency gating between pipeline stages.",
            ["Identify the delayed upstream job in ADF monitoring.",
             "Check downstream job output for stale partition reads.",
             "Apply conditional trigger logic to gate downstream execution.",
             "Validate data completeness before promoting to prod.",
             "Document the fix and update the runbook for this pipeline."],
            ["Downstream Reporting", "Finance Aggregation", "Data Warehouse Load"],
            created=days_ago(dago),
            resolved=days_ago(dago) + timedelta(hours=2, minutes=random.randint(15, 90)),
            res_minutes=random.randint(90, 180),
            people=["mohan", "anis"],
        )
    # fill remaining Spirax to 14
    for n in range(6):
        tags = [PatternTag.schema_drift, PatternTag.timeout, PatternTag.config_drift, PatternTag.scd_explosion, PatternTag.referential_integrity, PatternTag.volume_anomaly]
        make_incident(
            f"Resolved Spirax incident — {tags[n].value.replace('_',' ').title()}",
            "Spirax Group", "Factory Ingestion Pipeline", "staging",
            IncidentSeverity.warning, IncidentStatus.resolved,
            "Azure Data Factory", tags[n],
            "A pipeline execution error was detected in the staging environment. The issue was traced to a configuration mismatch introduced during a recent deployment window. The affected job was restarted after reverting the problematic parameter change.",
            ["Review recent deployment changes for configuration drift.",
             "Revert the pipeline parameter to the last known good state.",
             "Run a full regression test in staging to confirm stability.",
             "Update the deployment checklist to include parameter validation.",
             "Close the incident and update the post-mortem doc."],
            ["Staging Analytics", "QA Validation Service"],
            created=days_ago(10 + n * 3),
            resolved=days_ago(10 + n * 3) + timedelta(hours=1, minutes=random.randint(20, 60)),
            res_minutes=random.randint(30, 90),
            people=["meghana", "anis"],
        )

    # ── Greaves Cotton (6 — all resolved) ────────────────────────────────────
    greaves_patterns = [PatternTag.schema_drift, PatternTag.volume_anomaly, PatternTag.timeout, PatternTag.null_constraint, PatternTag.config_drift, PatternTag.referential_integrity]
    greaves_titles = [
        "Schema change on raw orders table broke Glue ETL job",
        "Unexpected 3× volume spike on daily transactions pipeline",
        "AWS Glue job timed out on large historical backfill",
        "Null values in customer_id field failed NOT NULL constraint",
        "Lambda config drift caused silent data drop on event pipeline",
        "Referential integrity failure on product-to-category join",
    ]
    for n in range(6):
        make_incident(
            greaves_titles[n], "Greaves Cotton",
            "Glue Ingestion Pipeline", "prod" if n % 2 == 0 else "staging",
            IncidentSeverity.warning if n > 1 else IncidentSeverity.critical,
            IncidentStatus.resolved,
            "AWS Glue" if n % 2 == 0 else "AWS Step Functions",
            greaves_patterns[n],
            "The pipeline failed due to an upstream data quality issue that propagated through the ETL stages before being caught at the load step. The root cause was identified in the source system configuration and a targeted fix was applied without requiring a full backfill.",
            ["Identify the source of the data quality issue using CloudWatch Logs.",
             "Apply targeted transformation logic to handle the edge case.",
             "Validate the fix in staging before promoting to prod.",
             "Confirm downstream data integrity with a reconciliation query.",
             "Update the data quality ruleset to catch this pattern automatically."],
            ["Inventory API", "Reporting Dashboard"],
            created=days_ago(8 + n * 3),
            resolved=days_ago(8 + n * 3) + timedelta(hours=1, minutes=random.randint(20, 80)),
            res_minutes=random.randint(25, 95),
            people=["meghana", "mohan"],
        )

    # ── CocoBlu Retail (8) ───────────────────────────────────────────────────
    # 1 open volume anomaly, unclaimed
    make_incident(
        "Retail transaction volume anomaly — 47% below expected threshold",
        "CocoBlu Retail", "Glue Ingestion Pipeline", "prod",
        IncidentSeverity.warning, IncidentStatus.open,
        "AWS Glue", PatternTag.volume_anomaly,
        "The daily retail transaction ingestion pipeline processed 47% fewer records than the rolling 7-day average on 14 April. No AWS Glue job errors were raised, indicating the job completed successfully but the source data extraction from the upstream POS system returned fewer records than expected. This could indicate a connector issue, a source-side filtering change, or a genuine business volume drop that has not been communicated to the data team.",
        ["Check the AWS Glue job run metrics in CloudWatch to confirm job completion status and record counts.",
         "Compare today's POS connector extraction log against the last 7 days to identify where the volume drop originates.",
         "Contact the retail operations team to confirm whether a business event (maintenance window, system migration) explains the volume drop.",
         "If a connector issue is confirmed, restart the POS connector and trigger a partial re-extraction for today's window.",
         "Add a volume threshold alert to the CloudWatch dashboard so this pattern is caught within 30 minutes of job completion."],
        ["Retail Analytics Dashboard", "Inventory Reorder Service", "Finance Daily Close"],
        created=days_ago(0), people=[], assigned=None,
    )
    cocoblu_patterns = [PatternTag.schema_drift, PatternTag.timeout, PatternTag.null_constraint, PatternTag.config_drift, PatternTag.dependency_violation, PatternTag.referential_integrity, PatternTag.scd_explosion]
    cocoblu_titles = [
        "Schema change broke product catalogue Glue transform",
        "Step Functions state machine timed out on order aggregation",
        "Null customer_tier field caused downstream segmentation failure",
        "Lambda environment config drift — wrong S3 bucket target",
        "Dependency violation on daily inventory reconciliation",
        "Referential integrity error on store-to-region mapping",
        "SCD Type 2 explosion on loyalty programme dimension table",
    ]
    for n in range(7):
        make_incident(
            cocoblu_titles[n], "CocoBlu Retail",
            "Glue Transform Pipeline", "prod" if n % 3 != 2 else "staging",
            IncidentSeverity.critical if n == 0 else IncidentSeverity.warning,
            IncidentStatus.resolved,
            "AWS Glue" if n % 2 == 0 else "AWS Step Functions",
            cocoblu_patterns[n],
            "The pipeline encountered a data processing error that was detected during the validation phase of the ETL job. Investigation confirmed the issue was confined to a single data partition and was resolved by applying a targeted patch to the transformation logic.",
            ["Review CloudWatch Logs for the exact error trace.",
             "Isolate the affected data partition and apply the fix.",
             "Re-run the affected partition in staging to validate.",
             "Promote the fix to prod and monitor for recurrence.",
             "Update the monitoring threshold to catch this class of error earlier."],
            ["CocoBlu Analytics", "Store Performance Dashboard"],
            created=days_ago(5 + n * 2),
            resolved=days_ago(5 + n * 2) + timedelta(hours=1, minutes=random.randint(15, 75)),
            res_minutes=random.randint(20, 85),
            people=["owais", "mohan"],
        )

    # ── GoldenSands (9) — auth_failure ×4 this week, 2 open ─────────────────
    # 4 auth_failure in last 7 days (2 open, 2 resolved)
    make_incident(
        "Oracle GoldenGate authentication failure — prod replication halted",
        "GoldenSands", "GoldenGate Sync Pipeline", "prod",
        IncidentSeverity.critical, IncidentStatus.open,
        "Oracle GoldenGate", PatternTag.auth_failure,
        "The Oracle GoldenGate replication process lost its database connection at 01:30 UTC on 14 April after the database service account password was rotated as part of the quarterly credential refresh cycle. The rotation was not communicated to the data engineering team in advance, and the GoldenGate Extract process was not updated with the new credentials, causing all replication streams to halt.",
        ["Retrieve the new service account credentials from the Oracle Cloud Vault via the OCI CLI.",
         "Update the GoldenGate credential store using the GGSCI command line and restart the Extract process.",
         "Verify replication lag in the GoldenGate Monitor to confirm the stream has caught up to current SCN.",
         "Coordinate with the DBA team to be included in the credential rotation notification process.",
         "Implement automated credential refresh using OCI Secrets integration to prevent recurrence."],
        ["Data Warehouse Sync", "Reporting Layer", "Downstream BI Platform"],
        created=days_ago(0), people=["jayasree", "owais"], assigned=None,
    )
    make_incident(
        "Oracle Data Integrator service account locked after repeated auth failures",
        "GoldenSands", "GoldenGate Monitor Pipeline", "prod",
        IncidentSeverity.critical, IncidentStatus.open,
        "Oracle Data Integrator", PatternTag.auth_failure,
        "The Oracle Data Integrator agent is using a service account that was locked by the Oracle database security policy after 5 consecutive failed authentication attempts. The failures began when a configuration file on the ODI agent server was overwritten during a routine OS patch, replacing the credential reference with a placeholder value. The lockout has blocked all ODI interfaces scheduled in the production repository.",
        ["Unlock the service account using the Oracle DBA console or SQLPLUS with SYSDBA privileges.",
         "Restore the correct credential reference in the ODI agent configuration file from the last known good backup.",
         "Restart the ODI agent and confirm it can authenticate to the master and work repositories.",
         "Run a smoke test on the highest-priority ODI interface to verify end-to-end data flow.",
         "Review the OS patch process to ensure data engineering config files are excluded from automated overwrites."],
        ["ODI Repository", "Financial Consolidation Pipeline", "Management Reporting"],
        created=days_ago(1), people=["jayasree", "mohan"], assigned=None,
    )
    for n, dago in enumerate([3, 5]):
        make_incident(
            f"Auth failure on GoldenGate credential expiry (occurrence {n+3})",
            "GoldenSands", "GoldenGate Sync Pipeline", "staging",
            IncidentSeverity.warning, IncidentStatus.resolved,
            "Oracle GoldenGate", PatternTag.auth_failure,
            "Recurring authentication failure caused by credential expiry in the GoldenGate configuration. This is the third occurrence this week, all following the same pattern of service account credentials not being refreshed in the GoldenGate credential store after the upstream Oracle Vault rotation.",
            ["Retrieve updated credentials from Oracle Vault.",
             "Update GoldenGate credential store via GGSCI.",
             "Restart the affected Extract process.",
             "Verify replication lag has normalised.",
             "Escalate credential rotation automation to backlog."],
            ["Staging BI Layer", "QA Data Platform"],
            created=days_ago(dago),
            resolved=days_ago(dago) + timedelta(hours=1, minutes=random.randint(30, 90)),
            res_minutes=random.randint(45, 120),
            people=["jayasree", "owais"],
        )
    # remaining 5 GoldenSands incidents
    gs_patterns = [PatternTag.schema_drift, PatternTag.volume_anomaly, PatternTag.scd_explosion, PatternTag.config_drift, PatternTag.timeout]
    gs_titles = [
        "Schema change on source table disrupted ODI mapping",
        "Unexpected data volume spike on financial transactions extract",
        "SCD Type 2 explosion on customer dimension in data warehouse",
        "OCI config drift — wrong compute shape for ODI agent",
        "ODI interface timeout on large historical data reload",
    ]
    for n in range(5):
        make_incident(
            gs_titles[n], "GoldenSands",
            "ODI Ingestion Pipeline", "prod" if n < 3 else "staging",
            IncidentSeverity.warning, IncidentStatus.resolved,
            "Oracle Data Integrator", gs_patterns[n],
            "The pipeline encountered a processing error related to data volume or structural changes in the source system. The issue was isolated to a specific module and resolved within the same business day after a targeted patch was applied.",
            ["Check Oracle Cloud Infrastructure logs for the full error trace.",
             "Identify the scope of affected records.",
             "Apply targeted fix and validate in staging.",
             "Promote fix to production with DBA approval.",
             "Update runbook with resolution steps."],
            ["GoldenSands Data Warehouse", "Financial Reporting"],
            created=days_ago(8 + n * 4),
            resolved=days_ago(8 + n * 4) + timedelta(hours=2, minutes=random.randint(30, 90)),
            res_minutes=random.randint(40, 130),
            people=["jayasree", "mohan"],
        )

    # ── Rotimatic (8) — schema_drift resolved yesterday in 6 min ─────────────
    make_incident(
        "Schema drift on IoT telemetry ingest pipeline resolved in production",
        "Rotimatic", "Glue Ingestion Pipeline", "prod",
        IncidentSeverity.warning, IncidentStatus.resolved,
        "AWS Glue", PatternTag.schema_drift,
        "The IoT telemetry Glue ingestion job failed when the firmware team pushed an update to the Rotimatic device telemetry payload that added two new fields and renamed an existing field from `motor_speed_rpm` to `motor_rpm_actual`. The Glue schema registry was not updated in advance, causing the Avro deserialization to fail. The fix was applied within 6 minutes by updating the Glue schema registry definition and restarting the job.",
        ["Update the Glue Schema Registry with the new Avro schema reflecting the firmware field changes.",
         "Restart the Glue streaming job and confirm telemetry records are deserializing correctly.",
         "Validate a sample of records in the target S3 data lake for completeness.",
         "Establish a schema change notification process with the firmware engineering team.",
         "Add schema evolution checks to the Glue job to automatically detect and alert on field mismatches."],
        ["Device Analytics Dashboard", "Quality Monitoring Service"],
        created=days_ago(1),
        resolved=days_ago(1) + timedelta(minutes=6),
        res_minutes=6,
        people=["anosh", "aiswarya", "mohan"],
    )
    rotimatic_patterns = [PatternTag.volume_anomaly, PatternTag.timeout, PatternTag.null_constraint, PatternTag.dependency_violation, PatternTag.config_drift, PatternTag.referential_integrity, PatternTag.scd_explosion]
    rotimatic_titles = [
        "Telemetry volume anomaly — device count 30% below baseline",
        "Step Functions timeout on daily device health aggregation",
        "Null device_serial field caused constraint violation in DynamoDB",
        "Dependency violation on firmware version lookup table",
        "Lambda config drift — incorrect environment variable set",
        "Referential integrity error on recipe-to-device mapping",
        "SCD Type 2 explosion on device lifecycle dimension",
    ]
    for n in range(7):
        make_incident(
            rotimatic_titles[n], "Rotimatic",
            "Glue Transform Pipeline", "prod" if n % 2 == 0 else "dev",
            IncidentSeverity.warning, IncidentStatus.resolved,
            "AWS Glue" if n % 2 == 0 else "AWS Step Functions",
            rotimatic_patterns[n],
            "A data processing error in the Rotimatic IoT data pipeline was detected by automated monitoring. The issue was reproduced in the dev environment and resolved without customer impact. Root cause was traced to an upstream change in the device telemetry schema or service configuration.",
            ["Review CloudWatch metrics for the affected Lambda or Glue job.",
             "Reproduce the issue in dev environment using captured payload.",
             "Apply targeted fix to data transformation logic.",
             "Run end-to-end validation and promote to prod.",
             "Document in post-mortem and add regression test."],
            ["Device Analytics", "Firmware Update Service"],
            created=days_ago(4 + n * 3),
            resolved=days_ago(4 + n * 3) + timedelta(hours=1, minutes=random.randint(20, 80)),
            res_minutes=random.randint(25, 100),
            people=["anosh", "aiswarya"],
        )

    # ── PipelineIQ Internal (7 — all resolved/green) ─────────────────────────
    piq_patterns = [PatternTag.config_drift, PatternTag.schema_drift, PatternTag.timeout, PatternTag.volume_anomaly, PatternTag.null_constraint, PatternTag.dependency_violation, PatternTag.scd_explosion]
    piq_titles = [
        "Internal ADF config drift after staging environment reset",
        "Schema evolution on internal metrics table broke Synapse pipeline",
        "Databricks job timeout on 90-day retention archive run",
        "Unexpected volume spike in internal event log pipeline",
        "Null constraint on internal user session table — staging",
        "Dependency violation in internal reporting pipeline chain",
        "SCD explosion on internal feature flag dimension table",
    ]
    for n in range(7):
        make_incident(
            piq_titles[n], "PipelineIQ Internal",
            "Synapse Ingestion Pipeline", "prod" if n < 3 else "staging",
            IncidentSeverity.info, IncidentStatus.resolved,
            "Azure Synapse Analytics" if n % 2 == 0 else "Azure Databricks",
            piq_patterns[n],
            "An internal pipeline issue was detected during routine monitoring. The issue was low severity and contained to the internal environment. It was resolved within the same working day by the on-call engineer without escalation.",
            ["Review pipeline logs for the specific error.",
             "Apply configuration or schema fix as appropriate.",
             "Re-run the affected pipeline to confirm resolution.",
             "Update internal monitoring thresholds.",
             "Log in internal incident tracker and close."],
            ["Internal Analytics", "Internal Reporting"],
            created=days_ago(5 + n * 4),
            resolved=days_ago(5 + n * 4) + timedelta(hours=1, minutes=random.randint(15, 60)),
            res_minutes=random.randint(15, 75),
            people=["mohan", "keerthana"],
        )

    db.commit()
    db.close()
    print(f"✓ Seeded {len(users_data)} users, {len(clients_data)} clients, 52 incidents across all clients.")


if __name__ == "__main__":
    seed()
