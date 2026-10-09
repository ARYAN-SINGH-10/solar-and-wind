from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.site_comparison import SiteComparison
from app.api.v1.deps import require_roles
from app.services.access_control import (
    get_authorized_site,
    get_authorized_comparison,
    filter_comparisons_by_user,
)
from app.services.comparison_service import (
    compare_sites_direct,
    create_comparison,
    get_comparison_detail,
    list_comparisons,
    delete_comparison,
)
from app.services.audit_service import log_audit_event
from pydantic import BaseModel

router = APIRouter()


class DirectComparePayload(BaseModel):
    site_ids: List[UUID]


class CreateComparisonRequest(BaseModel):
    comparison_name: str
    site_ids: List[UUID]
    description: Optional[str] = None


@router.post("/sites/compare", status_code=200)
def compare_candidate_sites(
    payload: DirectComparePayload,
    request: Request,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db),
):
    """
    POST /sites/compare — Directly compares 2 to 5 candidate sites.
    Returns structured comparison with 18 metrics per site and recommended best site.
    """
    if len(payload.site_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 candidate sites are required for comparison.")
    if len(payload.site_ids) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 sites allowed per comparison.")

    # Validate that current user is authorized to access all requested sites
    for sid in payload.site_ids:
        get_authorized_site(db, sid, current_user)

    site_str_ids = [str(s) for s in payload.site_ids]
    res = compare_sites_direct(db=db, site_ids=site_str_ids)

    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db=db,
        user_id=str(current_user.id),
        action="SITES_COMPARED",
        entity="SITE",
        entity_id="MULTIPLE",
        ip_address=client_ip,
    )

    return res


@router.post("/comparisons", status_code=201)
def create_site_comparison(
    payload: CreateComparisonRequest,
    request: Request,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db),
):
    """Create a named multi-site comparison group (2-5 sites)."""
    if len(payload.site_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 sites required for comparison.")
    if len(payload.site_ids) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 sites per comparison.")

    # Validate that current user is authorized to access all requested sites
    for sid in payload.site_ids:
        get_authorized_site(db, sid, current_user)

    comparison = create_comparison(
        db=db,
        created_by=str(current_user.id),
        comparison_name=payload.comparison_name,
        site_ids=[str(s) for s in payload.site_ids],
        description=payload.description,
    )

    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db=db,
        user_id=str(current_user.id),
        action="COMPARISON_CREATED",
        entity="COMPARISON",
        entity_id=str(comparison.id),
        ip_address=client_ip,
    )

    return {
        "id": str(comparison.id),
        "comparison_name": comparison.comparison_name,
        "description": comparison.description,
        "created_by": str(comparison.created_by) if comparison.created_by else None,
        "created_at": comparison.created_at.isoformat() if comparison.created_at else None,
    }


@router.get("/comparisons")
def list_site_comparisons(
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db),
):
    query = filter_comparisons_by_user(db.query(SiteComparison), current_user, db)
    comparisons = query.order_by(SiteComparison.created_at.desc()).all()
    return [
        {
            "id": str(c.id),
            "comparison_name": c.comparison_name,
            "description": c.description,
            "created_by": str(c.created_by) if c.created_by else None,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in comparisons
    ]


@router.get("/comparisons/{comparison_id}")
def get_comparison(
    comparison_id: UUID,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db),
):
    comp = get_authorized_comparison(db, comparison_id, current_user)
    result = get_comparison_detail(db=db, comparison_id=str(comparison_id))
    if not result:
        raise HTTPException(status_code=404, detail="Comparison not found")
    return result


@router.delete("/comparisons/{comparison_id}", status_code=204)
def delete_site_comparison(
    comparison_id: UUID,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db),
):
    comp = get_authorized_comparison(db, comparison_id, current_user)
    success = delete_comparison(db=db, comparison_id=str(comparison_id))
    if not success:
        raise HTTPException(status_code=404, detail="Comparison not found")
    return None
