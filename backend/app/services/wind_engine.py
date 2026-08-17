import math


def calculate_air_density(elevation_m: float, temp_celsius: float = 15.0) -> float:
    """
    Calculates altitude-corrected air density (kg/m3) using barometric pressure equations.
    Formula: rho = (P0 / (R * T)) * exp(- (g * z) / (R * T))
    """
    P0 = 101325.0  # Pa
    R = 287.05      # J/(kg*K)
    g = 9.80665     # m/s2
    T_kelvin = temp_celsius + 273.15
    
    air_density = (P0 / (R * T_kelvin)) * math.exp(- (g * elevation_m) / (R * T_kelvin))
    return round(air_density, 4)


def calculate_wind_power_density(
    wind_speed_m_s: float,
    elevation_m: float = 0.0,
    temp_celsius: float = 15.0
) -> dict:
    """
    Deterministic calculation of Wind Power Density (W/m2).
    Formula: P/A = 0.5 * air_density * wind_speed^3
    STRICTLY NO AI / ML. Fluid dynamics equation.
    """
    rho = calculate_air_density(elevation_m, temp_celsius)
    wpd = 0.5 * rho * (wind_speed_m_s ** 3)

    # Classify IEC Wind Class based on WPD
    if wpd < 200:
        wind_class = "Class I (Low / Unsuitable)"
    elif wpd < 400:
        wind_class = "Class II (Moderate)"
    elif wpd < 600:
        wind_class = "Class III (Good)"
    elif wpd < 800:
        wind_class = "Class IV (Excellent)"
    else:
        wind_class = "Class V (Outstanding)"

    return {
        "wind_power_density_w_m2": round(wpd, 2),
        "air_density_kg_m3": rho,
        "wind_class": wind_class,
        "formula_used": "P/A = 0.5 * rho * v^3",
    }
