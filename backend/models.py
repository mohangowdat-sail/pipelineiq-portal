from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, JSON, ForeignKey, Enum as SAEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()


class UserRole(str, enum.Enum):
    admin = "admin"
    founder = "founder"
    senior_engineer = "senior_engineer"
    engineer = "engineer"


class IncidentSeverity(str, enum.Enum):
    critical = "critical"
    warning = "warning"
    info = "info"


class IncidentStatus(str, enum.Enum):
    open = "open"
    investigating = "investigating"
    resolved = "resolved"


class PatternTag(str, enum.Enum):
    schema_drift = "schema_drift"
    null_constraint = "null_constraint"
    volume_anomaly = "volume_anomaly"
    dependency_violation = "dependency_violation"
    referential_integrity = "referential_integrity"
    scd_explosion = "scd_explosion"
    auth_failure = "auth_failure"
    timeout = "timeout"
    config_drift = "config_drift"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    role = Column(SAEnum(UserRole), nullable=False)
    hashed_password = Column(String, nullable=False)
    client_access = Column(JSON, default=list)  # list of client names


class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    cloud = Column(String, nullable=False)  # Azure, AWS, Oracle Cloud
    environments = Column(JSON, default=list)
    pipelines = relationship("Pipeline", back_populates="client")


class Pipeline(Base):
    __tablename__ = "pipelines"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    cloud_service = Column(String, nullable=False)
    environment = Column(String, nullable=False)
    active_branch = Column(String, default="main")
    run_history = Column(JSON, default=list)  # 30-day [{date, status, duration_minutes}]
    client = relationship("Client", back_populates="pipelines")


class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    client_name = Column(String, nullable=False)
    pipeline_name = Column(String, nullable=False)
    environment = Column(String, nullable=False)
    severity = Column(SAEnum(IncidentSeverity), nullable=False)
    status = Column(SAEnum(IncidentStatus), nullable=False, default=IncidentStatus.open)
    cloud_service = Column(String, nullable=False)
    pattern_tag = Column(SAEnum(PatternTag), nullable=False)
    root_cause = Column(Text, nullable=False)
    suggested_steps = Column(JSON, default=list)
    services_impacted = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    resolution_time_minutes = Column(Integer, nullable=True)
    assigned_to = Column(String, nullable=True)
    people_involved = Column(JSON, default=list)
    slack_thread = Column(JSON, default=list)
    notification_log = Column(JSON, default=list)
