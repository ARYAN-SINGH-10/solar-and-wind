import math
import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models.solar_assessment import SolarAssessment
from app.models.environmental_data import EnvironmentalData
from app.models.site import Site

logger = logging.getLogger(__name__)


def calculate_solar_pv_performance(
    ghi_kwh_m2_yr: float,
    installed_capacity_mw: float = 10.0,
    panel_efficiency_pct: float = 21.5,
    performance_ratio: float = 0.82,
    system_loss_pct: float = 14.0,
    shading_loss_pct: float = 3.0,
) -> dict:
    """
    Deterministic engineering PV calculation formula:
    
    1. Peak Sun Hours (hrs/day) = GHI / 365.0
    2. Net PR = Performance Ratio * (1 - System Loss %) * (1 - Shading Loss %)
    3. Expected Annual Energy (MWh/yr) = Installed Capacity (MW) * Peak Sun Hours * 365 * Net PR
    4. Capacity Factor (%) = (Expected Annual Energy (MWh) / (Installed Capacity (MW) * 8760)) * 100
    
    Returns complete breakdown of calculated outputs and input assumptions for reproducibility.
    """
    peak_sun_hours = round(ghi_kwh_m2_yr / 365.0, 2)
    
    net_pr = performance_ratio * (1.0 - (system_loss_pct / 100.0)) * (1.0 - (shading_loss_pct / 100.0))
    net_pr = round(net_pr, 4)

    # Installed capacity in kW
    capacity_kw = installed_capacity_mw * 1000.0
    
    # Expected annual energy in kWh
    annual_kwh = capacity_kw * peak_sun_hours * 365.0 * net_pr
    annual_mwh = round(annual_kwh / 1000.0, 2)

    # Capacity Factor
    max_possible_mwh = installed_capacity_mw * 8760.0
    capacity_factor = round((annual_mwh / max_possible_mwh) * 100.0, 2) if max_possible_mwh > 0 else 0.0

    return {
        "annual_irradiance": round(ghi_kwh_m2_yr, 2),
        "peak_sun_hours": peak_sun_hours,
        "expected_energy_output": annual_mwh,
        "capacity_factor": capacity_factor,
        "performance_ratio": net_pr,
        "shading_factor": round(shading_loss_pct / 100.0, 4),
        "assumptions": {
            "installed_capacity_mw": installed_capacity_mw,
            "panel_efficiency_pct": panel_efficiency_pct,
            "baseline_performance_ratio": performance_ratio,
            "system_loss_pct": system_loss_pct,
            "shading_loss_pct": shading_loss_pct,
            "calculation_formula": "Annual Energy (MWh) = Capacity (MW) * (GHI/365) * 365 * Net PR",
        }
    }


def run_and_store_solar_assessment(
    db: Session,
    site_id: str,
    installed_capacity_mw: float = 10.0,
    panel_efficiency_pct: float = 21.5,
    performance_ratio: float = 0.82,
    system_loss_pct: float = 14.0,
    shading_loss_pct: float = 3.0,
) -> SolarAssessment:
    """
    Executes solar performance calculation and persists record to solar_assessments table.
    """
    import uuid
    sid = uuid.UUID(str(site_id)) if isinstance(site_id, str) else site_id
    latest_env = db.query(EnvironmentalData).filter(EnvironmentalData.site_id == sid).order_by(EnvironmentalData.created_at.desc()).first()
    ghi = float(latest_env.solar_irradiance) if (latest_env and latest_env.solar_irradiance) else 2150.0

    res = calculate_solar_pv_performance(
        ghi_kwh_m2_yr=ghi,
        installed_capacity_mw=installed_capacity_mw,
        panel_efficiency_pct=panel_efficiency_pct,
        performance_ratio=performance_ratio,
        system_loss_pct=system_loss_pct,
        shading_loss_pct=shading_loss_pct,
    )

    assessment = SolarAssessment(
        site_id=sid,
        annual_irradiance=res["annual_irradiance"],
        peak_sun_hours=res["peak_sun_hours"],
        expected_energy_output=res["expected_energy_output"],
        capacity_factor=res["capacity_factor"],
        performance_ratio=res["performance_ratio"],
        shading_factor=res["shading_factor"],
        panel_efficiency=panel_efficiency_pct,
    )

    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


# ---------------------------------------------------------------------------
# Backward-compatibility alias for test_platform.py
# ---------------------------------------------------------------------------
def calculate_deterministic_solar_output(
    solar_ghi_kwh_m2_day: float = 5.5,
    installed_capacity_mw: float = 10.0,
    panel_efficiency_pct: float = 21.5,
    performance_ratio: float = 0.82,
    system_loss_pct: float = 14.0,
    shading_loss_pct: float = 3.0,
) -> dict:
    """
    Alias for calculate_solar_pv_performance providing legacy dictionary keys
    expected by test_platform.py.
    """
    ghi_kwh_m2_yr = solar_ghi_kwh_m2_day * 365.0
    res = calculate_solar_pv_performance(
        ghi_kwh_m2_yr=ghi_kwh_m2_yr,
        installed_capacity_mw=installed_capacity_mw,
        panel_efficiency_pct=panel_efficiency_pct,
        performance_ratio=performance_ratio,
        system_loss_pct=system_loss_pct,
        shading_loss_pct=shading_loss_pct,
    )
    return {
        "annual_solar_irradiance_kwh_m2": res["annual_irradiance"],
        "peak_sun_hours_per_day": res["peak_sun_hours"],
        "installed_capacity_kw": installed_capacity_mw * 1000.0,
        "expected_annual_energy_kwh": res["expected_energy_output"] * 1000.0,
        "capacity_factor_pct": res["capacity_factor"],
        "performance_ratio": res["performance_ratio"],
    }

