import uuid
from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class SiteScore(Base):
    __tablename__ = "site_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # 5 Weighted Components
    renewable_resource_score = Column(Numeric(5, 2), nullable=False) # 35%
    geographic_score = Column(Numeric(5, 2), nullable=False)         # 25%
    infrastructure_score = Column(Numeric(5, 2), nullable=False)     # 15%
    environmental_score = Column(Numeric(5, 2), nullable=False)      # 15%
    economic_score = Column(Numeric(5, 2), nullable=False)           # 10%
    
    overall_score = Column(Numeric(5, 2), nullable=False)
    category = Column(String(50), nullable=False)
    
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    site = relationship("Site", back_populates="site_scores")

    @staticmethod
    def compute_weighted_score(res: float, geo: float, infra: float, env: float, econ: float) -> tuple[float, str]:
        """
        Deterministic calculation of overall site score and classification.
        Formula: (res * 0.35) + (geo * 0.25) + (infra * 0.15) + (env * 0.15) + (econ * 0.10)
        Categories:
          90-100: Excellent
          80-89:  Highly Suitable
          65-79:  Moderately Suitable
          50-64:  Low Suitability
          0-49:   Unsuitable
        """
        score = (res * 0.35) + (geo * 0.25) + (infra * 0.15) + (env * 0.15) + (econ * 0.10)
        score_rounded = round(score, 2)

        if score_rounded >= 90.0:
            cat = "Excellent"
        elif score_rounded >= 80.0:
            cat = "Highly Suitable"
        elif score_rounded >= 65.0:
            cat = "Moderately Suitable"
        elif score_rounded >= 50.0:
            cat = "Low Suitability"
        else:
            cat = "Unsuitable"

        return score_rounded, cat
