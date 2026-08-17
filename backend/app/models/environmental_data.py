import uuid
from sqlalchemy import Column, String, Numeric, Date, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class EnvironmentalData(Base):
    __tablename__ = "environmental_data"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)
    solar_irradiance = Column(Numeric(10, 2), nullable=True)
    wind_speed = Column(Numeric(6, 2), nullable=True)
    wind_direction = Column(Numeric(5, 2), nullable=True)
    temperature = Column(Numeric(5, 2), nullable=True)
    rainfall = Column(Numeric(8, 2), nullable=True)
    humidity = Column(Numeric(5, 2), nullable=True)
    cloud_cover = Column(Numeric(5, 2), nullable=True)
    elevation = Column(Numeric(8, 2), nullable=True)
    land_slope = Column(Numeric(5, 2), nullable=True)
    vegetation_index = Column(Numeric(5, 4), nullable=True)
    observation_date = Column(Date, nullable=False, index=True)
    data_source = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    site = relationship("Site", back_populates="environmental_data")
