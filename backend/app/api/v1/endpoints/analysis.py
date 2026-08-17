from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.core.database import get_db
from app.models.site import Site
from app.models.user import User
from app.models.environmental_data import EnvironmentalData
from app.models.solar_assessment import SolarAssessment
from app.models.wind_assessment import WindAssessment
from app.api.v1.deps import require_roles
from app.services.solar_calculation_service import run_and_store_solar_assessment
from app.services.wind_calculation_service import run_and_store_wind_assessment
from app.services.audit_service import log_audit_event

router = APIRouter()


class SolarAnalysisInputSchema(BaseModel):
    installed_capacity_mw: Optional[float] = Field(10.0, ge=0.1, le=1000.0)
    panel_efficiency_pct: Optional[float] = Field(21.5, ge=5.0, le=40.0)
    performance_ratio: Optional[float] = Field(0.82, ge=0.5, le=1.0)
    system_loss_pct: Optional[float] = Field(14.0, ge=0.0, le=50.0)
    shading_loss_pct: Optional[float] = Field(3.0, ge=0.0, le=50.0)


class WindAnalysisInputSchema(BaseModel):
    air_density_kg_m3: Optional[float] = Field(1.225, ge=0.5, le=2.0)
    turbine_efficiency_pct: Optional[float] = Field(45.0, ge=10.0, le=59.3)
    rotor_diameter_m: Optional[float] = Field(126.0, ge=10.0, le=300.0)
    num_turbines: Optional[int] = Field(5, ge=1, le=500)
    operating_hours_yr: Optional[float] = Field(8760.0, ge=100.0, le=8760.0)
    turbine_rating_mw: Optional[float] = Field(3.0, ge=0.5, le=20.0)


@router.post("/sites/{site_id}/solar/analyze")
def analyze_solar_site(
    site_id: UUID,
    payload: SolarAnalysisInputSchema,
    request: Request,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Candidate site not found")

    # Prerequisite Guardrail
    import uuid as _uuid
    sid = site_id if not isinstance(site_id, str) else _uuid.UUID(str(site_id))
    env_exists = db.query(EnvironmentalData).filter(EnvironmentalData.site_id == sid).first()
    if not env_exists:
        raise HTTPException(
            status_code=400,
            detail="Cannot calculate solar energy output: Solar and wind environmental observations must be collected first."
        )

    assessment = run_and_store_solar_assessment(
        db=db,
        site_id=str(site_id),
        installed_capacity_mw=payload.installed_capacity_mw,
        panel_efficiency_pct=payload.panel_efficiency_pct,
        performance_ratio=payload.performance_ratio,
        system_loss_pct=payload.system_loss_pct,
        shading_loss_pct=payload.shading_loss_pct,
    )

    site.status = "ANALYZED"
    db.commit()

    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db=db,
        user_id=str(current_user.id),
        action="SOLAR_ANALYSIS_RUN",
        entity="SITE",
        entity_id=str(site_id),
        ip_address=client_ip,
    )

    return assessment


@router.get("/sites/{site_id}/solar")
def get_solar_assessments(
    site_id: UUID,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    records = db.query(SolarAssessment).filter(SolarAssessment.site_id == site_id).order_by(SolarAssessment.created_at.desc()).all()
    return records


@router.post("/sites/{site_id}/wind/analyze")
def analyze_wind_site(
    site_id: UUID,
    payload: WindAnalysisInputSchema,
    request: Request,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Candidate site not found")

    # Prerequisite Guardrail
    import uuid as _uuid
    sid = site_id if not isinstance(site_id, str) else _uuid.UUID(str(site_id))
    env_exists = db.query(EnvironmentalData).filter(EnvironmentalData.site_id == sid).first()
    if not env_exists:
        raise HTTPException(
            status_code=400,
            detail="Cannot calculate wind energy output: Solar and wind environmental observations must be collected first."
        )

    assessment = run_and_store_wind_assessment(
        db=db,
        site_id=str(site_id),
        air_density_kg_m3=payload.air_density_kg_m3,
        turbine_efficiency_pct=payload.turbine_efficiency_pct,
        rotor_diameter_m=payload.rotor_diameter_m,
        num_turbines=payload.num_turbines,
        operating_hours_yr=payload.operating_hours_yr,
        turbine_rating_mw=payload.turbine_rating_mw,
    )

    site.status = "ANALYZED"
    db.commit()

    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db=db,
        user_id=str(current_user.id),
        action="WIND_ANALYSIS_RUN",
        entity="SITE",
        entity_id=str(site_id),
        ip_address=client_ip,
    )

    return assessment


@router.get("/sites/{site_id}/wind")
def get_wind_assessments(
    site_id: UUID,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    records = db.query(WindAssessment).filter(WindAssessment.site_id == site_id).order_by(WindAssessment.created_at.desc()).all()
    return records
