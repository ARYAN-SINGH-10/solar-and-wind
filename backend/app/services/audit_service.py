import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)


def log_audit_event(
    db: Session,
    action: str,
    entity: str,
    user_id: Optional[str] = None,
    entity_id: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> Optional[AuditLog]:
    """
    Records security, authentication, role mutation, and project lifecycle events
    into the database audit_logs table.
    """
    import uuid
    uid = uuid.UUID(str(user_id)) if user_id else None
    try:
        log_entry = AuditLog(
            user_id=uid,
            action=action,
            entity=entity,
            entity_id=str(entity_id) if entity_id else None,
            ip_address=ip_address or "127.0.0.1",
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        logger.info(f"AUDIT LOG: [{action}] by user '{user_id}' on entity '{entity}' ({entity_id})")
        return log_entry
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to record audit log: {str(e)}")
        return None
