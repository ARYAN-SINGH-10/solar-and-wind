"""
Wind Power Performance Calculation Service
==========================================

Deterministic fluid dynamics model based on IEC 61400 simplified approach.

Formula chain:
  1. Wind Power Density (W/m²):
       WPD = 0.5 × air_density (kg/m³) × wind_speed³ (m/s)

  2. Rotor swept area (m²):
       A = π × (D/2)²

  3. Instantaneous power per turbine at observed mean wind speed (W):
       P_turbine = WPD × A × Cp   where Cp = turbine_efficiency (0..1)

  4. Total installed power at observed wind speed (W):
       P_total = P_turbine × N_turbines

  5. Nameplate cap (W):
       P_nameplate = turbine_rating_MW × N_turbines × 1,000,000

  6. Effective power used for AEP (W) — physically cannot exceed nameplate:
       P_effective = min(P_total, P_nameplate)

  7. Capacity Factor (%) — ratio of effective power to nameplate, 0–100:
       CF = (P_effective / P_nameplate) × 100

  8. Annual Energy Production (MWh):
       AEP = P_effective × operating_hours / 1,000,000
           = min(P_total, P_nameplate) × 8760 / 1e6

Physical bound check:
  AEP  ≤  N_turbines × turbine_rating_MW × 8760  (MWh)
  CF   ≤  100 %

Note on model limitations:
  This service implements a simplified deterministic engineering estimate (IEC 61400
  aerodynamic model with nameplate power capping). It does not replace full bankable
  multi-speed Weibull wind resource power curve integration.
"""
import math
import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models.wind_assessment import WindAssessment
from app.models.environmental_data import EnvironmentalData

logger = logging.getLogger(__name__)


def calculate_wind_power_performance(
    wind_speed_m_s: float,
    air_density_kg_m3: float = 1.225,
    turbine_efficiency_pct: float = 45.0,
    rotor_diameter_m: float = 126.0,
    num_turbines: int = 5,
    operating_hours_yr: float = 8760.0,
    turbine_rating_mw: float = 3.0,
) -> dict:
    """
    Deterministic wind power performance calculation.

    Returns a dict with:
      average_wind_speed          (m/s)
      wind_power_density          (W/m²)
      capacity_factor             (%, 0–100)
      expected_annual_energy_production  (MWh)
      turbine_suitability         (IEC class string)
      assumptions                 (dict of inputs used)
    """
    # Parameter Validation
    if wind_speed_m_s < 0:
        raise ValueError(f"wind_speed_m_s must be >= 0, got {wind_speed_m_s}")
    if num_turbines < 1:
        raise ValueError(f"num_turbines must be >= 1, got {num_turbines}")
    if turbine_rating_mw <= 0:
        raise ValueError(f"turbine_rating_mw must be > 0, got {turbine_rating_mw}")
    if air_density_kg_m3 <= 0:
        raise ValueError(f"air_density_kg_m3 must be > 0, got {air_density_kg_m3}")
    if rotor_diameter_m <= 0:
        raise ValueError(f"rotor_diameter_m must be > 0, got {rotor_diameter_m}")
    if turbine_efficiency_pct <= 0 or turbine_efficiency_pct > 100:
        raise ValueError(f"turbine_efficiency_pct must be in (0, 100], got {turbine_efficiency_pct}")

    # 1. Wind Power Density (W/m²)
    wpd_w_m2 = 0.5 * air_density_kg_m3 * math.pow(wind_speed_m_s, 3)
    wpd_w_m2 = round(wpd_w_m2, 2)

    # 2. Rotor swept area (m²)
    rotor_radius_m = rotor_diameter_m / 2.0
    rotor_area_m2 = math.pi * math.pow(rotor_radius_m, 2)

    # 3. Cp (aerodynamic power coefficient, dimensionless 0–1)
    cp = turbine_efficiency_pct / 100.0

    # 4. Nameplate installed capacity (W)
    nameplate_capacity_w = num_turbines * turbine_rating_mw * 1_000_000.0
    nameplate_capacity_mw = num_turbines * turbine_rating_mw

    # 5. Aerodynamic power at observed mean wind speed (W)
    p_aerodynamic_w = wpd_w_m2 * rotor_area_m2 * cp * num_turbines

    # 6. Effective power — capped at nameplate (W)
    p_effective_w = min(p_aerodynamic_w, nameplate_capacity_w)

    # 7. Capacity Factor (%, 0–100)
    capacity_factor_pct = (p_effective_w / nameplate_capacity_w) * 100.0
    capacity_factor_pct = round(min(max(capacity_factor_pct, 0.0), 100.0), 2)

    # 8. Annual Energy Production (MWh)
    aep_mwh = (p_effective_w * operating_hours_yr) / 1_000_000.0
    aep_mwh = round(aep_mwh, 2)

    # Physical sanity bound: AEP ≤ nameplate × hours
    max_aep_mwh = nameplate_capacity_mw * operating_hours_yr
    if aep_mwh > max_aep_mwh:
        logger.error(
            "Wind AEP %s MWh exceeded nameplate maximum %s MWh — clamping.",
            aep_mwh, max_aep_mwh,
        )
        aep_mwh = round(max_aep_mwh, 2)
        capacity_factor_pct = 100.0

    # Validation guards
    if capacity_factor_pct < 0.0 or capacity_factor_pct > 100.0:
        raise ValueError(f"Capacity factor {capacity_factor_pct}% is outside valid 0–100% range.")
    if aep_mwh < 0.0:
        raise ValueError(f"Annual energy production {aep_mwh} MWh is negative.")

    # 9. IEC Turbine Suitability Classification
    if wind_speed_m_s >= 10.0:
        suitability = "IEC Class I (High Wind Site)"
    elif wind_speed_m_s >= 8.5:
        suitability = "IEC Class II (Medium Wind Site)"
    elif wind_speed_m_s >= 7.5:
        suitability = "IEC Class III (Low Wind Site)"
    else:
        suitability = "IEC Class IV (Marginal Wind Site)"

    return {
        "average_wind_speed": round(wind_speed_m_s, 2),
        "wind_power_density": wpd_w_m2,
        "capacity_factor": capacity_factor_pct,
        "expected_annual_energy_production": aep_mwh,
        "turbine_suitability": suitability,
        "assumptions": {
            "air_density_kg_m3": air_density_kg_m3,
            "turbine_efficiency_pct": turbine_efficiency_pct,
            "rotor_diameter_m": rotor_diameter_m,
            "rotor_area_m2": round(rotor_area_m2, 4),
            "num_turbines": num_turbines,
            "turbine_rating_mw": turbine_rating_mw,
            "nameplate_capacity_mw": nameplate_capacity_mw,
            "max_theoretical_aep_mwh": round(max_aep_mwh, 2),
            "operating_hours_yr": operating_hours_yr,
            "p_aerodynamic_kw": round(p_aerodynamic_w / 1000.0, 2),
            "p_effective_kw": round(p_effective_w / 1000.0, 2),
            "model_type": "Simplified IEC 61400 Aerodynamic Model (Nameplate Capped)",
            "calculation_formula": (
                "WPD = 0.5*rho*v^3 ; "
                "P_aero = WPD*A*Cp*N ; "
                "P_eff = min(P_aero, P_nameplate) ; "
                "CF = P_eff/P_nameplate*100 ; "
                "AEP = P_eff*hours/1e6"
            ),
        },
    }


