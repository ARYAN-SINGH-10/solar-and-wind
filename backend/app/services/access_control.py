"""
Access Control & Ownership Isolation Service
Enforces strict account-level data isolation and role-based permissions.
Ensures users only access records belonging to their own projects, sites, and reports.
"""

from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session, Query
from sqlalchemy import or_

from fastapi import HTTPException, status

from app.models.user import User
from app.models.role import Role
from app.models.project import Project
from app.models.site import Site
from app.models.report import Report
from app.models.site_comparison import SiteComparison


def is_admin_user(user: User, db: Session) -> bool:
    """Check if the given user has the ADMINISTRATOR role."""
    if not user:
        return False
    if hasattr(user, "role_rel") and user.role_rel and hasattr(user.role_rel, "role_name"):
        return user.role_rel.role_name == "ADMINISTRATOR"
    role = db.query(Role).filter(Role.id == user.role_id).first()
    return role.role_name == "ADMINISTRATOR" if role else False


def filter_projects_by_user(query: Query, user: User, db: Session) -> Query:
    """Filter projects query by authenticated user ownership unless administrator."""
    if is_admin_user(user, db):
        return query
    return query.filter(Project.created_by == user.id)


def get_authorized_project(db: Session, project_id: UUID, user: User) -> Project:
    """Retrieve project by ID only if owned by user or if user is administrator."""
    query = db.query(Project).filter(Project.id == project_id)
    project = filter_projects_by_user(query, user, db).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


def filter_sites_by_user(query: Query, user: User, db: Session) -> Query:
    """
    Filter candidate sites query by authenticated user ownership unless administrator.
    Sites inherit project ownership and can also match explicit site.created_by.
    """
    if is_admin_user(user, db):
        return query
    return query.outerjoin(Project, Site.project_id == Project.id).filter(
        or_(
            Project.created_by == user.id,
            Site.created_by == user.id
        )
    )


def get_authorized_site(db: Session, site_id: UUID, user: User) -> Site:
    """Retrieve candidate site by ID only if authorized for user."""
    import uuid
    sid = uuid.UUID(str(site_id)) if isinstance(site_id, str) else site_id
    query = db.query(Site).filter(Site.id == sid)
    site = filter_sites_by_user(query, user, db).first()
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate site not found")
    return site


def get_user_project_ids(db: Session, user: User) -> List[UUID]:
    """Return all project IDs authorized for this user."""
    query = db.query(Project.id)
    if not is_admin_user(user, db):
        query = query.filter(Project.created_by == user.id)
    return [row[0] for row in query.all()]


def get_user_site_ids(db: Session, user: User) -> List[UUID]:
    """Return all candidate site IDs authorized for this user."""
    query = db.query(Site.id)
    if not is_admin_user(user, db):
        query = query.outerjoin(Project, Site.project_id == Project.id).filter(
            or_(
                Project.created_by == user.id,
                Site.created_by == user.id
            )
        )
    return [row[0] for row in query.all()]


def filter_reports_by_user(query: Query, user: User, db: Session) -> Query:
    """Filter reports query by user ownership or project/site authorization."""
    if is_admin_user(user, db):
        return query
    user_proj_ids = get_user_project_ids(db, user)
    user_site_ids = get_user_site_ids(db, user)
    return query.filter(
        or_(
            Report.generated_by == user.id,
            Report.project_id.in_(user_proj_ids) if user_proj_ids else False,
            Report.site_id.in_(user_site_ids) if user_site_ids else False,
        )
    )


def get_authorized_report(db: Session, report_id: UUID, user: User) -> Report:
    """Retrieve report by ID only if user is authorized."""
    import uuid
    rid = uuid.UUID(str(report_id)) if isinstance(report_id, str) else report_id
    query = db.query(Report).filter(Report.id == rid)
    report = filter_reports_by_user(query, user, db).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return report


def filter_comparisons_by_user(query: Query, user: User, db: Session) -> Query:
    """Filter site comparisons query by user ownership unless administrator."""
    if is_admin_user(user, db):
        return query
    return query.filter(SiteComparison.created_by == user.id)


def get_authorized_comparison(db: Session, comparison_id: UUID, user: User) -> SiteComparison:
    """Retrieve site comparison group by ID only if authorized for user."""
    import uuid
    cid = uuid.UUID(str(comparison_id)) if isinstance(comparison_id, str) else comparison_id
    query = db.query(SiteComparison).filter(SiteComparison.id == cid)
    comp = filter_comparisons_by_user(query, user, db).first()
    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comparison not found")
    return comp
