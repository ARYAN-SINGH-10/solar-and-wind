from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.models.user import User
from app.api.v1.deps import require_roles
from app.services.ml_service import (
    predict_solar_energy_ml,
    predict_site_suitability_ml,
    rank_candidate_sites_ml,
    predict_wind_energy_ml,
    forecast_energy_ml,
    predict_payback_ml,
    predict_investment_risk_ml,
    recommend_technology_ml,
)

router = APIRouter()

# ===================================================================
# SCHEMAS — PHASE 1
# ===================================================================
class MLSolarPredictionInputSchema(BaseModel):
    ghi: Optional[float] = Field(2150.0, ge=500.0, le=3500.0, description="Global Horizontal Irradiance (kWh/m2/yr)")
    dni: Optional[float] = Field(2300.0, ge=500.0, le=3500.0, description="Direct Normal Irradiance (kWh/m2/yr)")
    temperature: Optional[float] = Field(22.5, ge=-30.0, le=60.0, description="Average Temperature (°C)")
    elevation: Optional[float] = Field(650.0, ge=-100.0, le=9000.0, description="Elevation (meters)")
    slope: Optional[float] = Field(2.5, ge=0.0, le=90.0, description="Land Slope (degrees)")
    latitude: Optional[float] = Field(23.25, ge=-90.0, le=90.0, description="Latitude")
    longitude: Optional[float] = Field(77.41, ge=-180.0, le=180.0, description="Longitude")
    installed_capacity_mw: Optional[float] = Field(10.0, ge=0.1, le=1000.0, description="Installed Capacity (MW)")


class MLSuitabilityPredictionInputSchema(BaseModel):
    renewable_resource_score: float = Field(85.0, ge=0.0, le=100.0)
    geographic_score: float = Field(80.0, ge=0.0, le=100.0)
    infrastructure_score: float = Field(75.0, ge=0.0, le=100.0)
    environmental_score: float = Field(88.0, ge=0.0, le=100.0)
    economic_score: float = Field(70.0, ge=0.0, le=100.0)
    slope: Optional[float] = Field(3.0, ge=0.0, le=90.0)
    elevation: Optional[float] = Field(650.0, ge=-100.0, le=9000.0)
    grid_distance_km: Optional[float] = Field(5.2, ge=0.0, le=500.0)
    road_distance_km: Optional[float] = Field(2.1, ge=0.0, le=500.0)


class CandidateSiteInput(BaseModel):
    site_id: str
    site_name: Optional[str] = None
    overall_score: Optional[float] = Field(75.0, ge=0.0, le=100.0)
    renewable_resource_score: Optional[float] = Field(75.0, ge=0.0, le=100.0)
    expected_energy_mwh: Optional[float] = Field(15000.0, ge=0.0)
    economic_score: Optional[float] = Field(70.0, ge=0.0, le=100.0)
    grid_distance_km: Optional[float] = Field(5.0, ge=0.0)
    road_distance_km: Optional[float] = Field(2.0, ge=0.0)


class MLRankSitesInputSchema(BaseModel):
    candidate_sites: List[CandidateSiteInput]

# ===================================================================
# SCHEMAS — PHASE 2
# ===================================================================
class MLWindPredictionInputSchema(BaseModel):
    mean_wind_speed: float = Field(7.5, ge=0.0, le=50.0, description="Mean Wind Speed (m/s)")
    wind_power_density: Optional[float] = Field(250.0, ge=0.0, description="Wind Power Density (W/m2)")
    air_density: Optional[float] = Field(1.225, ge=0.5, le=2.0, description="Air Density (kg/m3)")
    elevation: Optional[float] = Field(650.0, ge=-100.0, le=9000.0, description="Elevation (meters)")
    latitude: Optional[float] = Field(23.25, ge=-90.0, le=90.0, description="Latitude")
    longitude: Optional[float] = Field(77.41, ge=-180.0, le=180.0, description="Longitude")
    rotor_area: Optional[float] = Field(12469.0, ge=10.0, description="Rotor Swept Area (m2)")
    turbine_rating_mw: Optional[float] = Field(3.0, ge=0.5, le=20.0, description="Single Turbine Rating (MW)")
    num_turbines: Optional[int] = Field(5, ge=1, le=500, description="Number of Turbines")
    capacity_factor_pct: Optional[float] = Field(32.5, ge=0.0, le=100.0, description="Capacity Factor (%)")


