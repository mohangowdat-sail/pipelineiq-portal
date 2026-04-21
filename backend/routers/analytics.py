from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from collections import defaultdict
from database import get_db
from auth import get_current_user
import models

router = APIRouter()


def get_accessible_client_names(user: models.User, db: Session):
    if "__all__" in user.client_access:
        return [c.name for c in db.query(models.Client).all()]
    return list(user.client_access)


@router.get("/patterns")
def pattern_frequency(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    accessible = get_accessible_client_names(current_user, db)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    incidents = db.query(models.Incident).filter(
        models.Incident.client_name.in_(accessible),
        models.Incident.created_at >= thirty_days_ago,
    ).all()

    # Pattern frequency per client
    client_pattern = defaultdict(lambda: defaultdict(int))
    pattern_total = defaultdict(int)
    for i in incidents:
        client_pattern[i.client_name][i.pattern_tag.value] += 1
        pattern_total[i.pattern_tag.value] += 1

    # Daily breakdown for line chart
    day_pattern = defaultdict(lambda: defaultdict(int))
    for i in incidents:
        day = i.created_at.strftime("%Y-%m-%d")
        day_pattern[day][i.pattern_tag.value] += 1

    return {
        "pattern_totals": dict(pattern_total),
        "client_pattern_matrix": {k: dict(v) for k, v in client_pattern.items()},
        "daily_breakdown": {k: dict(v) for k, v in sorted(day_pattern.items())},
    }


@router.get("/runs")
def daily_runs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    accessible = get_accessible_client_names(current_user, db)
    pipelines = db.query(models.Pipeline).join(models.Client).filter(
        models.Client.name.in_(accessible)
    ).all()

    # Aggregate run_history across all accessible pipelines
    daily_totals = defaultdict(lambda: {"total": 0, "failed": 0})
    for pipeline in pipelines:
        for run in (pipeline.run_history or []):
            day = run.get("date")
            if day:
                daily_totals[day]["total"] += 1
                if run.get("status") == "failed":
                    daily_totals[day]["failed"] += 1

    sorted_days = sorted(daily_totals.items())[-14:]
    return [{"date": d, "total": v["total"], "failed": v["failed"]} for d, v in sorted_days]


@router.get("/mttr")
def mttr_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    accessible = get_accessible_client_names(current_user, db)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    resolved = db.query(models.Incident).filter(
        models.Incident.client_name.in_(accessible),
        models.Incident.status == models.IncidentStatus.resolved,
        models.Incident.resolution_time_minutes.isnot(None),
        models.Incident.created_at >= thirty_days_ago,
    ).all()

    client_mttr = defaultdict(list)
    pattern_mttr = defaultdict(list)
    for i in resolved:
        client_mttr[i.client_name].append(i.resolution_time_minutes)
        pattern_mttr[i.pattern_tag.value].append(i.resolution_time_minutes)

    return {
        "by_client": {
            k: round(sum(v) / len(v)) for k, v in client_mttr.items()
        },
        "by_pattern": {
            k: round(sum(v) / len(v)) for k, v in pattern_mttr.items()
        },
        "overall": round(
            sum(i.resolution_time_minutes for i in resolved) / len(resolved)
        ) if resolved else 0,
    }
