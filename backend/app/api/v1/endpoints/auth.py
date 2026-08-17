from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_access_token, verify_password, get_password_hash
from app.models.user import User
from app.models.role import Role
from app.schemas.user import UserCreate, UserResponse, Token
from app.services.audit_service import log_audit_event
from app.api.v1.deps import get_current_active_user

router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(
    user_in: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Registers a new platform user with name, email, password, phone, organization, and role selection.
    Hashes password securely using bcrypt and logs registration audit event.
    """
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account with this email address already exists."
        )

    # Validate role_id
    role = db.query(Role).filter(Role.id == user_in.role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role_id: {user_in.role_id}. Please select a valid system role."
        )

    user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role_id=role.id,
        phone=user_in.phone,
        organization=user_in.organization,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db=db,
        user_id=str(user.id),
        action="USER_REGISTRATION",
        entity="USER",
        entity_id=str(user.id),
        ip_address=client_ip,
    )

    access_token = create_access_token(
        subject=user.id,
        role_name=role.role_name,
        role_id=role.id
    )

    user_resp = UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role_id=user.role_id,
        phone=user.phone,
        organization=user.organization,
        is_active=user.is_active,
        created_at=user.created_at,
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_resp,
    )


@router.post("/login", response_model=Token)
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Authenticates user using email and password.
    Returns signed JWT access token containing user_id and role metadata.
    Logs login audit event.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Contact system administrator.",
        )

    role = db.query(Role).filter(Role.id == user.role_id).first()
    role_name = role.role_name if role else "ENERGY_PLANNER"

    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db=db,
        user_id=str(user.id),
        action="USER_LOGIN",
        entity="USER",
        entity_id=str(user.id),
        ip_address=client_ip,
    )

    access_token = create_access_token(
        subject=user.id,
        role_name=role_name,
        role_id=user.role_id
    )

    user_resp = UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role_id=user.role_id,
        phone=user.phone,
        organization=user.organization,
        is_active=user.is_active,
        created_at=user.created_at,
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_resp,
    )


@router.post("/logout")
def logout(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Logs user logout audit event."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db=db,
        user_id=str(current_user.id),
        action="USER_LOGOUT",
        entity="USER",
        entity_id=str(current_user.id),
        ip_address=client_ip,
    )
    return {"message": "Successfully logged out."}


@router.get("/me")
def read_current_user(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Returns profile details of the current authenticated user along with role info."""
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role_id": current_user.role_id,
        "role_name": role.role_name if role else "ENERGY_PLANNER",
        "phone": current_user.phone,
        "organization": current_user.organization,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
    }


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.patch("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Allows an authenticated user to change their own password.
    Verifies the current password before applying the new bcrypt hash.
    """
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )
    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="New password must be at least 8 characters.",
        )
    current_user.password_hash = get_password_hash(payload.new_password)
    db.commit()

    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db=db,
        user_id=str(current_user.id),
        action="PASSWORD_CHANGE",
        entity="USER",
        entity_id=str(current_user.id),
        ip_address=client_ip,
    )

    return {"message": "Password changed successfully."}

