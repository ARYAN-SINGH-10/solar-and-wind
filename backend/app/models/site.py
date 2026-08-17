import uuid
from sqlalchemy import Column, String, Numeric, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
try:
    from geoalchemy2 import Geometry
    location_column_type = Geometry(geometry_type="POINT", srid=4326)
except ImportError:
    from sqlalchemy import Text
    location_column_type = Text
from app.core.database import Base


class Site(Base):
    __tablename__ = "sites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    site_name = Column(String(255), nullable=False)
    latitude = Column(Numeric(10, 7), nullable=False)
    longitude = Column(Numeric(10, 7), nullable=False)
    location = Column(location_column_type, nullable=False)

    region = Column(String(255), nullable=True)
    land_area = Column(Numeric(12, 4), nullable=True)
    elevation = Column(Numeric(8, 2), nullable=True)
    land_ownership = Column(String(255), nullable=True)
    existing_infrastructure = Column(Text, nullable=True)
    status = Column(String(50), default="PROPOSED")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    project = relationship("Project", back_populates="sites")
    environmental_data = relationship("EnvironmentalData", back_populates="site", cascade="all, delete-orphan")
    geographic_data = relationship("GeographicData", back_populates="site", cascade="all, delete-orphan")
    infrastructure_data = relationship("InfrastructureData", back_populates="site", cascade="all, delete-orphan")
    solar_assessments = relationship("SolarAssessment", back_populates="site", cascade="all, delete-orphan")
    wind_assessments = relationship("WindAssessment", back_populates="site", cascade="all, delete-orphan")
    site_suitabilities = relationship("SiteSuitability", back_populates="site", cascade="all, delete-orphan")
    site_scores = relationship("SiteScore", back_populates="site", cascade="all, delete-orphan")
    energy_forecasts = relationship("EnergyForecast", back_populates="site", cascade="all, delete-orphan")
    deployment_optimizations = relationship("DeploymentOptimization", back_populates="site", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="site", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="site", cascade="all, delete-orphan")
    comparison_items = relationship("SiteComparisonItem", back_populates="site", cascade="all, delete-orphan")
