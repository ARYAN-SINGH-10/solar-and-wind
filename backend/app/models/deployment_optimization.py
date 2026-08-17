import uuid
from sqlalchemy import Column, String, Numeric, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
try:
    from geoalchemy2 import Geometry
    point_column_type = Geometry(geometry_type="POINT", srid=4326)
except ImportError:
    from sqlalchemy import Text as TextType
    point_column_type = TextType
from app.core.database import Base


class DeploymentOptimization(Base):
    __tablename__ = "deployment_optimizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)
    recommended_technology = Column(String(50), nullable=False)
    recommended_capacity = Column(Numeric(12, 2), nullable=False)
    recommended_location = Column(point_column_type, nullable=True)
    grid_distance = Column(Numeric(10, 2), nullable=True)
    expansion_possible = Column(Boolean, default=True)
    optimization_score = Column(Numeric(5, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    site = relationship("Site", back_populates="deployment_optimizations")
