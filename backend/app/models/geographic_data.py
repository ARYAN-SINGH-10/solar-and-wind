import uuid
from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
try:
    from geoalchemy2 import Geometry
    polygon_column_type = Geometry(geometry_type="POLYGON", srid=4326)
except ImportError:
    from sqlalchemy import Text
    polygon_column_type = Text
from app.core.database import Base


class GeographicData(Base):
    __tablename__ = "geographic_data"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)
    terrain = Column(String(100), nullable=True)
    slope = Column(Numeric(5, 2), nullable=True)
    vegetation = Column(String(100), nullable=True)
    land_type = Column(String(100), nullable=True)
    land_use = Column(String(100), nullable=True)
    geometry = Column(polygon_column_type, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    site = relationship("Site", back_populates="geographic_data")
