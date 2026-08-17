import uuid
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class SiteComparison(Base):
    __tablename__ = "site_comparisons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    comparison_name = Column(String(255), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("User", back_populates="site_comparisons")
    comparison_items = relationship("SiteComparisonItem", back_populates="site_comparison", cascade="all, delete-orphan")


class SiteComparisonItem(Base):
    __tablename__ = "site_comparison_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_comparison_id = Column(UUID(as_uuid=True), ForeignKey("site_comparisons.id", ondelete="CASCADE"), nullable=False, index=True)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("site_comparison_id", "site_id", name="unique_site_per_comparison"),
    )

    site_comparison = relationship("SiteComparison", back_populates="comparison_items")
    site = relationship("Site", back_populates="comparison_items")
