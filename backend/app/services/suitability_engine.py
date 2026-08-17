def calculate_site_score_weighted(
    renewable_resource_score: float,
    geographic_score: float,
    infrastructure_score: float,
    environmental_score: float,
    economic_score: float
) -> dict:
    """
    Calculates deterministic site score based on exact platform weighting:
      - Renewable Resource Availability = 35%
      - Geographic Suitability = 25%
      - Infrastructure Accessibility = 15%
      - Environmental Impact = 15%
      - Economic Feasibility = 10%

    Formula:
      Overall score = (resource * 0.35) + (geographic * 0.25) + (infrastructure * 0.15) + (environmental * 0.15) + (economic * 0.10)

    Categories:
      90-100 = Excellent
      80-89 = Highly Suitable
      65-79 = Moderately Suitable
      50-64 = Low Suitability
      0-49 = Unsuitable
    """
    overall_score = (
        (renewable_resource_score * 0.35) +
        (geographic_score * 0.25) +
        (infrastructure_score * 0.15) +
        (environmental_score * 0.15) +
        (economic_score * 0.10)
    )
    overall_rounded = round(overall_score, 2)

    if overall_rounded >= 90.0:
        category = "Excellent"
    elif overall_rounded >= 80.0:
        category = "Highly Suitable"
    elif overall_rounded >= 65.0:
        category = "Moderately Suitable"
    elif overall_rounded >= 50.0:
        category = "Low Suitability"
    else:
        category = "Unsuitable"

    return {
        "renewable_resource_score": renewable_resource_score,
        "geographic_score": geographic_score,
        "infrastructure_score": infrastructure_score,
        "environmental_score": environmental_score,
        "economic_score": economic_score,
        "overall_score": overall_rounded,
        "category": category,
        "weights": {
            "renewable_resource": 0.35,
            "geographic": 0.25,
            "infrastructure": 0.15,
            "environmental": 0.15,
            "economic": 0.10
        }
    }


def calculate_site_suitability(
    solar_ghi_kwh_m2: float,
    wind_speed_m_s: float,
    slope_degrees: float,
    dist_grid_km: float,
    dist_road_km: float,
    tech_type: str = "HYBRID"
) -> dict:
    """
    Legacy wrapper delegating to deterministic weighted score function.
    """
    # 1. Normalize Solar & Wind resource score
    solar_score = min(100.0, max(0.0, ((solar_ghi_kwh_m2 - 1000) / 1400) * 100))
    wind_score = min(100.0, max(0.0, ((wind_speed_m_s - 3.0) / 7.0) * 100))
    if tech_type == "SOLAR":
        resource_score = solar_score
    elif tech_type == "WIND":
        resource_score = wind_score
    else:
        resource_score = (solar_score * 0.5) + (wind_score * 0.5)

    # 2. Geographic score based on terrain slope
    geo_score = max(0.0, 100.0 - (slope_degrees * 5.0))

    # 3. Infrastructure score based on grid & road distance
    grid_score = max(0.0, 100.0 - (dist_grid_km * 2.0))
    road_score = max(0.0, 100.0 - (dist_road_km * 3.0))
    infra_score = (grid_score * 0.6) + (road_score * 0.4)

    # 4. Environmental impact & economic feasibility defaults
    env_score = 85.0
    econ_score = 80.0

    return calculate_site_score_weighted(
        renewable_resource_score=round(resource_score, 2),
        geographic_score=round(geo_score, 2),
        infrastructure_score=round(infra_score, 2),
        environmental_score=round(env_score, 2),
        economic_score=round(econ_score, 2)
    )
