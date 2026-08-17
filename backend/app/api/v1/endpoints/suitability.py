from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.core.database import get_db
from app.models.site import Site
from app.models.user import User
from app.models.environmental_data import EnvironmentalData
from app.models.site_suitability import SiteSuitability
from app.models.site_score import SiteScore
from app.api.v1.deps import require_roles
from app.services.suitability_service import (
    run_and_store_suitability_and_scoring,
    compute_composite_site_score
)
from app.services.audit_service import log_audit_event

router = APIRouter()


class CustomScoreInputSchema(BaseModel):
    resource_score: float = Field(..., ge=0.0, le=100.0)
    geographic_score: float = Field(..., ge=0.0, le=100.0)
    infrastructure_score: float = Field(..., ge=0.0, le=100.0)
    environmental_score: float = Field(..., ge=0.0, le=100.0)
    economic_score: float = Field(..., ge=0.0, le=100.0)


@router.post("/sites/{site_id}/suitability/calculate")
def calculate_site_suitability(
    site_id: UUID,
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
            detail="Cannot calculate suitability: Solar/Wind environmental data is required."
        )

    res = run_and_store_suitability_and_scoring(db=db, site_id=str(site_id))

    site.status = "SUITABILITY_CALCULATED"
    db.commit()

    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db=db,
        user_id=str(current_user.id),
        action="SUITABILITY_CALCULATION_RUN",
        entity="SITE",
        entity_id=str(site_id),
        ip_address=client_ip,
    )

    suitability = res["suitability"]
    return {
        "id": str(suitability.id),
        "site_id": str(suitability.site_id),
        "suitability_score": float(suitability.overall_score),
        "suitability_category": suitability.category,
        "renewable_resource_score": float(suitability.renewable_resource_score),
        "geographic_score": float(suitability.geographic_score),
        "infrastructure_score": float(suitability.infrastructure_score),
        "environmental_score": float(suitability.environmental_score),
        "economic_score": float(suitability.economic_score),
        "formula": "Score = (resource*0.35) + (geographic*0.25) + (infrastructure*0.15) + (environmental*0.15) + (economic*0.10)",
        "created_at": suitability.created_at.isoformat() if suitability.created_at else None,
    }


@router.get("/sites/{site_id}/suitability")
def get_site_suitability_history(
    site_id: UUID,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    records = db.query(SiteSuitability).filter(SiteSuitability.site_id == site_id).order_by(SiteSuitability.created_at.desc()).all()
    return records


@router.post("/sites/{site_id}/score/calculate")
def calculate_custom_site_score(
    site_id: UUID,
    payload: CustomScoreInputSchema,
    request: Request,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Candidate site not found")

    comp = compute_composite_site_score(
        resource_score=payload.resource_score,
        geographic_score=payload.geographic_score,
        infrastructure_score=payload.infrastructure_score,
        environmental_score=payload.environmental_score,
        economic_score=payload.economic_score,
    )

    import uuid as _uuid
    sid = site_id if not isinstance(site_id, str) else _uuid.UUID(str(site_id))

    score_rec = SiteScore(
        site_id=sid,
        renewable_resource_score=payload.resource_score,
        geographic_score=payload.geographic_score,
        infrastructure_score=payload.infrastructure_score,
        environmental_score=payload.environmental_score,
        economic_score=payload.economic_score,
        overall_score=comp["final_score"],
        category=comp["category"],
    )
    db.add(score_rec)
    site.status = "SCORED"
    db.commit()
    db.refresh(score_rec)

    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db=db,
        user_id=str(current_user.id),
        action="SITE_SCORE_CALCULATION_RUN",
        entity="SITE",
        entity_id=str(site_id),
        ip_address=client_ip,
    )

    return {
        "id": str(score_rec.id),
        "site_id": str(score_rec.site_id),
        "overall_score": float(score_rec.overall_score),
        "category": score_rec.category,
    }


@router.get("/sites/{site_id}/score")
def get_site_score_history(
    site_id: UUID,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    records = db.query(SiteScore).filter(SiteScore.site_id == site_id).order_by(SiteScore.created_at.desc()).all()
    return records
