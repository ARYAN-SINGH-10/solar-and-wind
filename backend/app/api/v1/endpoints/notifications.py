from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.api.v1.deps import require_roles, get_current_user
from app.services.notification_service import (
    create_notification,
    get_user_notifications,
    get_unread_notifications,
    mark_notification_read,
    mark_all_notifications_read,
    get_unread_count,
    delete_notification,
    NOTIFICATION_TYPES,
)
from pydantic import BaseModel

router = APIRouter()


class CreateNotificationRequest(BaseModel):
    user_id: UUID
    notification_type: str
    title: str
    message: str


@router.get("/notifications")
def list_user_notifications(
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """GET /notifications — List all notifications for authenticated user."""
    return get_user_notifications(db=db, user_id=str(current_user.id), unread_only=unread_only)


@router.get("/notifications/unread")
def list_unread_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """GET /notifications/unread — List only unread notifications for authenticated user."""
    return get_unread_notifications(db=db, user_id=str(current_user.id))


@router.get("/notifications/unread-count")
def get_unread_count_badge(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return numeric count of unread notifications for badge."""
    count = get_unread_count(db=db, user_id=str(current_user.id))
    return {"unread_count": count}


@router.put("/notifications/{notification_id}/read")
@router.patch("/notifications/{notification_id}/read")
def mark_single_notification_as_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """PUT & PATCH /notifications/{id}/read — Mark a specific notification as read."""
    notif = mark_notification_read(
        db=db,
        notification_id=str(notification_id),
        user_id=str(current_user.id),
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notif


@router.put("/notifications/read-all")
@router.patch("/notifications/mark-all-read")
def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """PUT /notifications/read-all — Mark all unread notifications read for authenticated user."""
    count = mark_all_notifications_read(db=db, user_id=str(current_user.id))
    return {"marked_read": count}


@router.delete("/notifications/{notification_id}", status_code=204)
def delete_user_notification(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a specific notification owned by current user."""
    success = delete_notification(
        db=db,
        notification_id=str(notification_id),
        user_id=str(current_user.id),
    )
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return None


@router.post("/notifications/send", status_code=201)
def send_notification(
    payload: CreateNotificationRequest,
    current_user: User = Depends(require_roles(["ADMINISTRATOR"])),
    db: Session = Depends(get_db),
):
    """Administrator: Send a notification to any user using predefined type template."""
    notif = create_notification(
        db=db,
        user_id=str(payload.user_id),
        notification_type=payload.notification_type,
        title=payload.title,
        message=payload.message,
    )
    return notif
