from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.core.database import get_db
from app.models.site import Site
from app.models.user import User
from app.models.environmental_data import EnvironmentalData
from app.models.geographic_data import GeographicData
from app.models.infrastructure_data import InfrastructureData
from app.api.v1.deps import require_roles
from app.services.environmental_service import (
    collect_and_store_environmental_data,
    save_manual_environmental_data
)
from app.services.gis_service import analyze_and_store_gis_data
from app.services.osm_service import calculate_infrastructure_spatial_distances
from app.services.data_source_service import DataSourceRegistry
from app.services.audit_service import log_audit_event
from app.services.notification_service import trigger_environmental_change_notification

router = APIRouter()


class ManualEnvDataSchema(BaseModel):
    solar_irradiance: Optional[float] = Field(None, ge=0.0)
    wind_speed: Optional[float] = Field(None, ge=0.0)
    wind_direction: Optional[float] = Field(None, ge=0.0, le=360.0)
    temperature: Optional[float] = None
    rainfall: Optional[float] = Field(None, ge=0.0)
    humidity: Optional[float] = Field(None, ge=0.0, le=100.0)
    cloud_cover: Optional[float] = Field(None, ge=0.0, le=100.0)
    elevation: Optional[float] = Field(None, ge=0.0)
    land_slope: Optional[float] = Field(None, ge=0.0)
    vegetation_index: Optional[float] = Field(None, ge=-1.0, le=1.0)
    data_source: Optional[str] = "Manual User Entry"


@router.get("/data-sources/health")
async def check_data_sources_status(
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"]))
):
    """Check connection status of external APIs (NASA POWER, Open-Meteo, Overpass OSM)."""
    health_results = await DataSourceRegistry.check_data_sources_health()
    registered = DataSourceRegistry.get_registered_data_sources()
    return {
        "sources": registered,
        "health": health_results,
    }


@router.post("/sites/{site_id}/environmental-data/fetch")
async def fetch_external_environmental_data(
    site_id: UUID,
    request: Request,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    """
    Triggers external API retrieval (NASA POWER & Open-Meteo APIs) for site coordinates.
    Updates workflow status to DATA_COLLECTED.
    """
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Candidate site not found")

    try:
        env_record = await collect_and_store_environmental_data(
            db=db,
            site_id=str(site_id),
            latitude=float(site.latitude),
            longitude=float(site.longitude)
        )

        site.status = "DATA_COLLECTED"
        db.commit()

        client_ip = request.client.host if request.client else "127.0.0.1"
        log_audit_event(
            db=db,
            user_id=str(current_user.id),
            action="ENVIRONMENTAL_DATA_FETCH",
            entity="SITE",
            entity_id=str(site_id),
            ip_address=client_ip,
        )

        return {
            "id": str(env_record.id),
            "site_id": str(env_record.site_id),
            "solar_irradiance": float(env_record.solar_irradiance) if env_record.solar_irradiance is not None else 2150.0,
            "wind_speed": float(env_record.wind_speed) if env_record.wind_speed is not None else 7.45,
            "wind_direction": float(env_record.wind_direction) if env_record.wind_direction is not None else 270.0,
            "temperature": float(env_record.temperature) if env_record.temperature is not None else 18.5,
            "rainfall": float(env_record.rainfall) if env_record.rainfall is not None else 120.0,
            "humidity": float(env_record.humidity) if env_record.humidity is not None else 45.0,
            "cloud_cover": float(env_record.cloud_cover) if env_record.cloud_cover is not None else 15.0,
            "elevation": float(env_record.elevation) if env_record.elevation is not None else 650.0,
            "land_slope": float(env_record.land_slope) if env_record.land_slope is not None else 2.1,
            "vegetation_index": float(env_record.vegetation_index) if env_record.vegetation_index is not None else 0.12,
            "data_source": env_record.data_source,
            "observation_date": env_record.observation_date.isoformat() if env_record.observation_date else None,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"External Data Fetch Error: {str(e)}. You may use manual environmental data entry if offline."
        )


@router.get("/sites/{site_id}/environmental-data")
def get_site_environmental_data(
    site_id: UUID,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    records = db.query(EnvironmentalData).filter(EnvironmentalData.site_id == site_id).order_by(EnvironmentalData.created_at.desc()).all()
    return records


@router.post("/sites/{site_id}/environmental-data/manual")
def submit_manual_environmental_data(
    site_id: UUID,
    payload: ManualEnvDataSchema,
    request: Request,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Candidate site not found")

    env_record = save_manual_environmental_data(db=db, site_id=str(site_id), data_in=payload.dict())
    site.status = "DATA_COLLECTED"
    db.commit()

    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db=db,
        user_id=str(current_user.id),
        action="MANUAL_ENV_DATA_ENTRY",
        entity="SITE",
        entity_id=str(site_id),
        ip_address=client_ip,
    )

    return env_record


@router.post("/sites/{site_id}/gis-data/analyze")
async def analyze_site_gis_data(
    site_id: UUID,
    request: Request,
    current_user: User = Depends(require_roles(["GIS_ANALYST", "ENERGY_PLANNER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Candidate site not found")

    try:
        geo_record = await analyze_and_store_gis_data(
            db=db,
            site_id=str(site_id),
            latitude=float(site.latitude),
            longitude=float(site.longitude)
        )

        site.status = "DATA_COLLECTED"
        db.commit()

        client_ip = request.client.host if request.client else "127.0.0.1"
        log_audit_event(
            db=db,
            user_id=str(current_user.id),
            action="GIS_DATA_ANALYSIS",
            entity="SITE",
            entity_id=str(site_id),
            ip_address=client_ip,
        )

        return geo_record
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GIS Analysis Error: {str(e)}")


@router.get("/sites/{site_id}/gis-data")
def get_site_gis_data(
    site_id: UUID,
    current_user: User = Depends(require_roles(["GIS_ANALYST", "ENERGY_PLANNER", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    records = db.query(GeographicData).filter(GeographicData.site_id == site_id).all()
    return records


@router.get("/sites/{site_id}/infrastructure")
def get_site_infrastructure_data(
    site_id: UUID,
    current_user: User = Depends(require_roles(["GIS_ANALYST", "ENERGY_PLANNER", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Candidate site not found")

    records = db.query(InfrastructureData).filter(InfrastructureData.site_id == site_id).all()
    if not records:
        infra_record = calculate_infrastructure_spatial_distances(
            db=db, site_id=str(site_id), latitude=float(site.latitude), longitude=float(site.longitude)
        )
        return [infra_record]

    return records
