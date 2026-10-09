import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models.site_suitability import SiteSuitability
from app.models.site_score import SiteScore
from app.models.environmental_data import EnvironmentalData
from app.models.geographic_data import GeographicData
from app.models.infrastructure_data import InfrastructureData

logger = logging.getLogger(__name__)


def calculate_factor_scores(
    db: Session, site_id: str
) -> dict:
    """
    Computes 5 normalized factor scores (0 - 100) based on real collected site data:

    1. Resource Score (35% Weight): Derived from actual Solar GHI and 100m Wind Speed.
    2. Geographic Score (25% Weight): Derived from actual terrain slope angle.
    3. Infrastructure Score (15% Weight): Derived from actual distance to nearest substation.
    4. Environmental Score (15% Weight): Derived from atmospheric cloud cover, rainfall, and land impact.
    5. Economic Score (10% Weight): Derived from resource yield viability and infrastructure accessibility.

    Raises ValueError if required environmental resource telemetry is missing.
    """
    import uuid
    sid = uuid.UUID(str(site_id)) if isinstance(site_id, str) else site_id

    # 1. Resource Score (35% Weight)
    env = (
        db.query(EnvironmentalData)
        .filter(EnvironmentalData.site_id == sid)
        .order_by(EnvironmentalData.created_at.desc())
        .first()
    )

    if not env or (env.solar_irradiance is None and env.wind_speed is None):
        raise ValueError(
            f"Cannot calculate site suitability for site {site_id}: "
            "Environmental data telemetry (solar/wind measurements) is missing."
        )

    ghi = float(env.solar_irradiance) if env.solar_irradiance is not None else 0.0
    wind = float(env.wind_speed) if env.wind_speed is not None else 0.0

    # Solar resource score (2200 kWh/m² is optimal -> 100.0)
    solar_score = min(100.0, max(0.0, (ghi / 2200.0) * 100.0))
    # Wind resource score (9.0 m/s is optimal -> 100.0)
    wind_score = min(100.0, max(0.0, (wind / 9.0) * 100.0))
    resource_score = round(min(100.0, max(0.0, (solar_score * 0.6) + (wind_score * 0.4))), 2)

    # 2. Geographic Score (25% Weight)
    geo = (
        db.query(GeographicData)
        .filter(GeographicData.site_id == sid)
        .order_by(GeographicData.created_at.desc())
        .first()
    )
    slope = None
    if geo and geo.slope is not None:
        slope = float(geo.slope)
    elif env and env.land_slope is not None:
        slope = float(env.land_slope)

    if slope is not None:
        if slope <= 3.0:
            geographic_score = 92.5  # Ideal flat terrain
        elif slope <= 8.0:
            geographic_score = 80.0  # Moderate slope
        elif slope <= 15.0:
            geographic_score = 55.0  # Steep slope
        else:
            geographic_score = 20.0  # Excessive slope penalty
    else:
        # Default unrated terrain baseline if DEM slope processing has not been run
        geographic_score = 65.0

    # 3. Infrastructure Score (15% Weight)
    infra = (
        db.query(InfrastructureData)
        .filter(InfrastructureData.site_id == sid)
        .order_by(InfrastructureData.created_at.desc())
        .first()
    )
    dist_substation = float(infra.distance_from_site) if (infra and infra.distance_from_site is not None) else None

    if dist_substation is not None:
        if dist_substation <= 2.0:
            infrastructure_score = 95.0
        elif dist_substation <= 5.0:
            infrastructure_score = 85.0
        elif dist_substation <= 15.0:
            infrastructure_score = 65.0
        else:
            infrastructure_score = 40.0
    else:
        infrastructure_score = 65.0

    # 4. Environmental Score (15% Weight)
    # Evaluated from cloud cover, rainfall intensity, and terrain vegetation
    base_env_score = 95.0
    if env:
        if env.cloud_cover is not None:
            cloud_penalty = (float(env.cloud_cover) / 100.0) * 15.0
            base_env_score -= cloud_penalty
        if env.rainfall is not None and float(env.rainfall) > 1500.0:
            base_env_score -= 10.0
    environmental_score = round(min(100.0, max(0.0, base_env_score)), 2)

    # 5. Economic Score (10% Weight)
    # Derived from composite resource viability and infrastructure accessibility
    economic_score = round(
        min(100.0, max(0.0, (resource_score * 0.70) + (infrastructure_score * 0.30))), 2
    )

    return {
        "resource_score": resource_score,
        "geographic_score": geographic_score,
        "infrastructure_score": infrastructure_score,
        "environmental_score": environmental_score,
        "economic_score": economic_score,
        "data_provenance": {
            "solar_ghi_used": ghi,
            "wind_speed_used": wind,
            "slope_deg_used": slope,
            "substation_dist_km_used": dist_substation,
        },
    }


