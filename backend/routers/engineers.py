from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models

router = APIRouter()

ALLOWED_ROLES = ["admin", "founder", "senior_engineer"]


@router.get("")
def list_engineers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role.value not in ALLOWED_ROLES:
        raise HTTPException(status_code=403, detail="Access denied")

    users = db.query(models.User).all()
    result = []
    for u in users:
        open_incidents = db.query(models.Incident).filter(
            models.Incident.assigned_to == u.username,
            models.Incident.status != models.IncidentStatus.resolved,
        ).all()
        resolved_incidents = db.query(models.Incident).filter(
            models.Incident.assigned_to == u.username,
            models.Incident.status == models.IncidentStatus.resolved,
            models.Incident.resolution_time_minutes.isnot(None),
        ).all()
        avg_mttr = None
        if resolved_incidents:
            avg_mttr = round(
                sum(i.resolution_time_minutes for i in resolved_incidents) / len(resolved_incidents)
            )
        result.append({
            "id": u.id,
            "username": u.username,
            "name": u.name,
            "role": u.role.value,
            "client_access": u.client_access,
            "open_incident_count": len(open_incidents),
            "resolved_last_30_days": len(resolved_incidents),
            "avg_mttr_minutes": avg_mttr,
            "open_incidents": [
                {
                    "id": i.id,
                    "title": i.title,
                    "client_name": i.client_name,
                    "severity": i.severity.value,
                    "created_at": i.created_at.isoformat() if i.created_at else None,
                }
                for i in open_incidents
            ],
        })
    return result
