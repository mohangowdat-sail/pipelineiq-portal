import os
import json
from datetime import datetime, timezone
from urllib.request import urlopen, Request
from urllib.error import HTTPError
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from routers import auth, clients, incidents, engineers, analytics

load_dotenv()

app = FastAPI(title="PipelineIQ API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(clients.router, prefix="/clients", tags=["clients"])
app.include_router(incidents.router, prefix="/incidents", tags=["incidents"])
app.include_router(engineers.router, prefix="/engineers", tags=["engineers"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "PipelineIQ API"}


class SlackAlertRequest(BaseModel):
    incident: Dict[str, Any]
    incidentId: str
    engineers: Optional[List[Dict[str, Any]]] = []
    sentBy: Optional[str] = "PipelineIQ"


@app.post("/send-slack-alert")
def send_slack_alert(payload: SlackAlertRequest):
    webhook_url = os.getenv("SLACK_WEBHOOK_URL")
    if not webhook_url:
        raise HTTPException(status_code=503, detail="SLACK_WEBHOOK_URL is not configured")

    inc = payload.incident
    severity = inc.get("severity", "info")
    severity_emoji = "🔴" if severity == "critical" else "🟡" if severity == "warning" else "🔵"
    pattern_label = (inc.get("pattern_tag") or "").replace("_", " ").title()
    steps = inc.get("suggested_steps") or []
    steps_list = "\n".join(f"{i+1}. {s}" for i, s in enumerate(steps)) or "No steps available"
    services = ", ".join(inc.get("services_impacted") or []) or "Unknown"
    engineers_list = "\n".join(f"• {e.get('name', '')}" for e in (payload.engineers or [])) or "• Not assigned"

    try:
        created_at = datetime.fromisoformat((inc.get("created_at") or "").replace("Z", "+00:00"))
        logged_at = created_at.strftime("%d %b %Y, %H:%M UTC")
    except Exception:
        logged_at = inc.get("created_at", "Unknown")

    now_str = datetime.now(timezone.utc).strftime("%d/%m/%Y, %H:%M:%S UTC")

    text = "\n".join([
        f"{severity_emoji} *[{payload.incidentId}] {severity.upper()} — {inc.get('client_name', '')}*",
        f"> *{inc.get('title', '')}*",
        "",
        f"*Pipeline:* `{inc.get('pipeline_name', '')}`",
        f"*Environment:* `{inc.get('environment', '')}`  |  *Cloud Service:* {inc.get('cloud_service', '')}",
        f"*Pattern:* {pattern_label}  |  *Opened:* {logged_at}",
        "",
        "*📋 Root Cause & Pipeline to Investigate:*",
        f">{inc.get('root_cause', '')}",
        "",
        "*🔧 Suggested Resolution Steps:*",
        steps_list,
        "",
        f"*⚡ Services Impacted:* {services}",
        "",
        "*👥 Engineers to engage:*",
        engineers_list,
        "",
        f"_Sent by {payload.sentBy or 'PipelineIQ'} via PipelineIQ · {now_str}_",
    ])

    body = json.dumps({"text": text}).encode("utf-8")
    req = Request(webhook_url, data=body, headers={"Content-Type": "application/json"}, method="POST")

    try:
        with urlopen(req, timeout=10) as resp:
            resp.read()
        return {"ok": True, "incidentId": payload.incidentId}
    except HTTPError as e:
        err_body = e.read().decode()
        raise HTTPException(status_code=500, detail=f"Slack returned: {err_body}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