class MLEnergyForecastInputSchema(BaseModel):
    month: int = Field(6, ge=1, le=12, description="Target Month (1-12)")
    historical_generation_mwh: Optional[float] = Field(3500.0, ge=0.0, description="Historical Generation (MWh)")
    solar_generation_mwh: Optional[float] = Field(2000.0, ge=0.0, description="Solar Generation Portion (MWh)")
    wind_generation_mwh: Optional[float] = Field(1500.0, ge=0.0, description="Wind Generation Portion (MWh)")
    irradiance: Optional[float] = Field(2150.0, ge=0.0, description="GHI Irradiance")
    wind_speed: Optional[float] = Field(7.5, ge=0.0, description="Wind Speed (m/s)")
    temperature: Optional[float] = Field(25.0, ge=-30.0, le=60.0, description="Temperature (°C)")
    degradation_year: Optional[int] = Field(1, ge=1, le=30, description="Project Lifecycle Year (1-30)")
    installed_capacity_mw: Optional[float] = Field(15.0, ge=0.1, le=1000.0, description="Installed Capacity (MW)")


class MLInvestmentInputSchema(BaseModel):
    installed_capacity_mw: float = Field(10.0, ge=0.1, le=1000.0)
    expected_annual_generation_mwh: float = Field(22000.0, ge=0.0)
    capex_usd: Optional[float] = Field(9500000.0, ge=0.0)
    annual_revenue_usd: Optional[float] = Field(1430000.0, ge=0.0)
    om_cost_usd: Optional[float] = Field(200000.0, ge=0.0)
    electricity_tariff_usd_mwh: Optional[float] = Field(65.0, ge=0.0, le=500.0)
    technology: Optional[str] = Field("HYBRID", max_length=50)
    capacity_factor_pct: Optional[float] = Field(28.5, ge=0.0, le=100.0)
    site_suitability_score: Optional[float] = Field(82.0, ge=0.0, le=100.0)


class MLTechnologyRecommendationInputSchema(BaseModel):
    ghi: float = Field(2150.0, ge=500.0, le=3500.0)
    wind_speed: float = Field(7.5, ge=0.0, le=50.0)
    wind_power_density: Optional[float] = Field(250.0, ge=0.0)
    suitability_score: Optional[float] = Field(82.0, ge=0.0, le=100.0)
    solar_generation_mwh: Optional[float] = Field(18000.0, ge=0.0)
    wind_generation_mwh: Optional[float] = Field(14000.0, ge=0.0)
    revenue_usd: Optional[float] = Field(2080000.0, ge=0.0)
    capacity_factor_pct: Optional[float] = Field(30.0, ge=0.0, le=100.0)
    infrastructure_score: Optional[float] = Field(75.0, ge=0.0, le=100.0)
    environmental_score: Optional[float] = Field(85.0, ge=0.0, le=100.0)

