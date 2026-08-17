from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, text
from app.core.database import get_db
from app.models.project import Project
from app.models.site import Site
from app.models.user import User
from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
    PaginatedProjectResponse,
    ProjectStatsResponse
)
from app.schemas.site import SiteCreate, SiteResponse, PaginatedSiteResponse
from app.api.v1.deps import require_roles
from app.services.audit_service import log_audit_event

router = APIRouter()


@router.get("", response_model=PaginatedProjectResponse)
def list_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    status: Optional[str] = None,
    region: Optional[str] = None,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    """
    List, search, and filter projects with pagination.
    Supports filtering by search query (name or code), status, and region.
    """
    query = db.query(Project)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Project.project_name.ilike(search_pattern),
                Project.project_code.ilike(search_pattern),
                Project.region.ilike(search_pattern)
            )
        )

    if status:
        query = query.filter(Project.status == status.upper())

    if region:
        query = query.filter(Project.region.ilike(f"%{region}%"))

    total = query.count()
    projects = query.order_by(Project.created_at.desc()).offset(skip).limit(limit).all()

    return PaginatedProjectResponse(
        total=total,
        skip=skip,
        limit=limit,
        items=projects
    )


@router.get("/stats", response_model=ProjectStatsResponse)
def get_project_statistics(
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    """Retrieve overall project summary metrics and status counts."""
    total_projects = db.query(Project).count()
    draft_count = db.query(Project).filter(Project.status == "DRAFT").count()
    in_review_count = db.query(Project).filter(Project.status == "IN_REVIEW").count()
    approved_count = db.query(Project).filter(Project.status == "APPROVED").count()
    archived_count = db.query(Project).filter(Project.status == "ARCHIVED").count()

    total_area_res = db.query(func.sum(Project.land_area)).scalar() or 0.0

    return ProjectStatsResponse(
        total_projects=total_projects,
        draft_count=draft_count,
        in_review_count=in_review_count,
        approved_count=approved_count,
        archived_count=archived_count,
        total_land_area_sq_km=float(total_area_res)
    )


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    request: Request,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    """Create a new solar/wind deployment project with validation and audit logging."""
    existing_code = db.query(Project).filter(Project.project_code == project_in.project_code).first()
    if existing_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project with code '{project_in.project_code}' already exists."
        )

    project = Project(
        project_name=project_in.project_name,
        project_code=project_in.project_code,
        region=project_in.region,
        description=project_in.description,
        land_area=project_in.land_area,
        created_by=current_user.id,
        status=project_in.status,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db=db,
        user_id=str(current_user.id),
        action="PROJECT_CREATION",
        entity="PROJECT",
        entity_id=str(project.id),
        ip_address=client_ip,
    )

    return project


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: UUID,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    """Retrieve details for a specific project by ID."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: UUID,
    project_in: ProjectUpdate,
    request: Request,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    """Update project details or status with validation and audit logging."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if project_in.project_code and project_in.project_code != project.project_code:
        existing = db.query(Project).filter(Project.project_code == project_in.project_code).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Project code '{project_in.project_code}' is already taken."
            )
        project.project_code = project_in.project_code

    if project_in.project_name is not None:
        project.project_name = project_in.project_name
    if project_in.region is not None:
        project.region = project_in.region
    if project_in.description is not None:
        project.description = project_in.description
    if project_in.land_area is not None:
        project.land_area = project_in.land_area
    if project_in.status is not None:
        project.status = project_in.status

    db.commit()
    db.refresh(project)

    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db=db,
        user_id=str(current_user.id),
        action="PROJECT_UPDATE",
        entity="PROJECT",
        entity_id=str(project.id),
        ip_address=client_ip,
    )

    return project


@router.delete("/{project_id}", status_code=status.HTTP_200_OK)
def delete_project(
    project_id: UUID,
    request: Request,
    current_user: User = Depends(require_roles(["PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    """Delete or archive a project and record audit log."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    project_name = project.project_name
    db.delete(project)
    db.commit()

    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db=db,
        user_id=str(current_user.id),
        action="PROJECT_DELETION",
        entity="PROJECT",
        entity_id=str(project_id),
        ip_address=client_ip,
    )

    return {"message": f"Project '{project_name}' successfully deleted.", "id": str(project_id)}


@router.post("/{project_id}/sites", response_model=SiteResponse, status_code=status.HTTP_201_CREATED)
def create_site_for_project(
    project_id: UUID,
    site_in: SiteCreate,
    request: Request,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    """Create a new site linked to project with PostGIS POINT geometry creation."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if not (-90.0 <= site_in.latitude <= 90.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Latitude must be between -90.0 and 90.0 degrees"
        )
    if not (-180.0 <= site_in.longitude <= 180.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Longitude must be between -180.0 and 180.0 degrees"
        )

    location_geom = func.ST_GeomFromText(f"POINT({site_in.longitude} {site_in.latitude})", 4326)

    site = Site(
        project_id=project_id,
        site_name=site_in.site_name,
        latitude=site_in.latitude,
        longitude=site_in.longitude,
        location=location_geom,
        region=site_in.region or project.region,
        land_area=site_in.land_area,
        elevation=site_in.elevation,
        land_ownership=site_in.land_ownership,
        existing_infrastructure=site_in.existing_infrastructure,
        status=site_in.status,
    )

    db.add(site)
    db.commit()
    db.refresh(site)

    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db=db,
        user_id=str(current_user.id),
        action="SITE_CREATION",
        entity="SITE",
        entity_id=str(site.id),
        ip_address=client_ip,
    )

    return SiteResponse(
        id=site.id,
        project_id=site.project_id,
        site_name=site.site_name,
        latitude=float(site.latitude),
        longitude=float(site.longitude),
        region=site.region,
        land_area=float(site.land_area) if site.land_area else None,
        elevation=float(site.elevation) if site.elevation else None,
        land_ownership=site.land_ownership,
        existing_infrastructure=site.existing_infrastructure,
        status=site.status,
        created_at=site.created_at,
        updated_at=site.updated_at,
    )


@router.get("/{project_id}/sites", response_model=PaginatedSiteResponse)
def list_sites_for_project(
    project_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    """List candidate sites linked to a specific project with pagination."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    query = db.query(Site).filter(Site.project_id == project_id)
    total = query.count()
    raw_sites = query.order_by(Site.created_at.desc()).offset(skip).limit(limit).all()

    items = []
    for s in raw_sites:
        items.append(SiteResponse(
            id=s.id,
            project_id=s.project_id,
            site_name=s.site_name,
            latitude=float(s.latitude),
            longitude=float(s.longitude),
            region=s.region,
            land_area=float(s.land_area) if s.land_area else None,
            elevation=float(s.elevation) if s.elevation else None,
            land_ownership=s.land_ownership,
            existing_infrastructure=s.existing_infrastructure,
            status=s.status,
            created_at=s.created_at,
            updated_at=s.updated_at,
        ))

    return PaginatedSiteResponse(
        total=total,
        skip=skip,
        limit=limit,
        items=items
    )
