from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.core.database import get_db
from app.models.site import Site
from app.models.user import User
from app.models.solar_assessment import SolarAssessment
from app.models.wind_assessment import WindAssessment
from app.models.energy_forecast import EnergyForecast
from app.api.v1.deps import require_roles
from app.services.forecast_service import (
    run_and_store_energy_forecast,
    calculate_deterministic_energy_forecast
)
from app.services.audit_service import log_audit_event
from app.services.notification_service import trigger_forecast_update_notification

router = APIRouter()


class EnergyForecastInputSchema(BaseModel):
    installed_capacity_mw: Optional[float] = Field(15.0, ge=0.1, le=1000.0)
    technology: Optional[str] = Field("HYBRID", max_length=50)
    electricity_tariff_usd_mwh: Optional[float] = Field(65.0, ge=0.0, le=500.0)
    capacity_factor_pct: Optional[float] = Field(28.5, ge=5.0, le=70.0)
    performance_ratio: Optional[float] = Field(0.82, ge=0.5, le=1.0)


@router.post("/sites/{site_id}/forecast/calculate")
def calculate_energy_forecast(
    site_id: UUID,
    payload: EnergyForecastInputSchema,
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
    solar_exists = db.query(SolarAssessment).filter(SolarAssessment.site_id == sid).first()
    wind_exists = db.query(WindAssessment).filter(WindAssessment.site_id == sid).first()

    if not solar_exists and not wind_exists:
        raise HTTPException(
            status_code=400,
            detail="Cannot calculate forecast: Solar or Wind resource assessment must be calculated first."
        )

    run_and_store_energy_forecast(
        db=db,
        site_id=str(site_id),
        installed_capacity_mw=payload.installed_capacity_mw,
        technology=payload.technology,
        electricity_tariff_usd_mwh=payload.electricity_tariff_usd_mwh,
        capacity_factor_pct=payload.capacity_factor_pct,
        performance_ratio=payload.performance_ratio,
    )

    full_forecast = calculate_deterministic_energy_forecast(
        installed_capacity_mw=payload.installed_capacity_mw,
        technology=payload.technology,
        electricity_tariff_usd_mwh=payload.electricity_tariff_usd_mwh,
        capacity_factor_pct=payload.capacity_factor_pct,
        performance_ratio=payload.performance_ratio,
    )

    site.status = "FORECASTED"
    db.commit()

    trigger_forecast_update_notification(
        db=db,
        user_id=str(current_user.id),
        site_name=site.site_name,
        capacity_kw=payload.installed_capacity_mw * 1000.0,
        annual_mwh=full_forecast.get("total_annual_generation_mwh", 0),
        revenue_usd=full_forecast.get("total_annual_revenue_usd", 0),
    )

    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db=db,
        user_id=str(current_user.id),
        action="ENERGY_FORECAST_CALCULATION_RUN",
        entity="SITE",
        entity_id=str(site_id),
        ip_address=client_ip,
    )

    return full_forecast


@router.get("/sites/{site_id}/forecast")
def get_energy_forecast(
    site_id: UUID,
    technology: str = "HYBRID",
    tariff: float = 65.0,
    capacity: float = 15.0,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Candidate site not found")

    return calculate_deterministic_energy_forecast(
        installed_capacity_mw=capacity,
        technology=technology,
        electricity_tariff_usd_mwh=tariff,
    )


@router.get("/sites/{site_id}/forecast/monthly")
def get_monthly_forecast(
    site_id: UUID,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    records = db.query(EnergyForecast).filter(EnergyForecast.site_id == site_id).order_by(EnergyForecast.created_at.desc()).all()
    return records


@router.get("/sites/{site_id}/forecast/annual")
def get_annual_forecast(
    site_id: UUID,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    return calculate_deterministic_energy_forecast(
        installed_capacity_mw=15.0,
        technology="HYBRID",
        electricity_tariff_usd_mwh=65.0
    )["annual_projections"]
