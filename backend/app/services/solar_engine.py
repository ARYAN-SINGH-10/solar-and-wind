import math


def calculate_solar_yield(
    area_sq_m: float,
    efficiency_pct: float,
    annual_ghi_kwh_m2: float,
    performance_ratio: float = 0.82,
    degradation_rate: float = 0.005,
    years: int = 1
) -> dict:
    """
    Deterministic calculation of Annual Solar PV Generation (kWh).
    Formula: E = Area * Efficiency * GHI * PerformanceRatio * (1 - degradation)^years
    STRICTLY NO AI / ML. Pure physical PV system equation.
    """
    eff_decimal = efficiency_pct / 100.0
    annual_yield_kwh = area_sq_m * eff_decimal * annual_ghi_kwh_m2 * performance_ratio * ((1.0 - degradation_rate) ** (years - 1))
    annual_yield_mwh = annual_yield_kwh / 1000.0
    capacity_factor = (annual_yield_kwh / (area_sq_m * eff_decimal * 8760)) if (area_sq_m * eff_decimal) > 0 else 0.0

    return {
        "annual_yield_kwh": round(annual_yield_kwh, 2),
        "annual_yield_mwh": round(annual_yield_mwh, 2),
        "capacity_factor_pct": round(capacity_factor * 100, 2),
        "formula_used": "E = Area * Efficiency * GHI * PR * (1 - degradation)^t",
        "parameters": {
            "area_sq_m": area_sq_m,
            "efficiency_pct": efficiency_pct,
            "annual_ghi_kwh_m2": annual_ghi_kwh_m2,
            "performance_ratio": performance_ratio,
        }
    }


def calculate_optimal_tilt(latitude: float) -> float:
    """
    Deterministic rule-based calculation for optimal solar tilt angle.
    Rule: Tilt = |Latitude| * 0.87 + 3.1 degrees
    """
    abs_lat = abs(latitude)
    optimal_tilt = (abs_lat * 0.87) + 3.1
    return round(optimal_tilt, 2)
