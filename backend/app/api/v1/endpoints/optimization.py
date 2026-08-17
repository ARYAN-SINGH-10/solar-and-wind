from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.site import Site
from app.models.user import User
from app.models.site_suitability import SiteSuitability
from app.models.site_score import SiteScore
from app.models.energy_forecast import EnergyForecast
from app.models.deployment_optimization import DeploymentOptimization
from app.models.recommendation import Recommendation
from app.api.v1.deps import require_roles
from app.services.optimization_service import run_and_store_deployment_optimization
from app.services.recommendation_service import run_and_store_recommendation
from app.services.audit_service import log_audit_event

router = APIRouter()


@router.post("/sites/{site_id}/optimization/run")
def run_site_optimization(
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
    suitability_exists = db.query(SiteSuitability).filter(SiteSuitability.site_id == sid).first()
    score_exists = db.query(SiteScore).filter(SiteScore.site_id == sid).first()
    if not suitability_exists and not score_exists:
        raise HTTPException(
            status_code=400,
            detail="Cannot run optimization: Site suitability score must be calculated first."
        )

    opt_rec = run_and_store_deployment_optimization(db=db, site_id=str(site_id))
    site.status = "OPTIMIZED"
    db.commit()

    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db=db,
        user_id=str(current_user.id),
        action="OPTIMIZATION_RUN",
        entity="SITE",
        entity_id=str(site_id),
        ip_address=client_ip,
    )

    return {
        "id": str(opt_rec.id),
        "site_id": str(opt_rec.site_id),
        "recommended_technology": opt_rec.recommended_technology,
        "recommended_capacity": float(opt_rec.recommended_capacity),
        "grid_distance": float(opt_rec.grid_distance),
        "expansion_possible": opt_rec.expansion_possible,
        "optimization_score": float(opt_rec.optimization_score),
        "created_at": opt_rec.created_at.isoformat() if opt_rec.created_at else None,
    }


@router.get("/sites/{site_id}/optimization")
def get_site_optimizations(
    site_id: UUID,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    records = db.query(DeploymentOptimization).filter(DeploymentOptimization.site_id == site_id).order_by(DeploymentOptimization.created_at.desc()).all()
    return records


@router.post("/sites/{site_id}/recommendation/generate")
def generate_site_recommendation(
    site_id: UUID,
    request: Request,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Candidate site not found")

    # Prerequisite Guardrail: Site suitability and energy forecast must be calculated first
    import uuid as _uuid
    sid2 = site_id if not isinstance(site_id, str) else _uuid.UUID(str(site_id))
    suitability_exists = db.query(SiteSuitability).filter(SiteSuitability.site_id == sid2).first()
    score_exists = db.query(SiteScore).filter(SiteScore.site_id == sid2).first()
    forecast_exists = db.query(EnergyForecast).filter(EnergyForecast.site_id == sid2).first()

    if (not suitability_exists and not score_exists) or not forecast_exists:
        raise HTTPException(
            status_code=400,
            detail="Cannot generate recommendation: Site suitability and energy forecast must be calculated first."
        )

    rec = run_and_store_recommendation(db=db, site_id=str(site_id))
    site.status = "RECOMMENDATION_READY"
    db.commit()

    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db=db,
        user_id=str(current_user.id),
        action="RECOMMENDATION_GENERATE",
        entity="SITE",
        entity_id=str(site_id),
        ip_address=client_ip,
    )

    return {
        "id": str(rec.id),
        "site_id": str(rec.site_id),
        "technology": rec.technology,
        "expected_energy_output": float(rec.expected_energy_output),
        "investment_estimate": float(rec.investment_estimate),
        "expected_revenue": float(rec.expected_revenue),
        "investment_payback": float(rec.investment_payback),
        "recommendation_status": rec.recommendation_status,
        "explanation": rec.explanation,
        "created_at": rec.created_at.isoformat() if rec.created_at else None,
    }


@router.get("/sites/{site_id}/recommendation")
def get_site_recommendations(
    site_id: UUID,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    records = db.query(Recommendation).filter(Recommendation.site_id == site_id).order_by(Recommendation.created_at.desc()).all()
    return records
