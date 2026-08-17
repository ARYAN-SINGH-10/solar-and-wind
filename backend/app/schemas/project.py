from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, validator


class ProjectBase(BaseModel):
    project_name: str = Field(..., min_length=2, max_length=255)
    project_code: str = Field(..., min_length=2, max_length=100)
    region: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    land_area: Optional[float] = Field(None, ge=0.0)
    status: str = Field("DRAFT", max_length=50)

    @validator("status")
    def validate_status(cls, v):
        allowed = ["DRAFT", "IN_REVIEW", "APPROVED", "ARCHIVED"]
        if v.upper() not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v.upper()


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    project_name: Optional[str] = Field(None, min_length=2, max_length=255)
    project_code: Optional[str] = Field(None, min_length=2, max_length=100)
    region: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    land_area: Optional[float] = Field(None, ge=0.0)
    status: Optional[str] = None

    @validator("status")
    def validate_status(cls, v):
        if v is not None:
            allowed = ["DRAFT", "IN_REVIEW", "APPROVED", "ARCHIVED"]
            if v.upper() not in allowed:
                raise ValueError(f"Status must be one of: {', '.join(allowed)}")
            return v.upper()
        return v


class ProjectResponse(ProjectBase):
    id: UUID
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaginatedProjectResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[ProjectResponse]


class ProjectStatsResponse(BaseModel):
    total_projects: int
    draft_count: int
    in_review_count: int
    approved_count: int
    archived_count: int
    total_land_area_sq_km: float
