from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models

router = APIRouter()

ALL_CLIENTS = "__all__"


def get_accessible_clients(user: models.User, db: Session):
    access = user.client_access
    if "__all__" in access:
        return db.query(models.Client).all()
    return db.query(models.Client).filter(models.Client.name.in_(access)).all()


@router.get("")
def list_clients(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    clients = get_accessible_clients(current_user, db)
    return [
        {
            "id": c.id,
            "name": c.name,
            "cloud": c.cloud,
            "environments": c.environments,
        }
        for c in clients
    ]


@router.get("/{client_id}/pipelines")
def list_pipelines(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    accessible = get_accessible_clients(current_user, db)
    accessible_ids = [c.id for c in accessible]
    if client_id not in accessible_ids:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")

    pipelines = db.query(models.Pipeline).filter(models.Pipeline.client_id == client_id).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "client_id": p.client_id,
            "cloud_service": p.cloud_service,
            "environment": p.environment,
            "active_branch": p.active_branch,
            "run_history": p.run_history,
        }
        for p in pipelines
    ]
