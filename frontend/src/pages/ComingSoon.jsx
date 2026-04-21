import { useState } from 'react'
import { X, ChevronRight, GitPullRequest, Shield, GitMerge, FileText, Activity, Brain, Zap } from 'lucide-react'

const FEATURES = [
  {
    id: 'pr_draft', icon: GitPullRequest, title: 'PR Draft Generation',
    description: 'AI analyses incident root cause, diffs the relevant pipeline code, and drafts a pull request with a fix. Engineers review and approve — never write boilerplate fixes again.',
    steps: [
      { title: 'Incident detected', body: 'PipelineIQ identifies a schema_drift incident on the Customer Master Ingestion pipeline. Root cause is isolated to 3 new columns in the upstream CRM table.' },
      { title: 'Code analysis', body: 'The AI reads the ADF pipeline JSON definition, the sink table DDL, and the last 5 Git commits to understand the current schema state.' },
      { title: 'PR drafted', body: 'A pull request is raised on the `fix/schema-drift-customer-master` branch. The PR description includes the incident link, column names, and a migration script for the DDL change.' },
      { title: 'Review and merge', body: 'The on-call engineer reviews the diff in GitHub, approves, and merges. PipelineIQ marks the incident as resolved and updates the post-mortem document.' },
    ],
  },
  {
    id: 'permission_pr', icon: Shield, title: 'Permission-gated PR Raising',
    description: 'Define approval policies per client and environment. PipelineIQ will not raise PRs to production branches without the required number of reviewers from an approved team.',
    steps: [
      { title: 'Policy definition', body: 'Admins define that production PRs for Spirax Group require 2 senior engineer approvals before merge. Staging requires 1. Dev is ungated.' },
      { title: 'PR created in staging', body: 'PipelineIQ raises a fix PR to the staging branch automatically after incident detection. One approval required — notified via Slack.' },
      { title: 'Promotion gated', body: 'When staging validation passes, PipelineIQ proposes promoting the fix to prod. The approval gate blocks until 2 senior engineers approve the promotion PR.' },
      { title: 'Audit trail generated', body: 'Every approval, rejection, and merge is logged to the immutable audit trail with timestamp, approver identity, and the incident that triggered the change.' },
    ],
  },
  {
    id: 'auto_merge', icon: GitMerge, title: 'Staging-only Auto-merge',
    description: 'For low-risk pattern classes (config drift, null constraint), PipelineIQ can auto-merge validated fixes in staging environments without human approval, accelerating MTTR.',
    steps: [
      { title: 'Pattern classification', body: 'PipelineIQ classifies the incident as a null_constraint pattern on a staging pipeline. The risk score is Low based on pattern history and affected services.' },
      { title: 'Fix generated and tested', body: 'The AI generates a fix, runs the pipeline in dry-run mode against a data sample, and confirms zero errors before proceeding.' },
      { title: 'Auto-merge executed', body: 'The fix PR is automatically merged to the staging branch. A Slack message is posted to #pipeline-alerts: "Auto-fix applied to staging — null_constraint on Product Hierarchy Load. MTTR: 4 min."' },
      { title: 'Human promoted to prod', body: 'Engineers review the staging fix and decide whether to promote to production. Auto-merge never applies to production environments.' },
    ],
  },
  {
    id: 'audit_trail', icon: FileText, title: 'Immutable Audit Trail Export',
    description: 'Every incident, claim, resolution, PR, and configuration change is written to an append-only audit log. Export to CSV, JSON, or push directly to your SIEM.',
    steps: [
      { title: 'Event capture', body: 'Every action in PipelineIQ is captured: incident created, engineer assigned, PR raised, approval granted, resolution confirmed. Timestamps are UTC-anchored and cryptographically signed.' },
      { title: 'Audit query', body: 'Compliance teams can query the audit trail by client, engineer, date range, or incident pattern. All queries are logged themselves.' },
      { title: 'Export formats', body: 'Export to CSV for spreadsheet analysis, JSON for programmatic ingestion, or direct push to Splunk / Datadog / ELK. Signed exports include a verification hash.' },
      { title: 'SIEM integration', body: 'Configure a webhook to push audit events in real-time to your SIEM. PipelineIQ supports Splunk HEC, Datadog Events API, and generic HTTPS webhooks.' },
    ],
  },
  {
    id: 'iac_drift', icon: Activity, title: 'IaC Drift Detection',
    description: 'PipelineIQ compares your live cloud pipeline configuration against your Terraform / ARM / CloudFormation state and alerts when drift is detected — before it causes an incident.',
    steps: [
      { title: 'Baseline captured', body: 'PipelineIQ reads your Terraform state files from S3 / Azure Blob / OCI Object Storage and builds a canonical baseline of all pipeline resource configurations.' },
      { title: 'Live state compared', body: 'Every 15 minutes, PipelineIQ compares the live cloud resource configuration (via ARM, CloudFormation, or OCI APIs) against the Terraform baseline.' },
      { title: 'Drift alert raised', body: 'When drift is detected — e.g., an ADF integration runtime concurrency setting changed outside Terraform — a config_drift incident is raised automatically before the pipeline SLA is breached.' },
      { title: 'Auto-remediation proposed', body: 'PipelineIQ proposes a `terraform apply` plan scoped to the drifted resource. Engineers can approve the plan from the PipelineIQ UI without leaving the incident panel.' },
    ],
  },
  {
    id: 'rca_memory', icon: Brain, title: 'Self-improving RCA Memory',
    description: 'PipelineIQ learns from every resolved incident. When a new incident matches a previously resolved pattern, it surfaces the exact fix that worked before — including the PR, the engineer, and the resolution time.',
    steps: [
      { title: 'Incident resolved and indexed', body: 'When an engineer resolves an incident, PipelineIQ extracts the fix pattern: pipeline name, pattern_tag, root cause keywords, and the successful resolution steps. This is embedded into the RCA memory vector store.' },
      { title: 'New incident detected', body: 'A new schema_drift incident is detected on the Spirax Group Customer Master pipeline. PipelineIQ queries the RCA memory for similar historical incidents.' },
      { title: 'Match surfaced', body: 'PipelineIQ surfaces: "This matches Incident #1 from 14 April (Resolved in 88 min by Mohan Gowda T). The fix was: update ADF copy activity column mapping, add 3 missing columns to sink table DDL."' },
      { title: 'Suggested steps pre-filled', body: 'The incident detail panel pre-fills the suggested steps from the matched historical fix, and the AI highlights which step was most critical to the resolution. MTTR improves with every incident resolved.' },
    ],
  },
]

