import uuid
from sqlalchemy import Column, String, Text, Boolean, ForeignKey, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=True, index=True)
    generated_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    report_type = Column(String(100), nullable=False)  # SITE_SUITABILITY, ENERGY_FORECAST, FULL_FEASIBILITY, GIS_EXPORT
    title = Column(String(512), nullable=False)
    description = Column(Text, nullable=True)
    report_data = Column(JSONB, nullable=True)          # Structured JSON payload embedded in report
    file_path = Column(String(512), nullable=True)      # Physical file path if exported
    file_size_bytes = Column(Integer, nullable=True)
    status = Column(String(50), default="GENERATED")   # GENERATED, EXPORTED, ARCHIVED
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    project = relationship("Project", back_populates="reports")
    site = relationship("Site", back_populates="reports")
    generator = relationship("User", back_populates="reports")