# ===================================================================
# ENDPOINTS — PHASE 1
# ===================================================================
@router.post("/solar/predict")
def predict_solar_energy_endpoint(
    payload: MLSolarPredictionInputSchema,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
):
    """Predict Annual Solar AC Generation (MWh/yr) using GradientBoostingRegressor model."""
    try:
        return predict_solar_energy_ml(
            ghi=payload.ghi, dni=payload.dni, temperature=payload.temperature,
            elevation=payload.elevation, slope=payload.slope, latitude=payload.latitude,
            longitude=payload.longitude, installed_capacity_mw=payload.installed_capacity_mw,
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Solar ML Prediction Error: {str(e)}")


@router.post("/suitability/predict")
def predict_suitability_endpoint(
    payload: MLSuitabilityPredictionInputSchema,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
):
    """Classify Site Suitability (POOR, MODERATE, GOOD, EXCELLENT) using RandomForestClassifier."""
    try:
        return predict_site_suitability_ml(
            renewable_resource_score=payload.renewable_resource_score,
            geographic_score=payload.geographic_score,
            infrastructure_score=payload.infrastructure_score,
            environmental_score=payload.environmental_score,
            economic_score=payload.economic_score,
            slope=payload.slope, elevation=payload.elevation,
            grid_distance_km=payload.grid_distance_km, road_distance_km=payload.road_distance_km,
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Suitability ML Classification Error: {str(e)}")


@router.post("/rank-sites")
def rank_candidate_sites_endpoint(
    payload: MLRankSitesInputSchema,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
):
    """Rank multiple candidate deployment sites using an explainable composite heuristic ranking algorithm."""
    if not payload.candidate_sites:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least 1 candidate site is required for candidate ranking.")

    try:
        sites_dicts = [s.dict() for s in payload.candidate_sites]
        ranked_results = rank_candidate_sites_ml(sites_dicts)
        return {
            "model": "Explainable Composite Heuristic Site Ranker (v1.0.0)",
            "total_sites_ranked": len(ranked_results),
            "ranked_sites": ranked_results,
            "is_ml_prediction": True,
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Multi-Site Ranking Error: {str(e)}")

# ===================================================================
# ENDPOINTS — PHASE 2
# ===================================================================
@router.post("/wind/predict")
def predict_wind_energy_endpoint(
    payload: MLWindPredictionInputSchema,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
):
    """Predict Annual Wind Energy Generation (MWh/year) using RandomForestRegressor model."""
    try:
        return predict_wind_energy_ml(
            mean_wind_speed=payload.mean_wind_speed, wind_power_density=payload.wind_power_density,
            air_density=payload.air_density, elevation=payload.elevation, latitude=payload.latitude,
            longitude=payload.longitude, rotor_area=payload.rotor_area, turbine_rating_mw=payload.turbine_rating_mw,
            num_turbines=payload.num_turbines, capacity_factor_pct=payload.capacity_factor_pct,
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Wind ML Prediction Error: {str(e)}")


@router.post("/forecast/predict")
def forecast_energy_endpoint(
    payload: MLEnergyForecastInputSchema,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
):
    """Predict Monthly Energy Generation (MWh/month) for a given lifecycle degradation year using GradientBoostingRegressor."""
    try:
        return forecast_energy_ml(
            month=payload.month, historical_generation_mwh=payload.historical_generation_mwh,
            solar_generation_mwh=payload.solar_generation_mwh, wind_generation_mwh=payload.wind_generation_mwh,
            irradiance=payload.irradiance, wind_speed=payload.wind_speed, temperature=payload.temperature,
            degradation_year=payload.degradation_year, installed_capacity_mw=payload.installed_capacity_mw,
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Energy Forecast ML Error: {str(e)}")


@router.post("/investment/predict")
def predict_investment_endpoint(
    payload: MLInvestmentInputSchema,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
):
    """Predict Financial Payback Period (years) and Investment Risk Category (LOW, MEDIUM, HIGH) using Machine Learning."""
    try:
        payback_res = predict_payback_ml(
            installed_capacity_mw=payload.installed_capacity_mw,
            expected_annual_generation_mwh=payload.expected_annual_generation_mwh,
            capex_usd=payload.capex_usd, annual_revenue_usd=payload.annual_revenue_usd,
            om_cost_usd=payload.om_cost_usd, electricity_tariff_usd_mwh=payload.electricity_tariff_usd_mwh,
            technology=payload.technology, capacity_factor_pct=payload.capacity_factor_pct,
            site_suitability_score=payload.site_suitability_score,
        )

        risk_res = predict_investment_risk_ml(
            installed_capacity_mw=payload.installed_capacity_mw,
            expected_annual_generation_mwh=payload.expected_annual_generation_mwh,
            capex_usd=payload.capex_usd, annual_revenue_usd=payload.annual_revenue_usd,
            om_cost_usd=payload.om_cost_usd, electricity_tariff_usd_mwh=payload.electricity_tariff_usd_mwh,
            technology=payload.technology, capacity_factor_pct=payload.capacity_factor_pct,
            site_suitability_score=payload.site_suitability_score,
        )

        return {
            "model_payback": payback_res["model"],
            "model_risk": risk_res["model"],
            "predicted_payback_years": payback_res["predicted_payback_years"],
            "payback_prediction_interval": payback_res["prediction_interval"],
            "predicted_risk_category": risk_res["prediction_risk_category"],
            "risk_class_probabilities": risk_res["class_probabilities"],
            "payback_metrics": payback_res["model_metrics"],
            "risk_metrics": risk_res["model_metrics"],
            "dataset_source": payback_res["dataset_source"],
            "model_version": payback_res["model_version"],
            "is_ml_prediction": True,
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Investment ML Prediction Error: {str(e)}")


@router.post("/technology/recommend")
def recommend_technology_endpoint(
    payload: MLTechnologyRecommendationInputSchema,
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
):
    """Predict Optimal Technology Matching (SOLAR, WIND, HYBRID) using RandomForestClassifier model."""
    try:
        return recommend_technology_ml(
            ghi=payload.ghi, wind_speed=payload.wind_speed, wind_power_density=payload.wind_power_density,
            suitability_score=payload.suitability_score, solar_generation_mwh=payload.solar_generation_mwh,
            wind_generation_mwh=payload.wind_generation_mwh, revenue_usd=payload.revenue_usd,
            capacity_factor_pct=payload.capacity_factor_pct, infrastructure_score=payload.infrastructure_score,
            environmental_score=payload.environmental_score,
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Technology ML Recommendation Error: {str(e)}")
