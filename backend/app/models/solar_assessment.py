import uuid
from sqlalchemy import Column, Numeric, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class SolarAssessment(Base):
    __tablename__ = "solar_assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)
    annual_irradiance = Column(Numeric(10, 2), nullable=False)
    peak_sun_hours = Column(Numeric(6, 2), nullable=False)
    panel_efficiency = Column(Numeric(5, 2), nullable=False)
    expected_energy_output = Column(Numeric(14, 2), nullable=False)
    capacity_factor = Column(Numeric(5, 2), nullable=False)
    performance_ratio = Column(Numeric(5, 2), nullable=False)
    shading_factor = Column(Numeric(5, 2), default=0.00)
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    site = relationship("Site", back_populates="solar_assessments")
