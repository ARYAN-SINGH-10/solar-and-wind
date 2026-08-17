from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, validator

# ---------------------------------------------------------------------------
# Canonical site status definitions
# ---------------------------------------------------------------------------
# Workflow statuses — set by the platform as a site moves through analysis
WORKFLOW_STATUSES = [
    "CREATED",
    "DATA_PENDING",
    "DATA_COLLECTED",
    "ANALYZED",
    "SUITABILITY_CALCULATED",
    "SCORED",
    "FORECASTED",
    "OPTIMIZED",
    "RECOMMENDATION_READY",
    "REPORT_GENERATED",
]

# Administrative statuses — set by users/managers
ADMINISTRATIVE_STATUSES = [
    "PROPOSED",
    "EVALUATING",
    "APPROVED",
    "REJECTED",
    "ARCHIVED",
]

# All valid statuses accepted anywhere in the system
ALL_VALID_STATUSES = WORKFLOW_STATUSES + ADMINISTRATIVE_STATUSES


class SiteBase(BaseModel):
    site_name: str = Field(..., min_length=2, max_length=255)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    region: Optional[str] = Field(None, max_length=255)
    land_area: Optional[float] = Field(None, ge=0.0)
    elevation: Optional[float] = Field(None, ge=0.0)
    land_ownership: Optional[str] = Field(None, max_length=255)
    existing_infrastructure: Optional[str] = None
    # Default for new sites is PROPOSED (administrative)
    status: str = Field("PROPOSED", max_length=50)

    @validator("status")
    def validate_status(cls, v):
        if v.upper() not in ALL_VALID_STATUSES:
            raise ValueError(
                f"Status must be one of: {', '.join(ALL_VALID_STATUSES)}"
            )
        return v.upper()


class SiteCreate(SiteBase):
    project_id: Optional[UUID] = None


class SiteUpdate(BaseModel):
    site_name: Optional[str] = Field(None, min_length=2, max_length=255)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    region: Optional[str] = Field(None, max_length=255)
    land_area: Optional[float] = Field(None, ge=0.0)
    elevation: Optional[float] = Field(None, ge=0.0)
    land_ownership: Optional[str] = Field(None, max_length=255)
    existing_infrastructure: Optional[str] = None
    status: Optional[str] = None

    @validator("status")
    def validate_status(cls, v):
        if v is not None:
            if v.upper() not in ALL_VALID_STATUSES:
                raise ValueError(
                    f"Status must be one of: {', '.join(ALL_VALID_STATUSES)}"
                )
            return v.upper()
        return v


class SiteResponse(SiteBase):
    id: UUID
    project_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaginatedSiteResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[SiteResponse]