function DemoModal({ feature, onClose }) {
  const [step, setStep] = useState(0)
  const current = feature.steps[step]
  const Icon = feature.icon

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-border rounded-card w-full max-w-lg shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
              <Icon size={16} className="text-accent" />
            </div>
            <div>
              <div className="text-text-primary font-semibold text-sm">{feature.title}</div>
              <span className="badge bg-warning/10 border border-warning/20 text-warning text-[10px]">Demo simulation — not live</span>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">
            <X size={18} />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1 px-6 pt-4">
          {feature.steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-accent' : 'bg-border'}`} />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <div className="text-text-muted text-xs font-semibold uppercase tracking-wide mb-1">Step {step + 1} of {feature.steps.length}</div>
          <div className="text-text-primary font-semibold text-base mb-3">{current.title}</div>

          {/* Simulated UI panel */}
          <div className="bg-surface2 border border-border rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-critical animate-pulse" />
              <span className="text-text-muted text-xs font-mono">PipelineIQ · Automation Layer · Phase 3</span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed">{current.body}</p>
            <div className="mt-3 bg-bg rounded border border-border p-3">
              <div className="text-text-muted text-xs font-mono space-y-1">
                <div className="text-healthy">✓ {current.title.toLowerCase().replace(' ', '_')}_complete</div>
                <div className="text-text-muted">timestamp: {new Date().toISOString()}</div>
                <div className="text-accent">next: {feature.steps[step + 1]?.title?.toLowerCase().replace(' ', '_') || 'complete'}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-text-muted text-xs">{step + 1} / {feature.steps.length}</div>
            {step < feature.steps.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} className="btn-primary flex items-center gap-2">
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={onClose} className="btn-secondary flex items-center gap-2">
                Close demo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ComingSoon() {
  const [activeModal, setActiveModal] = useState(null)
  const activeFeature = FEATURES.find(f => f.id === activeModal)

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-warning/20 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-warning" />
          </div>
          <h1 className="text-text-primary text-xl font-bold">Phase 3 — Automation layer</h1>
        </div>
        <p className="text-text-muted text-sm ml-11">These features are in development. The demos below simulate what the experience will look like.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {FEATURES.map(f => {
          const Icon = f.icon
          return (
            <div key={f.id} className="card flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-lg flex items-center justify-center">
                  <Icon size={18} className="text-accent" />
                </div>
                <span className="badge bg-warning/10 border border-warning/20 text-warning text-[10px]">Simulated demo</span>
              </div>
              <div className="text-text-primary font-semibold text-sm mb-2">{f.title}</div>
              <p className="text-text-secondary text-xs leading-relaxed flex-1">{f.description}</p>
              <button onClick={() => setActiveModal(f.id)}
                className="mt-4 btn-secondary text-sm flex items-center justify-center gap-2 w-full">
                Preview demo <ChevronRight size={14} />
              </button>
            </div>
          )
        })}
      </div>

      {activeFeature && <DemoModal feature={activeFeature} onClose={() => setActiveModal(null)} />}
    </div>
  )
}
