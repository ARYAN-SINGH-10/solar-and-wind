import uuid
from sqlalchemy import Column, String, Text, Numeric, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
try:
    from geoalchemy2 import Geometry
    geometry_column_type = Geometry(geometry_type="GEOMETRY", srid=4326)
except ImportError:
    from sqlalchemy import Text as TextType
    geometry_column_type = TextType
from app.core.database import Base


class InfrastructureData(Base):
    __tablename__ = "infrastructure_data"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)
    roads = Column(Text, nullable=True)
    substations = Column(Text, nullable=True)
    transmission_lines = Column(Text, nullable=True)
    protected_areas = Column(Text, nullable=True)
    water_bodies = Column(Text, nullable=True)
    distance_from_site = Column(Numeric(10, 2), nullable=True)
    geometry = Column(geometry_column_type, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    site = relationship("Site", back_populates="infrastructure_data")
