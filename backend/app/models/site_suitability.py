import uuid
from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class SiteSuitability(Base):
    __tablename__ = "site_suitability"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)
    renewable_resource_score = Column(Numeric(5, 2), nullable=False)
    geographic_score = Column(Numeric(5, 2), nullable=False)
    infrastructure_score = Column(Numeric(5, 2), nullable=False)
    environmental_score = Column(Numeric(5, 2), nullable=False)
    economic_score = Column(Numeric(5, 2), nullable=False)
    overall_score = Column(Numeric(5, 2), nullable=False)
    category = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    site = relationship("Site", back_populates="site_suitabilities")