def run_and_store_wind_assessment(
    db: Session,
    site_id: str,
    air_density_kg_m3: float = 1.225,
    turbine_efficiency_pct: float = 45.0,
    rotor_diameter_m: float = 126.0,
    num_turbines: int = 5,
    operating_hours_yr: float = 8760.0,
    turbine_rating_mw: float = 3.0,
) -> WindAssessment:
    """
    Executes wind performance calculation using stored environmental telemetry
    and persists record to wind_assessments table.
    Raises ValueError if environmental data or wind speed measurement is missing.
    """
    import uuid
    sid = uuid.UUID(str(site_id)) if isinstance(site_id, str) else site_id

    latest_env = (
        db.query(EnvironmentalData)
        .filter(EnvironmentalData.site_id == sid)
        .order_by(EnvironmentalData.created_at.desc())
        .first()
    )

    if not latest_env or latest_env.wind_speed is None:
        raise ValueError(
            f"Cannot calculate wind assessment for site {site_id}: "
            "Environmental data record or wind speed measurement is missing."
        )

    wind_speed = float(latest_env.wind_speed)

    res = calculate_wind_power_performance(
        wind_speed_m_s=wind_speed,
        air_density_kg_m3=air_density_kg_m3,
        turbine_efficiency_pct=turbine_efficiency_pct,
        rotor_diameter_m=rotor_diameter_m,
        num_turbines=num_turbines,
        operating_hours_yr=operating_hours_yr,
        turbine_rating_mw=turbine_rating_mw,
    )

    assessment = WindAssessment(
        site_id=sid,
        average_wind_speed=res["average_wind_speed"],
        wind_power_density=res["wind_power_density"],
        capacity_factor=res["capacity_factor"],
        expected_annual_energy_production=res["expected_annual_energy_production"],
        turbine_suitability=res["turbine_suitability"],
    )

    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


# ---------------------------------------------------------------------------
# Backward-compatibility alias
# ---------------------------------------------------------------------------
def calculate_deterministic_wind_output(
    wind_speed_m_s: float,
    air_density_kg_m3: float = 1.225,
    turbine_efficiency_pct: float = 45.0,
    rotor_diameter_m: float = 126.0,
    num_turbines: int = 5,
    operating_hours_yr: float = 8760.0,
    turbine_rating_mw: float = 3.0,
) -> dict:
    """
    Alias for calculate_wind_power_performance exposing legacy key names.
    """
    res = calculate_wind_power_performance(
        wind_speed_m_s=wind_speed_m_s,
        air_density_kg_m3=air_density_kg_m3,
        turbine_efficiency_pct=turbine_efficiency_pct,
        rotor_diameter_m=rotor_diameter_m,
        num_turbines=num_turbines,
        operating_hours_yr=operating_hours_yr,
        turbine_rating_mw=turbine_rating_mw,
    )
    res["wind_power_density_w_m2"] = res["wind_power_density"]
    res["expected_annual_energy_kwh"] = round(res["expected_annual_energy_production"] * 1000.0, 2)
    res["installed_capacity_mw"] = num_turbines * turbine_rating_mw
    return res
