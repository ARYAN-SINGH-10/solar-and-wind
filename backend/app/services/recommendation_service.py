import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models.recommendation import Recommendation
from app.models.site import Site
from app.models.environmental_data import EnvironmentalData
from app.models.site_suitability import SiteSuitability

logger = logging.getLogger(__name__)


def generate_deterministic_recommendation(
    db: Session, site_id: str
) -> dict:
    """
    Evaluates technology feasibility (Solar vs Wind vs Hybrid) using deterministic rule-based logic:
    
    1. Solar Score = (GHI / 2200) * 100 (capped at 100)
    2. Wind Score = (WindSpeed / 9.0) * 100 (capped at 100)
    3. Decision Rule:
       - If Solar - Wind >= 10.0 -> Recommend SOLAR
       - If Wind - Solar >= 10.0 -> Recommend WIND
       - If Solar >= 75.0 AND Wind >= 75.0 -> Recommend HYBRID
       - Else -> Recommend highest overall score
    """
    import uuid
    sid = uuid.UUID(str(site_id)) if isinstance(site_id, str) else site_id
    env = db.query(EnvironmentalData).filter(EnvironmentalData.site_id == sid).order_by(EnvironmentalData.created_at.desc()).first()
    ghi = float(env.solar_irradiance) if (env and env.solar_irradiance) else 2150.0
    wind_speed = float(env.wind_speed) if (env and env.wind_speed) else 7.45

    solar_score = round(min(100.0, max(0.0, (ghi / 2200.0) * 100.0)), 2)
    wind_score = round(min(100.0, max(0.0, (wind_speed / 9.0) * 100.0)), 2)

    # Determine technology selection based on rules
    diff = solar_score - wind_score

    if diff >= 10.0:
        recommended_tech = "SOLAR"
        rationale = f"Solar resource score ({solar_score}) is significantly higher than wind score ({wind_score}). Dedicated Solar PV is recommended."
        suitability_score = solar_score
        capex_per_mw = 1.2  # $1.2M/MW
    elif -diff >= 10.0:
        recommended_tech = "WIND"
        rationale = f"Wind resource score ({wind_score}) is significantly higher than solar score ({solar_score}). Dedicated Wind Turbines recommended."
        suitability_score = wind_score
        capex_per_mw = 1.6  # $1.6M/MW
    elif solar_score >= 75.0 and wind_score >= 75.0:
        recommended_tech = "HYBRID"
        rationale = f"Both solar ({solar_score}) and wind ({wind_score}) resources are strong with complementary diurnal generation profiles (Solar daytime, Wind night). Co-located Hybrid PV + Wind recommended."
        suitability_score = round(max(solar_score, wind_score) + 3.0, 2)
        capex_per_mw = 1.4  # $1.4M/MW
    else:
        if solar_score >= wind_score:
            recommended_tech = "SOLAR"
            rationale = f"Solar PV yields highest overall feasibility score ({solar_score}) compared to wind ({wind_score})."
            suitability_score = solar_score
            capex_per_mw = 1.2
        else:
            recommended_tech = "WIND"
            rationale = f"Wind energy yields highest overall feasibility score ({wind_score}) compared to solar ({solar_score})."
            suitability_score = wind_score
            capex_per_mw = 1.6

    # Capacity & Financial Calculations
    capacity_mw = 35.0
    expected_energy_mwh = round(capacity_mw * 8760.0 * 0.285 * 0.82, 2)  # ~71,500 MWh/yr
    tariff_usd = 65.0  # $65/MWh
    estimated_revenue_usd = round(expected_energy_mwh * tariff_usd, 2)  # ~$4,650,000/yr

    estimated_investment_usd = round(capacity_mw * capex_per_mw * 1000000.0, 2)  # ~$49,000,000
    payback_years = round(estimated_investment_usd / estimated_revenue_usd, 2) if estimated_revenue_usd > 0 else 0.0

    recommendation_status = "RECOMMENDED" if suitability_score >= 75.0 else "CONDITIONALLY RECOMMENDED"

    return {
        "recommended_technology": recommended_tech,
        "recommendation_status": recommendation_status,
        "suitability_score": suitability_score,
        "expected_energy_output": expected_energy_mwh,
        "estimated_investment": estimated_investment_usd,
        "estimated_revenue": estimated_revenue_usd,
        "payback_years": payback_years,
        "explanation": rationale,
        "constraints": {
            "max_terrain_slope_deg": 15.0,
            "min_wildlife_setback_m": 500.0,
            "max_substation_distance_km": 20.0,
        },
        "details": {
            "solar_resource_score": solar_score,
            "wind_resource_score": wind_score,
            "selection_rule_applied": "Rule 1: Delta >= 10.0 -> Solar/Wind; Rule 2: Both >= 75.0 -> Hybrid",
            "capex_per_mw_usd": capex_per_mw * 1000000.0,
        }
    }


def run_and_store_recommendation(
    db: Session, site_id: str
) -> Recommendation:
    """
    Runs deterministic recommendation evaluation and persists record to recommendations table.
    Uses field names from the Recommendation SQLAlchemy model:
    technology, investment_estimate, expected_revenue, recommendation_status, explanation.
    """
    import uuid
    sid = uuid.UUID(str(site_id)) if isinstance(site_id, str) else site_id
    res = generate_deterministic_recommendation(db=db, site_id=sid)

    rec = Recommendation(
        site_id=sid,
        technology=res["recommended_technology"],
        expected_energy_output=res["expected_energy_output"],
        investment_estimate=res["estimated_investment"],
        expected_revenue=res["estimated_revenue"],
        investment_payback=res["payback_years"],
        recommendation_status=res["recommendation_status"],
        explanation=res["explanation"],
    )

    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec
