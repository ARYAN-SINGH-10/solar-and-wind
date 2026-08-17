import math
import logging
from datetime import date
from typing import List, Dict

from sqlalchemy.orm import Session
from app.models.energy_forecast import EnergyForecast
from app.models.site import Site

logger = logging.getLogger(__name__)

# Standard monthly irradiance / wind seasonality weight multipliers (Normalized sum = 1.00)
MONTHLY_SOLAR_WEIGHTS = [0.060, 0.070, 0.085, 0.090, 0.100, 0.110, 0.115, 0.105, 0.090, 0.075, 0.060, 0.040]
MONTHLY_WIND_WEIGHTS = [0.095, 0.090, 0.085, 0.080, 0.075, 0.070, 0.065, 0.070, 0.080, 0.090, 0.095, 0.105]
MONTHLY_HYBRID_WEIGHTS = [0.075, 0.080, 0.085, 0.085, 0.090, 0.090, 0.090, 0.085, 0.085, 0.080, 0.078, 0.077]



def calculate_deterministic_energy_forecast(
    installed_capacity_mw: float = 15.0,
    technology: str = "HYBRID",
    electricity_tariff_usd_mwh: float = 65.0,
    capacity_factor_pct: float = 28.5,
    performance_ratio: float = 0.82,
    degradation_rate_pct_yr: float = 0.5,
) -> dict:
    """
    Computes deterministic 12-month and 25-year energy generation and revenue forecast.
    
    1. Annual Base Energy (MWh) = Installed Capacity (MW) * 8760 * (Capacity Factor % / 100) * Performance Ratio
    2. Monthly Energy (MWh) = Annual Base Energy * Monthly Seasonality Weight
    3. Monthly Revenue ($) = Monthly Energy (MWh) * Electricity Tariff ($/MWh)
    4. 25-Year Annual Production = Base Energy * (1 - Degradation Rate %)^year
    """
    tech_upper = technology.upper()
    if tech_upper == "SOLAR":
        weights = MONTHLY_SOLAR_WEIGHTS
        base_cf = 21.5 if capacity_factor_pct == 28.5 else capacity_factor_pct
    elif tech_upper == "WIND":
        weights = MONTHLY_WIND_WEIGHTS
        base_cf = 38.0 if capacity_factor_pct == 28.5 else capacity_factor_pct
    else:
        weights = MONTHLY_HYBRID_WEIGHTS
        base_cf = capacity_factor_pct

    annual_base_mwh = installed_capacity_mw * 8760.0 * (base_cf / 100.0) * performance_ratio
    annual_base_mwh = round(annual_base_mwh, 2)

    months_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly_breakdown = []
    total_revenue_usd = 0.0

    for i, w in enumerate(weights):
        m_gen_mwh = round(annual_base_mwh * w, 2)
        m_rev_usd = round(m_gen_mwh * electricity_tariff_usd_mwh, 2)
        total_revenue_usd += m_rev_usd
        monthly_breakdown.append({
            "month_index": i + 1,
            "month_name": months_names[i],
            "generation_mwh": m_gen_mwh,
            "tariff_usd_mwh": electricity_tariff_usd_mwh,
            "revenue_usd": m_rev_usd,
        })

    # 25-Year Long term generation profile
    annual_projections = []
    cum_energy_mwh = 0.0
    cum_revenue_usd = 0.0

    for yr in range(1, 26):
        deg_factor = math.pow(1.0 - (degradation_rate_pct_yr / 100.0), yr - 1)
        yr_gen_mwh = round(annual_base_mwh * deg_factor, 2)
        yr_rev_usd = round(yr_gen_mwh * electricity_tariff_usd_mwh, 2)
        cum_energy_mwh += yr_gen_mwh
        cum_revenue_usd += yr_rev_usd

        if yr in [1, 5, 10, 15, 20, 25]:
            annual_projections.append({
                "year": yr,
                "generation_mwh": yr_gen_mwh,
                "revenue_usd": yr_rev_usd,
                "cumulative_energy_mwh": round(cum_energy_mwh, 2),
                "cumulative_revenue_usd": round(cum_revenue_usd, 2),
            })

    total_rev = round(total_revenue_usd, 2)
    return {
        "installed_capacity_mw": installed_capacity_mw,
        "technology": tech_upper,
        "annual_generation_mwh": annual_base_mwh,
        "total_annual_generation_mwh": annual_base_mwh,
        "annual_revenue_usd": total_rev,
        "total_annual_revenue_usd": total_rev,
        "capacity_factor_pct": base_cf,
        "performance_ratio": performance_ratio,
        "electricity_tariff_usd_mwh": electricity_tariff_usd_mwh,
        "monthly_breakdown": monthly_breakdown,
        "monthly_projections": monthly_breakdown,
        "annual_projections": annual_projections,
        "25_year_total_energy_mwh": round(cum_energy_mwh, 2),
        "25_year_total_revenue_usd": round(cum_revenue_usd, 2),

        "assumptions": {
            "degradation_rate_pct_yr": degradation_rate_pct_yr,
            "operating_hours_per_year": 8760,
            "calculation_formula": "Monthly Energy = Annual_Base * Seasonality_Weight; Revenue = Energy * Tariff",
            "disclaimer": "Calculated mathematical estimates. Zero-AI deterministic physics model.",
        }
    }


def run_and_store_energy_forecast(
    db: Session,
    site_id: str,
    installed_capacity_mw: float = 15.0,
    technology: str = "HYBRID",
    electricity_tariff_usd_mwh: float = 65.0,
    capacity_factor_pct: float = 28.5,
    performance_ratio: float = 0.82,
) -> List[EnergyForecast]:
    """
    Runs deterministic forecast and persists 12 monthly forecast records into energy_forecasts table.
    """
    res = calculate_deterministic_energy_forecast(
        installed_capacity_mw=installed_capacity_mw,
        technology=technology,
        electricity_tariff_usd_mwh=electricity_tariff_usd_mwh,
        capacity_factor_pct=capacity_factor_pct,
        performance_ratio=performance_ratio,
    )

    import uuid
    sid = uuid.UUID(str(site_id)) if isinstance(site_id, str) else site_id

    record = EnergyForecast(
        site_id=sid,
        technology=res["technology"],
        capacity_kw=installed_capacity_mw * 1000.0,
        monthly_generation=res["monthly_breakdown"],
        annual_generation=res["annual_generation_mwh"],
        expected_revenue=res["annual_revenue_usd"],
        forecast_period="25_YEARS",
        assumptions=res["assumptions"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return [record]
