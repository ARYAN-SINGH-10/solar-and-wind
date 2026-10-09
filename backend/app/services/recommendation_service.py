import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models.recommendation import Recommendation
from app.models.site import Site
from app.models.environmental_data import EnvironmentalData
from app.models.solar_assessment import SolarAssessment
from app.models.wind_assessment import WindAssessment
from app.models.site_suitability import SiteSuitability
from app.services.solar_calculation_service import calculate_solar_pv_performance
from app.services.wind_calculation_service import calculate_wind_power_performance

logger = logging.getLogger(__name__)


def generate_deterministic_recommendation(
    db: Session, site_id: str
) -> dict:
    """
    Evaluates technology feasibility (Solar vs Wind vs Hybrid) using stored site telemetry
    and actual Solar / Wind assessment energy yields.

    Decision Rules:
       1. Solar Score = (GHI / 2200) * 100 (capped at 100)
       2. Wind Score = (WindSpeed / 9.0) * 100 (capped at 100)
       3. Rules:
          - If Solar - Wind >= 10.0 -> Recommend SOLAR
          - If Wind - Solar >= 10.0 -> Recommend WIND
          - If Solar >= 75.0 AND Wind >= 75.0 -> Recommend HYBRID
          - Else -> Recommend highest overall resource score
    """
    import uuid
    sid = uuid.UUID(str(site_id)) if isinstance(site_id, str) else site_id

    # 1. Fetch site environmental telemetry
    env = (
        db.query(EnvironmentalData)
        .filter(EnvironmentalData.site_id == sid)
        .order_by(EnvironmentalData.created_at.desc())
        .first()
    )

    if not env or (env.solar_irradiance is None and env.wind_speed is None):
        raise ValueError(
            f"Cannot generate recommendation for site {site_id}: "
            "Environmental data telemetry (solar/wind measurements) is missing."
        )

    ghi = float(env.solar_irradiance) if env.solar_irradiance is not None else 0.0
    wind_speed = float(env.wind_speed) if env.wind_speed is not None else 0.0

    solar_score = round(min(100.0, max(0.0, (ghi / 2200.0) * 100.0)), 2)
    wind_score = round(min(100.0, max(0.0, (wind_speed / 9.0) * 100.0)), 2)

    # 2. Fetch or compute actual Solar and Wind assessments
    solar_ass = (
        db.query(SolarAssessment)
        .filter(SolarAssessment.site_id == sid)
        .order_by(SolarAssessment.created_at.desc())
        .first()
    )
    if solar_ass and solar_ass.expected_energy_output is not None:
        solar_annual_mwh = float(solar_ass.expected_energy_output)
    elif ghi > 0:
        solar_res = calculate_solar_pv_performance(ghi_kwh_m2_yr=ghi, installed_capacity_mw=10.0)
        solar_annual_mwh = float(solar_res["expected_energy_output"])
    else:
        solar_annual_mwh = 0.0

    wind_ass = (
        db.query(WindAssessment)
        .filter(WindAssessment.site_id == sid)
        .order_by(WindAssessment.created_at.desc())
        .first()
    )
    if wind_ass and wind_ass.expected_annual_energy_production is not None:
        wind_annual_mwh = float(wind_ass.expected_annual_energy_production)
    elif wind_speed > 0:
        wind_res = calculate_wind_power_performance(wind_speed_m_s=wind_speed, num_turbines=5, turbine_rating_mw=3.0)
        wind_annual_mwh = float(wind_res["expected_annual_energy_production"])
    else:
        wind_annual_mwh = 0.0

    # 3. Determine technology selection based on resource scores
    diff = solar_score - wind_score

    if diff >= 10.0:
        recommended_tech = "SOLAR"
        rationale = (
            f"Solar resource score ({solar_score}) is significantly higher than wind score ({wind_score}). "
            f"Dedicated Solar PV is recommended based on annual GHI of {ghi:.2f} kWh/m²/yr."
        )
        suitability_score = solar_score
        capacity_mw = 10.0
        expected_energy_mwh = solar_annual_mwh
        capex_per_mw = 1.2  # $1.2M/MW
    elif -diff >= 10.0:
        recommended_tech = "WIND"
        rationale = (
            f"Wind resource score ({wind_score}) is significantly higher than solar score ({solar_score}). "
            f"Dedicated Wind Turbines recommended based on 100m mean wind speed of {wind_speed:.2f} m/s."
        )
        suitability_score = wind_score
        capacity_mw = 15.0
        expected_energy_mwh = wind_annual_mwh
        capex_per_mw = 1.6  # $1.6M/MW
    elif solar_score >= 75.0 and wind_score >= 75.0:
        recommended_tech = "HYBRID"
        rationale = (
            f"Both solar ({solar_score}) and wind ({wind_score}) resources are strong with complementary "
            f"diurnal generation profiles. Co-located Hybrid PV + Wind recommended."
        )
        suitability_score = round(max(solar_score, wind_score) + 3.0, 2)
        capacity_mw = 25.0  # 10 MW Solar + 15 MW Wind
        expected_energy_mwh = round(solar_annual_mwh + wind_annual_mwh, 2)
        capex_per_mw = 1.4  # $1.4M/MW
    else:
        if solar_score >= wind_score:
            recommended_tech = "SOLAR"
            rationale = (
                f"Solar PV yields highest overall feasibility score ({solar_score}) "
                f"compared to wind ({wind_score})."
            )
            suitability_score = solar_score
            capacity_mw = 10.0
            expected_energy_mwh = solar_annual_mwh
            capex_per_mw = 1.2
        else:
            recommended_tech = "WIND"
            rationale = (
                f"Wind energy yields highest overall feasibility score ({wind_score}) "
                f"compared to solar ({solar_score})."
            )
            suitability_score = wind_score
            capacity_mw = 15.0
            expected_energy_mwh = wind_annual_mwh
            capex_per_mw = 1.6

    # 4. Financial Calculations using actual energy output and tariff
    tariff_usd = 65.0  # $65/MWh standard PPA tariff
    estimated_revenue_usd = round(expected_energy_mwh * tariff_usd, 2)
    estimated_investment_usd = round(capacity_mw * capex_per_mw * 1_000_000.0, 2)
    payback_years = (
        round(estimated_investment_usd / estimated_revenue_usd, 2)
        if estimated_revenue_usd > 0
        else 0.0
    )

    recommendation_status = (
        "RECOMMENDED" if suitability_score >= 75.0 else "CONDITIONALLY RECOMMENDED"
    )

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
            "installed_capacity_mw": capacity_mw,
            "solar_resource_score": solar_score,
            "wind_resource_score": wind_score,
            "solar_annual_mwh_yield": solar_annual_mwh,
            "wind_annual_mwh_yield": wind_annual_mwh,
            "tariff_usd_mwh": tariff_usd,
            "capex_per_mw_usd": capex_per_mw * 1_000_000.0,
            "selection_rule_applied": "Rule 1: Delta >= 10.0 -> Solar/Wind; Rule 2: Both >= 75.0 -> Hybrid",
        },
    }


def run_and_store_recommendation(
    db: Session, site_id: str
) -> Recommendation:
    """
    Runs deterministic recommendation evaluation based on actual stored assessments
    and persists record to recommendations table.
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
