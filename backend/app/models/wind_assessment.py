import uuid
from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class WindAssessment(Base):
    __tablename__ = "wind_assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)
    average_wind_speed = Column(Numeric(6, 2), nullable=False)
    wind_power_density = Column(Numeric(10, 2), nullable=False)
    turbulence_intensity = Column(Numeric(5, 2), nullable=True)
    capacity_factor = Column(Numeric(5, 2), nullable=False)
    expected_annual_energy_production = Column(Numeric(14, 2), nullable=False)
    turbine_suitability = Column(String(100), nullable=True)
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    site = relationship("Site", back_populates="wind_assessments")