def compute_composite_site_score(
    resource_score: float,
    geographic_score: float,
    infrastructure_score: float,
    environmental_score: float,
    economic_score: float,
    w_res: float = 0.35,
    w_geo: float = 0.25,
    w_infra: float = 0.15,
    w_env: float = 0.15,
    w_econ: float = 0.10,
) -> dict:
    """
    Computes exact weighted score:
    Score = (resource * 0.35) + (geographic * 0.25) + (infrastructure * 0.15) + (environmental * 0.15) + (economic * 0.10)
    """
    final_score = (
        (resource_score * w_res)
        + (geographic_score * w_geo)
        + (infrastructure_score * w_infra)
        + (environmental_score * w_env)
        + (economic_score * w_econ)
    )
    final_score = round(min(100.0, max(0.0, final_score)), 2)

    if final_score >= 90.0:
        category = "Excellent"
    elif final_score >= 80.0:
        category = "Highly Suitable"
    elif final_score >= 65.0:
        category = "Moderately Suitable"
    elif final_score >= 50.0:
        category = "Low Suitability"
    else:
        category = "Unsuitable"

    return {
        "final_score": final_score,
        "category": category,
        "weights": {
            "renewable_resource": w_res,
            "geographic_suitability": w_geo,
            "infrastructure_accessibility": w_infra,
            "environmental_impact": w_env,
            "economic_feasibility": w_econ,
        },
    }


def run_and_store_suitability_and_scoring(
    db: Session, site_id: str
) -> dict:
    """
    Calculates factor scores and composite weight score from real site telemetry,
    persisting records into site_suitability and site_scores tables.
    """
    factors = calculate_factor_scores(db, site_id)
    comp = compute_composite_site_score(
        resource_score=factors["resource_score"],
        geographic_score=factors["geographic_score"],
        infrastructure_score=factors["infrastructure_score"],
        environmental_score=factors["environmental_score"],
        economic_score=factors["economic_score"],
    )

    import uuid
    sid = uuid.UUID(str(site_id)) if isinstance(site_id, str) else site_id

    suitability_rec = SiteSuitability(
        site_id=sid,
        renewable_resource_score=factors["resource_score"],
        geographic_score=factors["geographic_score"],
        infrastructure_score=factors["infrastructure_score"],
        environmental_score=factors["environmental_score"],
        economic_score=factors["economic_score"],
        overall_score=comp["final_score"],
        category=comp["category"],
    )
    db.add(suitability_rec)

    score_rec = SiteScore(
        site_id=sid,
        renewable_resource_score=factors["resource_score"],
        geographic_score=factors["geographic_score"],
        infrastructure_score=factors["infrastructure_score"],
        environmental_score=factors["environmental_score"],
        economic_score=factors["economic_score"],
        overall_score=comp["final_score"],
        category=comp["category"],
    )
    db.add(score_rec)

    db.commit()
    db.refresh(suitability_rec)
    db.refresh(score_rec)

    return {
        "suitability": suitability_rec,
        "score": score_rec,
    }
