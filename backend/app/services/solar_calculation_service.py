import math
import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models.solar_assessment import SolarAssessment
from app.models.environmental_data import EnvironmentalData

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
    Deterministic engineering PV calculation model:

    Formula Chain:
      1. Peak Sun Hours (hrs/day) = GHI (kWh/m²/yr) / 365.0
      2. Net PR = Performance Ratio × (1 - System Loss %) × (1 - Shading Loss %)
      3. Required Module Area (m²) = Capacity (kW) / (1.0 kW/m² × (Panel Efficiency % / 100))
      4. Expected Annual Energy (MWh/yr) = Installed Capacity (MW) × Peak Sun Hours × 365 × Net PR
      5. Physical Upper Bound: Expected Annual Energy ≤ Installed Capacity (MW) × 8760 hours
      6. Capacity Factor (%) = (Expected Annual Energy (MWh) / (Installed Capacity (MW) × 8760)) × 100

    Validates parameters and returns a complete breakdown of calculated outputs and input assumptions.
    """
    # Parameter Validation
    if ghi_kwh_m2_yr < 0:
        raise ValueError(f"ghi_kwh_m2_yr must be >= 0, got {ghi_kwh_m2_yr}")
    if installed_capacity_mw <= 0:
        raise ValueError(f"installed_capacity_mw must be > 0, got {installed_capacity_mw}")
    if panel_efficiency_pct <= 0 or panel_efficiency_pct > 100:
        raise ValueError(f"panel_efficiency_pct must be in (0, 100], got {panel_efficiency_pct}")
    if performance_ratio <= 0 or performance_ratio > 1:
        raise ValueError(f"performance_ratio must be in (0, 1], got {performance_ratio}")

    peak_sun_hours = round(ghi_kwh_m2_yr / 365.0, 2)

    net_pr = performance_ratio * (1.0 - (system_loss_pct / 100.0)) * (1.0 - (shading_loss_pct / 100.0))
    net_pr = round(net_pr, 4)

    capacity_kw = installed_capacity_mw * 1000.0

    # Panel efficiency determines required PV array aperture area under STC (1,000 W/m²)
    panel_eff_decimal = panel_efficiency_pct / 100.0
    required_module_area_m2 = round(capacity_kw / (1.0 * panel_eff_decimal), 2)

    # Raw expected annual energy (kWh -> MWh)
    annual_kwh = capacity_kw * peak_sun_hours * 365.0 * net_pr
    annual_mwh = round(annual_kwh / 1000.0, 2)

    # Physical Upper Bound check (cannot produce more than nameplate capacity * 8760 hours)
    max_possible_mwh = round(installed_capacity_mw * 8760.0, 2)
    if annual_mwh > max_possible_mwh:
        logger.warning(
            f"Calculated PV energy {annual_mwh} MWh exceeded physical nameplate bound {max_possible_mwh} MWh — clamping."
        )
        annual_mwh = max_possible_mwh

    # Capacity Factor (%)
    capacity_factor = round((annual_mwh / max_possible_mwh) * 100.0, 2) if max_possible_mwh > 0 else 0.0
    capacity_factor = min(100.0, max(0.0, capacity_factor))

    return {
        "annual_irradiance": round(ghi_kwh_m2_yr, 2),
        "peak_sun_hours": peak_sun_hours,
        "expected_energy_output": annual_mwh,
        "capacity_factor": capacity_factor,
        "performance_ratio": net_pr,
        "shading_factor": round(shading_loss_pct / 100.0, 4),
        "required_module_area_m2": required_module_area_m2,
        "assumptions": {
            "installed_capacity_mw": installed_capacity_mw,
            "panel_efficiency_pct": panel_efficiency_pct,
            "required_module_area_m2": required_module_area_m2,
            "baseline_performance_ratio": performance_ratio,
            "system_loss_pct": system_loss_pct,
            "shading_loss_pct": shading_loss_pct,
            "max_theoretical_energy_mwh": max_possible_mwh,
            "calculation_formula": "Annual Energy (MWh) = Capacity (MW) * (GHI/365) * 365 * Net PR",
        },
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
    Executes solar performance calculation using real stored environmental telemetry
    and persists record into solar_assessments table.
    Raises ValueError if environmental data or GHI measurement is missing.
    """
    import uuid
    sid = uuid.UUID(str(site_id)) if isinstance(site_id, str) else site_id

    latest_env = (
        db.query(EnvironmentalData)
        .filter(EnvironmentalData.site_id == sid)
        .order_by(EnvironmentalData.created_at.desc())
        .first()
    )

    if not latest_env or latest_env.solar_irradiance is None:
        raise ValueError(
            f"Cannot calculate solar assessment for site {site_id}: "
            "Environmental data record or solar irradiance (GHI) measurement is missing."
        )

    ghi = float(latest_env.solar_irradiance)

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
# Backward-compatibility alias for tests
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
    expected by test suites.
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
