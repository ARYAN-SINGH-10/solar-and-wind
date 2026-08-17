from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, text
from app.core.database import get_db
from app.models.site import Site
from app.models.project import Project
from app.models.user import User
from app.schemas.site import SiteCreate, SiteResponse, SiteUpdate, PaginatedSiteResponse
from app.api.v1.deps import require_roles
from app.services.audit_service import log_audit_event

router = APIRouter()


@router.post("", response_model=SiteResponse, status_code=status.HTTP_201_CREATED)
def create_site_direct(
    site_in: SiteCreate,
    request: Request,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    """Create candidate site directly with PostGIS POINT geometry."""
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
        project_id=site_in.project_id,
        site_name=site_in.site_name,
        latitude=site_in.latitude,
        longitude=site_in.longitude,
        location=location_geom,
        region=site_in.region,
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


@router.get("", response_model=PaginatedSiteResponse)
def list_all_sites(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    status: Optional[str] = None,
    project_id: Optional[UUID] = None,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    """List, search, and filter candidate sites with pagination."""
    query = db.query(Site)

    if project_id:
        query = query.filter(Site.project_id == project_id)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Site.site_name.ilike(search_pattern),
                Site.region.ilike(search_pattern),
                Site.land_ownership.ilike(search_pattern)
            )
        )

    if status:
        query = query.filter(Site.status == status.upper())

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


@router.get("/{site_id}", response_model=SiteResponse)
def get_site(
    site_id: UUID,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    """Retrieve details for a specific candidate site by ID."""
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")

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


@router.put("/{site_id}", response_model=SiteResponse)
def update_site(
    site_id: UUID,
    site_in: SiteUpdate,
    request: Request,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    """Update candidate site details and update PostGIS POINT geometry."""
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")

    coord_changed = False
    if site_in.site_name is not None:
        site.site_name = site_in.site_name
    if site_in.latitude is not None and site_in.latitude != float(site.latitude):
        site.latitude = site_in.latitude
        coord_changed = True
    if site_in.longitude is not None and site_in.longitude != float(site.longitude):
        site.longitude = site_in.longitude
        coord_changed = True
    if site_in.region is not None:
        site.region = site_in.region
    if site_in.land_area is not None:
        site.land_area = site_in.land_area
    if site_in.elevation is not None:
        site.elevation = site_in.elevation
    if site_in.land_ownership is not None:
        site.land_ownership = site_in.land_ownership
    if site_in.existing_infrastructure is not None:
        site.existing_infrastructure = site_in.existing_infrastructure
    if site_in.status is not None:
        site.status = site_in.status

    db.commit()

    if coord_changed:
        try:
            db.execute(
                text("UPDATE sites SET location = ST_SetSRID(ST_MakePoint(:lon, :lat), 4326) WHERE id = :id"),
                {"lon": site.longitude, "lat": site.latitude, "id": str(site.id)}
            )
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to update PostGIS location point: {str(e)}")

    db.refresh(site)

    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db=db,
        user_id=str(current_user.id),
        action="SITE_UPDATE",
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


@router.delete("/{site_id}", status_code=status.HTTP_200_OK)
def delete_site(
    site_id: UUID,
    request: Request,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    """Delete candidate site and record audit log."""
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")

    site_name = site.site_name
    db.delete(site)
    db.commit()

    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db=db,
        user_id=str(current_user.id),
        action="SITE_DELETION",
        entity="SITE",
        entity_id=str(site_id),
        ip_address=client_ip,
    )

    return {"message": f"Site '{site_name}' successfully deleted.", "id": str(site_id)}
