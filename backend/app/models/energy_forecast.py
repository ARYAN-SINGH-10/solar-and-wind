import uuid
from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class EnergyForecast(Base):
    __tablename__ = "energy_forecasts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)
    technology = Column(String(50), nullable=False) # SOLAR, WIND, HYBRID
    capacity_kw = Column(Numeric(12, 2), nullable=False)
    monthly_generation = Column(JSONB, nullable=True) # 12-month array
    annual_generation = Column(Numeric(14, 2), nullable=False)
    expected_revenue = Column(Numeric(14, 2), nullable=True)
    forecast_period = Column(String(50), default="25_YEARS")
    assumptions = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    site = relationship("Site", back_populates="energy_forecasts")
