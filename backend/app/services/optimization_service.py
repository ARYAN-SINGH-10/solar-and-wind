import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models.deployment_optimization import DeploymentOptimization
from app.models.site import Site
from app.models.infrastructure_data import InfrastructureData

logger = logging.getLogger(__name__)


def calculate_spatial_deployment_optimization(
    site_id: str,
    land_area_sq_km: float = 12.5,
    dist_substation_km: float = 4.2,
    max_grid_capacity_mw: float = 100.0,
) -> dict:
    """
    Deterministic spatial capacity and expansion planning:
    
    1. Solar MW density = 3.5 MW / sq km
    2. Wind MW density = 2.0 MW / sq km
    3. Hybrid MW density = 2.8 MW / sq km
    4. Optimal Capacity = min(Land Area * 2.8, Grid Capacity Limit)
    5. Expansion Potential = max(0, Grid Capacity Limit - Optimal Capacity)
    """
    solar_cap_mw = round(land_area_sq_km * 3.5, 2)
    wind_cap_mw = round(land_area_sq_km * 2.0, 2)
    hybrid_cap_mw = round(land_area_sq_km * 2.8, 2)

    optimal_cap_mw = min(hybrid_cap_mw, max_grid_capacity_mw)
    expansion_potential_mw = round(max(0.0, max_grid_capacity_mw - optimal_cap_mw), 2)
    expansion_possible = expansion_potential_mw >= 5.0  # Boolean

    opt_score = 94.50 if dist_substation_km <= 5.0 else 78.00

    return {
        "recommended_technology": "HYBRID",
        "recommended_capacity": optimal_cap_mw,
        "grid_distance": dist_substation_km,
        "expansion_possible": expansion_possible,
        "optimization_score": opt_score,
        "details": {
            "solar_max_capacity_mw": solar_cap_mw,
            "wind_max_capacity_mw": wind_cap_mw,
            "hybrid_optimal_capacity_mw": optimal_cap_mw,
            "expansion_potential_mw": expansion_potential_mw,
            "substation_distance_km": dist_substation_km,
            "grid_interconnect_voltage_kv": 230,
            "ground_coverage_ratio": 0.42,
        }
    }


def run_and_store_deployment_optimization(
    db: Session, site_id: str
) -> DeploymentOptimization:
    """
    Runs deterministic deployment optimization and persists record to deployment_optimizations table.
    """
    import uuid
    sid = uuid.UUID(str(site_id)) if isinstance(site_id, str) else site_id

    site = db.query(Site).filter(Site.id == sid).first()
    land_area = float(site.land_area) if (site and site.land_area) else 12.5

    infra = db.query(InfrastructureData).filter(InfrastructureData.site_id == sid).order_by(InfrastructureData.created_at.desc()).first()
    grid_dist = float(infra.distance_from_site) if (infra and infra.distance_from_site) else 4.2

    res = calculate_spatial_deployment_optimization(
        site_id=str(sid),
        land_area_sq_km=land_area,
        dist_substation_km=grid_dist,
    )

    opt_rec = DeploymentOptimization(
        site_id=sid,
        recommended_technology=res["recommended_technology"],
        recommended_capacity=res["recommended_capacity"],
        grid_distance=res["grid_distance"],
        expansion_possible=res["expansion_possible"],  # Boolean
        optimization_score=res["optimization_score"],
    )

    db.add(opt_rec)
    db.commit()
    db.refresh(opt_rec)
    return opt_rec
