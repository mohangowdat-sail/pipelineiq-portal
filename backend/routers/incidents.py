from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime
from database import get_db
from auth import get_current_user
import models

router = APIRouter()


def get_accessible_client_names(user: models.User, db: Session):
    if "__all__" in user.client_access:
        return [c.name for c in db.query(models.Client).all()]
    return list(user.client_access)


@router.get("")
def list_incidents(
    client_id: int = Query(None),
    severity: str = Query(None),
    status: str = Query(None),
    pattern_tag: str = Query(None),
    search: str = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    accessible_names = get_accessible_client_names(current_user, db)
    q = db.query(models.Incident).filter(models.Incident.client_name.in_(accessible_names))

    if client_id:
        client = db.query(models.Client).filter(models.Client.id == client_id).first()
        if client and client.name in accessible_names:
            q = q.filter(models.Incident.client_name == client.name)

    if severity:
        q = q.filter(models.Incident.severity == severity)
    if status:
        q = q.filter(models.Incident.status == status)
    if pattern_tag:
        q = q.filter(models.Incident.pattern_tag == pattern_tag)
    if search:
        q = q.filter(
            or_(
                models.Incident.title.ilike(f"%{search}%"),
                models.Incident.pipeline_name.ilike(f"%{search}%"),
            )
        )

    incidents = q.order_by(models.Incident.created_at.desc()).all()
    return [serialize_incident(i) for i in incidents]


@router.get("/{incident_id}")
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    accessible_names = get_accessible_client_names(current_user, db)
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    if incident.client_name not in accessible_names:
        raise HTTPException(status_code=403, detail="Access denied")
    return serialize_incident(incident, full=True)


@router.patch("/{incident_id}/claim")
def claim_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    accessible_names = get_accessible_client_names(current_user, db)
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    if incident.client_name not in accessible_names:
        raise HTTPException(status_code=403, detail="Access denied")
    if incident.status != models.IncidentStatus.open:
        raise HTTPException(status_code=400, detail="Incident is not open")

    incident.assigned_to = current_user.username
    incident.status = models.IncidentStatus.investigating
    people = list(incident.people_involved or [])
    if current_user.username not in people:
        people.append(current_user.username)
    incident.people_involved = people
    db.commit()
    db.refresh(incident)
    return serialize_incident(incident)


@router.patch("/{incident_id}/resolve")
def resolve_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    accessible_names = get_accessible_client_names(current_user, db)
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    if incident.client_name not in accessible_names:
        raise HTTPException(status_code=403, detail="Access denied")
    if incident.assigned_to != current_user.username:
        raise HTTPException(status_code=403, detail="Only the assigned engineer can resolve")

    now = datetime.utcnow()
    incident.status = models.IncidentStatus.resolved
    incident.resolved_at = now
    delta = now - incident.created_at
    incident.resolution_time_minutes = int(delta.total_seconds() / 60)
    db.commit()
    db.refresh(incident)
    return serialize_incident(incident)


def serialize_incident(i: models.Incident, full: bool = False):
    base = {
        "id": i.id,
        "title": i.title,
        "client_name": i.client_name,
        "pipeline_name": i.pipeline_name,
        "environment": i.environment,
        "severity": i.severity.value,
        "status": i.status.value,
        "cloud_service": i.cloud_service,
        "pattern_tag": i.pattern_tag.value,
        "assigned_to": i.assigned_to,
        "people_involved": i.people_involved,
        "created_at": i.created_at.isoformat() if i.created_at else None,
        "resolved_at": i.resolved_at.isoformat() if i.resolved_at else None,
        "resolution_time_minutes": i.resolution_time_minutes,
    }
    if full:
        base.update({
            "root_cause": i.root_cause,
            "suggested_steps": i.suggested_steps,
            "services_impacted": i.services_impacted,
            "slack_thread": i.slack_thread,
            "notification_log": i.notification_log,
        })
    return base
