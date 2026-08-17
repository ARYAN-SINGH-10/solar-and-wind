import uuid
from sqlalchemy import Column, String, Text, Numeric, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)
    technology = Column(String(50), nullable=False)
    expected_energy_output = Column(Numeric(14, 2), nullable=False)
    investment_estimate = Column(Numeric(14, 2), nullable=False)
    expected_revenue = Column(Numeric(14, 2), nullable=False)
    investment_payback = Column(Numeric(5, 2), nullable=False) # In years
    recommendation_status = Column(String(50), nullable=False) # RECOMMENDED, CONDITIONALLY_RECOMMENDED, REJECTED
    explanation = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    site = relationship("Site", back_populates="recommendations")
