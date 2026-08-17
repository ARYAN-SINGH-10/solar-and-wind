"""
Notification and Alert Service
Provides predefined notification templates and deterministic event trigger rules.
Zero AI/ML used — all notification templates are strictly structured.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.user import User


NOTIFICATION_TYPES = {
    "WEATHER_ALERT": "Weather Alert",
    "SUITABILITY_UPDATE": "Site Suitability Update",
    "ENVIRONMENTAL_RISK": "Environmental Risk Alert",
    "FORECAST_UPDATE": "Forecast Update",
    "PROJECT_NOTIFICATION": "Project Notification",
    "SYSTEM_NOTIFICATION": "System Notification",
    # Legacy compatibility codes
    "ANALYSIS_COMPLETE": "Analysis Complete",
    "OPTIMIZATION_COMPLETE": "Optimization Complete",
    "RECOMMENDATION_GENERATED": "Recommendation Generated",
    "REPORT_GENERATED": "Report Generated",
    "PROJECT_STATUS_CHANGE": "Project Status Change",
    "SITE_ADDED": "Site Added",
    "DATA_FETCH_COMPLETE": "Data Fetch Complete",
    "SYSTEM_ALERT": "System Alert",
    "ROLE_CHANGE": "Role Change",
    "APPROVAL": "Approval",
}


def create_notification(
    db: Session,
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
) -> Notification:
    """Core function to create and persist a notification record for a specific user."""
    import uuid
    uid = uuid.UUID(str(user_id)) if isinstance(user_id, str) else user_id
    notif = Notification(
        user_id=uid,
        type=notification_type,
        title=title,
        message=message,
        read_status=False,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def broadcast_notification_to_role(
    db: Session,
    role_name: str,
    notification_type: str,
    title: str,
    message: str,
):
    """Sends notification to all active users with a given role."""
    from app.models.role import Role
    role = db.query(Role).filter(Role.role_name == role_name).first()
    if not role:
        return
    users = db.query(User).filter(User.role_id == role.id, User.is_active == True).all()
    for u in users:
        create_notification(db, str(u.id), notification_type, title, message)


# -----------------------------------------------------------------------------
# PREDEFINED NOTIFICATION TRIGGER RULES (Zero AI)
# -----------------------------------------------------------------------------

def trigger_environmental_change_notification(
    db: Session, user_id: str, site_name: str, parameter: str, old_val: float, new_val: float
):
    """Rule 1: If environmental data changes significantly -> create notification."""
    diff_pct = abs(new_val - old_val) / (old_val if old_val != 0 else 1.0) * 100.0
    if diff_pct >= 5.0:  # 5% threshold change
        title = f"Environmental Data Change: {site_name}"
        message = (
            f"Significant environmental parameter shift detected for site '{site_name}'. "
            f"Parameter '{parameter}' shifted from {old_val} to {new_val} ({diff_pct:.1f}% change)."
        )
        create_notification(db, user_id, "ENVIRONMENTAL_RISK", title, message)


def trigger_suitability_change_notification(
    db: Session, user_id: str, site_name: str, old_score: float, new_score: float, category: str
):
    """Rule 2: If site suitability score changes -> create notification."""
    if round(old_score, 1) != round(new_score, 1):
        title = f"Site Suitability Updated: {site_name}"
        message = (
            f"Suitability score for site '{site_name}' has been updated from {old_score:.1f} to {new_score:.1f}/100. "
            f"New classification: '{category}'."
        )
        create_notification(db, user_id, "SUITABILITY_UPDATE", title, message)


def trigger_project_status_notification(
    db: Session, user_id: str, project_name: str, project_code: str, old_status: str, new_status: str
):
    """Rule 3: If project status changes -> create notification."""
    if old_status != new_status:
        title = f"Project Status Updated: {project_code}"
        message = (
            f"Project '{project_name}' ({project_code}) status changed from '{old_status}' to '{new_status}'."
        )
        create_notification(db, user_id, "PROJECT_NOTIFICATION", title, message)


def trigger_forecast_update_notification(
    db: Session, user_id: str, site_name: str, capacity_kw: float, annual_mwh: float, revenue_usd: float
):
    """Rule 4: If new forecast is calculated -> create notification."""
    title = f"New Energy Forecast: {site_name}"
    message = (
        f"25-year deterministic energy forecast calculated for site '{site_name}' ({capacity_kw:.0f} kW capacity). "
        f"Projected Annual Output: {annual_mwh:,.2f} MWh/yr | Est. Annual Revenue: ${revenue_usd:,.2f}/yr."
    )
    create_notification(db, user_id, "FORECAST_UPDATE", title, message)


def trigger_weather_alert_notification(
    db: Session, user_id: str, site_name: str, condition: str, severity: str = "HIGH"
):
    """Rule 5: Weather alert notification template."""
    title = f"Weather Alert [{severity}]: {site_name}"
    message = (
        f"Weather event alert triggered for site '{site_name}'. Condition: {condition}. "
        f"Review environmental parameters and turbine cut-out speeds."
    )
    create_notification(db, user_id, "WEATHER_ALERT", title, message)


# -----------------------------------------------------------------------------
# QUERY & MARK READ HELPERS
# -----------------------------------------------------------------------------

def get_user_notifications(db: Session, user_id: str, unread_only: bool = False):
    import uuid
    uid = uuid.UUID(str(user_id)) if isinstance(user_id, str) else user_id
    query = db.query(Notification).filter(Notification.user_id == uid)
    if unread_only:
        query = query.filter(Notification.read_status == False)
    return query.order_by(Notification.created_at.desc()).all()


def get_unread_notifications(db: Session, user_id: str):
    """GET /notifications/unread handler helper."""
    import uuid
    uid = uuid.UUID(str(user_id)) if isinstance(user_id, str) else user_id
    return (
        db.query(Notification)
        .filter(Notification.user_id == uid, Notification.read_status == False)
        .order_by(Notification.created_at.desc())
        .all()
    )


def mark_notification_read(db: Session, notification_id: str, user_id: str) -> Notification | None:
    import uuid
    nid = uuid.UUID(str(notification_id)) if isinstance(notification_id, str) else notification_id
    uid = uuid.UUID(str(user_id)) if isinstance(user_id, str) else user_id
    notif = (
        db.query(Notification)
        .filter(Notification.id == nid, Notification.user_id == uid)
        .first()
    )
    if notif:
        notif.read_status = True
        db.commit()
        db.refresh(notif)
    return notif


def mark_all_notifications_read(db: Session, user_id: str) -> int:
    import uuid
    uid = uuid.UUID(str(user_id)) if isinstance(user_id, str) else user_id
    result = (
        db.query(Notification)
        .filter(Notification.user_id == uid, Notification.read_status == False)
        .all()
    )
    count = len(result)
    for n in result:
        n.read_status = True
    db.commit()
    return count


def get_unread_count(db: Session, user_id: str) -> int:
    import uuid
    uid = uuid.UUID(str(user_id)) if isinstance(user_id, str) else user_id
    return (
        db.query(Notification)
        .filter(Notification.user_id == uid, Notification.read_status == False)
        .count()
    )


def delete_notification(db: Session, notification_id: str, user_id: str) -> bool:
    import uuid
    nid = uuid.UUID(str(notification_id)) if isinstance(notification_id, str) else notification_id
    uid = uuid.UUID(str(user_id)) if isinstance(user_id, str) else user_id
    notif = (
        db.query(Notification)
        .filter(Notification.id == nid, Notification.user_id == uid)
        .first()
    )
    if notif:
        db.delete(notif)
        db.commit()
        return True
    return False
