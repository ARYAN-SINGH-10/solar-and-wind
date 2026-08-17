from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query, Response
from fastapi.responses import StreamingResponse, Response
import io
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.report import Report
from app.api.v1.deps import require_roles
from app.services.report_service import (
    generate_site_report,
    generate_report_binary,
    get_site_reports,
    get_project_reports,
    get_all_reports,
    REPORT_TYPES,
)
from app.services.audit_service import log_audit_event
from pydantic import BaseModel

router = APIRouter()


class CreateReportPayload(BaseModel):
    site_id: UUID
    project_id: Optional[UUID] = None


@router.post("/reports/site-assessment")
def create_site_assessment_report(
    payload: CreateReportPayload,
    request: Request,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db),
):
    """Generate Site Assessment Report using actual DB results."""
    return _generate_and_audit(db, str(payload.site_id), "SITE_ASSESSMENT", current_user, request)


@router.post("/reports/solar")
def create_solar_potential_report(
    payload: CreateReportPayload,
    request: Request,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db),
):
    """Generate Solar Potential Report using actual DB results."""
    return _generate_and_audit(db, str(payload.site_id), "SOLAR_POTENTIAL", current_user, request)


@router.post("/reports/wind")
def create_wind_potential_report(
    payload: CreateReportPayload,
    request: Request,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db),
):
    """Generate Wind Potential Report using actual DB results."""
    return _generate_and_audit(db, str(payload.site_id), "WIND_POTENTIAL", current_user, request)


@router.post("/reports/feasibility")
def create_feasibility_report(
    payload: CreateReportPayload,
    request: Request,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db),
):
    """Generate Feasibility Report using actual DB results."""
    return _generate_and_audit(db, str(payload.site_id), "FEASIBILITY", current_user, request)


@router.post("/reports/investment")
def create_investment_report(
    payload: CreateReportPayload,
    request: Request,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db),
):
    """Generate Investment Report using actual DB results."""
    return _generate_and_audit(db, str(payload.site_id), "INVESTMENT", current_user, request)


def _generate_and_audit(db: Session, site_id: str, report_type: str, user: User, request: Request):
    try:
        report = generate_site_report(
            db=db,
            site_id=site_id,
            report_type=report_type,
            generated_by_id=str(user.id),
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db=db,
        user_id=str(user.id),
        action=f"REPORT_GENERATED_{report_type}",
        entity="SITE",
        entity_id=site_id,
        ip_address=client_ip,
    )
    return {
        "id": str(report.id),
        "site_id": str(report.site_id) if report.site_id else None,
        "project_id": str(report.project_id) if report.project_id else None,
        "report_type": report.report_type,
        "title": report.title,
        "description": report.description,
        "status": report.status,
        "report_data": report.report_data,
        "generated_at": report.generated_at.isoformat() if report.generated_at else None,
    }


@router.get("/reports")
def list_all_reports(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db),
):
    """List all generated reports across the platform with pagination."""
    return get_all_reports(db=db, limit=limit, offset=offset)


@router.get("/reports/{report_id}")
def get_report_by_id(
    report_id: UUID,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db),
):
    """Retrieve a specific report by ID including full JSON payload."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.get("/reports/{report_id}/download")
def download_report(
    report_id: UUID,
    format: str = Query("pdf", description="Export format: pdf or excel"),
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db),
):
    """
    Download actual report in PDF or Excel (.xlsx) format.
    Renders actual database metrics into styled binary files.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    content, filename, media_type = generate_report_binary(report, fmt=format)

    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"'
    }

    return Response(
        content=content,
        media_type=media_type,
        headers=headers
    )


@router.delete("/reports/{report_id}", status_code=204)
def delete_report(
    report_id: UUID,
    current_user: User = Depends(require_roles(["ADMINISTRATOR"])),
    db: Session = Depends(get_db),
):
    """Delete a report record (Administrator only)."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    db.delete(report)
    db.commit()
    return None
