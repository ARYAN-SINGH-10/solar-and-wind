"""
ML Service — Phase 1 + Phase 2 Intelligence Layer
Provides singleton loading of serialized joblib model artifacts and prediction/ranking methods:
- predict_solar_energy_ml
- predict_site_suitability_ml
- rank_candidate_sites_ml
- predict_wind_energy_ml
- forecast_energy_ml
- predict_payback_ml
- predict_investment_risk_ml
- recommend_technology_ml
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List

class MLModelManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MLModelManager, cls).__new__(cls)
            cls._instance.artifacts = None
            cls._instance._load_artifacts()
        return cls._instance

    def _load_artifacts(self):
        models_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        artifact_path = os.path.join(models_dir, "ml_models", "solar_wind_ml_artifacts.joblib")
        
        if not os.path.exists(artifact_path):
            raise FileNotFoundError(
                f"ML model artifact file not found at {artifact_path}. Run train_models.py first."
            )
        
        self.artifacts = joblib.load(artifact_path)

def get_ml_manager() -> MLModelManager:
    return MLModelManager()

# ===================================================================
# 1. SOLAR ENERGY PREDICTION
# ===================================================================
def predict_solar_energy_ml(
    ghi: float = 2150.0,
    dni: float = 2300.0,
    temperature: float = 22.5,
    elevation: float = 650.0,
    slope: float = 2.5,
    latitude: float = 23.25,
    longitude: float = 77.41,
    installed_capacity_mw: float = 10.0,
) -> Dict[str, Any]:
    manager = get_ml_manager()
    artifacts = manager.artifacts

    model = artifacts["solar_model"]
    scaler = artifacts["solar_scaler"]
    metrics = artifacts["solar_metrics"]

    input_df = pd.DataFrame([{
        "ghi": ghi, "dni": dni, "temperature": temperature,
        "elevation": elevation, "slope": slope, "latitude": latitude,
        "longitude": longitude, "installed_capacity_mw": installed_capacity_mw,
    }])

    scaled_input = scaler.transform(input_df)
    predicted_mwh = float(model.predict(scaled_input)[0])

    rmse = metrics.get("rmse", 2372.71)
    lower_bound = max(0.0, round(predicted_mwh - 1.96 * rmse, 2))
    upper_bound = round(predicted_mwh + 1.96 * rmse, 2)

    return {
        "model": "GradientBoostingRegressor (v2.0.0)",
        "prediction_annual_mwh": round(predicted_mwh, 2),
        "unit": "MWh/year",
        "prediction_interval": {
            "lower_bound_mwh": lower_bound,
            "upper_bound_mwh": upper_bound,
            "interval_type": "Residual-based 95% Prediction Interval (±1.96 × RMSE)"
        },
        "model_metrics": metrics,
        "dataset_source": artifacts.get("dataset_source"),
        "model_version": artifacts.get("model_version", "2.0.0"),
        "is_ml_prediction": True,
    }

# ===================================================================
# 2. SITE SUITABILITY CLASSIFICATION
# ===================================================================
def predict_site_suitability_ml(
    renewable_resource_score: float = 85.0,
    geographic_score: float = 80.0,
    infrastructure_score: float = 75.0,
    environmental_score: float = 88.0,
    economic_score: float = 70.0,
    slope: float = 3.0,
    elevation: float = 650.0,
    grid_distance_km: float = 5.2,
    road_distance_km: float = 2.1,
) -> Dict[str, Any]:
    manager = get_ml_manager()
    artifacts = manager.artifacts

    model = artifacts["suitability_model"]
    scaler = artifacts["suitability_scaler"]
    classes = artifacts["suitability_classes"]
    metrics = artifacts["suitability_metrics"]

    input_df = pd.DataFrame([{
        "renewable_resource_score": renewable_resource_score,
        "geographic_score": geographic_score,
        "infrastructure_score": infrastructure_score,
        "environmental_score": environmental_score,
        "economic_score": economic_score,
        "slope": slope, "elevation": elevation,
        "grid_distance_km": grid_distance_km,
        "road_distance_km": road_distance_km,
    }])

    scaled_input = scaler.transform(input_df)
    predicted_class = str(model.predict(scaled_input)[0])
    probabilities_arr = model.predict_proba(scaled_input)[0]

    probabilities_dict = {
        cls_name: round(float(prob), 4) for cls_name, prob in zip(classes, probabilities_arr)
    }

    return {
        "model": "RandomForestClassifier (v2.0.0)",
        "prediction_category": predicted_class,
        "class_probabilities": probabilities_dict,
        "model_metrics": metrics,
        "dataset_source": artifacts.get("dataset_source"),
        "model_version": artifacts.get("model_version", "2.0.0"),
        "is_ml_prediction": True,
    }

# ===================================================================
# 3. MULTI-SITE CANDIDATE RANKING
# ===================================================================
def rank_candidate_sites_ml(
    candidate_sites: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Explainable Composite Heuristic Site Ranker.
    Calculates weighted preference score based on composite suitability, generation capacity, 
    and infrastructure proximity.
    """
    if not candidate_sites:
        return []

    ranked = []
    for site in candidate_sites:
        site_id = str(site.get("site_id", site.get("id", "N/A")))
        site_name = site.get("site_name", f"Site-{site_id[:8]}")
        overall_score = float(site.get("overall_score", site.get("suitability_score", 70.0)))
        resource_score = float(site.get("resource_score", site.get("renewable_resource_score", 75.0)))
        gen_mwh = float(site.get("expected_generation_mwh", site.get("expected_energy_mwh", 15000.0)))
        econ_score = float(site.get("economic_score", 70.0))
        grid_km = float(site.get("grid_distance_km", site.get("grid_distance", 10.0)))
        road_km = float(site.get("road_distance_km", 5.0))

        norm_gen = min(100.0, (gen_mwh / 500.0))
        grid_penalty = min(25.0, grid_km * 0.5)
        road_penalty = min(15.0, road_km * 0.5)

        rank_score = (
            (overall_score * 0.35) +
            (resource_score * 0.25) +
            (norm_gen * 0.20) +
            (econ_score * 0.20) -
            grid_penalty -
            road_penalty
        )
        rank_score = round(max(0.0, min(100.0, rank_score)), 2)

        contributing_factors = []
        if resource_score >= 80:
            contributing_factors.append(f"High Renewable Resource Potential ({resource_score:.1f}/100)")
        if grid_km <= 5.0:
            contributing_factors.append(f"Close Proximity to Grid Connection ({grid_km:.1f} km)")
        if overall_score >= 80:
            contributing_factors.append(f"Top-Tier Composite Suitability ({overall_score:.1f}/100)")
        if econ_score >= 75:
            contributing_factors.append(f"Strong Economic Payback Projection ({econ_score:.1f}/100)")
        if not contributing_factors:
            contributing_factors.append(f"Moderate Overall Score ({overall_score:.1f}/100)")

        ranked.append({
            "site_id": site_id,
            "site_name": site_name,
            "rank_score": rank_score,
            "major_contributing_factors": contributing_factors,
            "attributes": {
                "overall_score": overall_score,
                "resource_score": resource_score,
                "expected_generation_mwh": gen_mwh,
                "grid_distance_km": grid_km,
                "road_distance_km": road_km
            }
        })

    ranked.sort(key=lambda x: x["rank_score"], reverse=True)
    for idx, item in enumerate(ranked):
        item["rank"] = idx + 1

    return ranked

# ===================================================================
# 4. WIND RESOURCE / ENERGY PREDICTION
# ===================================================================
def predict_wind_energy_ml(
    mean_wind_speed: float = 7.5,
    wind_power_density: float = 250.0,
    air_density: float = 1.225,
    elevation: float = 650.0,
    latitude: float = 23.25,
    longitude: float = 77.41,
    rotor_area: float = 12469.0,
    turbine_rating_mw: float = 3.0,
    num_turbines: int = 5,
    capacity_factor_pct: float = 32.5,
) -> Dict[str, Any]:
    manager = get_ml_manager()
    artifacts = manager.artifacts

    model = artifacts["wind_model"]
    scaler = artifacts["wind_scaler"]
    metrics = artifacts["wind_metrics"]

    input_df = pd.DataFrame([{
        "mean_wind_speed": mean_wind_speed, "wind_power_density": wind_power_density,
        "air_density": air_density, "elevation": elevation, "latitude": latitude,
        "longitude": longitude, "rotor_area": rotor_area, "turbine_rating_mw": turbine_rating_mw,
        "num_turbines": num_turbines, "capacity_factor_pct": capacity_factor_pct,
    }])

    scaled_input = scaler.transform(input_df)
    predicted_mwh = float(model.predict(scaled_input)[0])

    rmse = metrics.get("rmse", 16848.21)
    lower_bound = max(0.0, round(predicted_mwh - 1.96 * rmse, 2))
    upper_bound = round(predicted_mwh + 1.96 * rmse, 2)

    return {
        "model": "RandomForestRegressor (v2.0.0)",
        "prediction_annual_mwh": round(predicted_mwh, 2),
        "unit": "MWh/year",
        "prediction_interval": {
            "lower_bound_mwh": lower_bound,
            "upper_bound_mwh": upper_bound,
            "interval_type": "Residual-based 95% Prediction Interval (±1.96 × RMSE)"
        },
        "model_metrics": metrics,
        "dataset_source": artifacts.get("dataset_source"),
        "model_version": artifacts.get("model_version", "2.0.0"),
        "is_ml_prediction": True,
    }

# ===================================================================
# 5. ENERGY GENERATION FORECASTING
# ===================================================================
def forecast_energy_ml(
    month: int = 6,
    historical_generation_mwh: float = 3500.0,
    solar_generation_mwh: float = 2000.0,
    wind_generation_mwh: float = 1500.0,
    irradiance: float = 2150.0,
    wind_speed: float = 7.5,
    temperature: float = 25.0,
    degradation_year: int = 1,
    installed_capacity_mw: float = 15.0,
) -> Dict[str, Any]:
    manager = get_ml_manager()
    artifacts = manager.artifacts

    model = artifacts["forecast_model"]
    scaler = artifacts["forecast_scaler"]
    metrics = artifacts["forecast_metrics"]

    input_df = pd.DataFrame([{
        "month": month, "historical_generation_mwh": historical_generation_mwh,
        "solar_generation_mwh": solar_generation_mwh, "wind_generation_mwh": wind_generation_mwh,
        "irradiance": irradiance, "wind_speed": wind_speed, "temperature": temperature,
        "degradation_year": degradation_year, "installed_capacity_mw": installed_capacity_mw,
    }])

    scaled_input = scaler.transform(input_df)
    predicted_monthly_mwh = float(model.predict(scaled_input)[0])

    rmse = metrics.get("rmse", 238.88)
    lower_bound = max(0.0, round(predicted_monthly_mwh - 1.96 * rmse, 2))
    upper_bound = round(predicted_monthly_mwh + 1.96 * rmse, 2)

    return {
        "model": "GradientBoostingRegressor (v2.0.0)",
        "prediction_monthly_mwh": round(predicted_monthly_mwh, 2),
        "month": month,
        "degradation_year": degradation_year,
        "unit": "MWh/month",
        "prediction_interval": {
            "lower_bound_mwh": lower_bound,
            "upper_bound_mwh": upper_bound,
            "interval_type": "Residual-based 95% Prediction Interval (±1.96 × RMSE)"
        },
        "model_metrics": metrics,
        "dataset_source": artifacts.get("dataset_source"),
        "model_version": artifacts.get("model_version", "2.0.0"),
        "is_ml_prediction": True,
    }

# ===================================================================
# 6. INVESTMENT PAYBACK PREDICTION
# ===================================================================
def predict_payback_ml(
    installed_capacity_mw: float = 10.0,
    expected_annual_generation_mwh: float = 22000.0,
    capex_usd: float = 9500000.0,
    annual_revenue_usd: float = 1430000.0,
    om_cost_usd: float = 200000.0,
    electricity_tariff_usd_mwh: float = 65.0,
    technology: str = "HYBRID",
    capacity_factor_pct: float = 28.5,
    site_suitability_score: float = 82.0,
) -> Dict[str, Any]:
    manager = get_ml_manager()
    artifacts = manager.artifacts

    model = artifacts["payback_model"]
    scaler = artifacts["payback_scaler"]
    metrics = artifacts["payback_metrics"]

    tech_map = {"SOLAR": 0, "WIND": 1, "HYBRID": 2}
    tech_code = tech_map.get(technology.upper(), 2)

    input_df = pd.DataFrame([{
        "installed_capacity_mw": installed_capacity_mw,
        "expected_annual_generation_mwh": expected_annual_generation_mwh,
        "capex_usd": capex_usd, "annual_revenue_usd": annual_revenue_usd,
        "om_cost_usd": om_cost_usd, "electricity_tariff_usd_mwh": electricity_tariff_usd_mwh,
        "technology_encoded": tech_code, "capacity_factor_pct": capacity_factor_pct,
        "site_suitability_score": site_suitability_score,
    }])

    scaled_input = scaler.transform(input_df)
    predicted_payback_years = float(model.predict(scaled_input)[0])

    rmse = metrics.get("rmse", 0.53)
    lower_bound = max(0.5, round(predicted_payback_years - 1.96 * rmse, 2))
    upper_bound = round(predicted_payback_years + 1.96 * rmse, 2)

    return {
        "model": "GradientBoostingRegressor (v2.0.0)",
        "predicted_payback_years": round(predicted_payback_years, 2),
        "unit": "Years",
        "prediction_interval": {
            "lower_bound_years": lower_bound,
            "upper_bound_years": upper_bound,
            "interval_type": "Residual-based 95% Prediction Interval (±1.96 × RMSE)"
        },
        "model_metrics": metrics,
        "dataset_source": artifacts.get("dataset_source"),
        "model_version": artifacts.get("model_version", "2.0.0"),
        "is_ml_prediction": True,
    }

# ===================================================================
# 7. INVESTMENT RISK PREDICTION
# ===================================================================
def predict_investment_risk_ml(
    installed_capacity_mw: float = 10.0,
    expected_annual_generation_mwh: float = 22000.0,
    capex_usd: float = 9500000.0,
    annual_revenue_usd: float = 1430000.0,
    om_cost_usd: float = 200000.0,
    electricity_tariff_usd_mwh: float = 65.0,
    technology: str = "HYBRID",
    capacity_factor_pct: float = 28.5,
    site_suitability_score: float = 82.0,
) -> Dict[str, Any]:
    manager = get_ml_manager()
    artifacts = manager.artifacts

    model = artifacts["risk_model"]
    scaler = artifacts["risk_scaler"]
    classes = artifacts["risk_classes"]
    metrics = artifacts["risk_metrics"]

    tech_map = {"SOLAR": 0, "WIND": 1, "HYBRID": 2}
    tech_code = tech_map.get(technology.upper(), 2)

    input_df = pd.DataFrame([{
        "installed_capacity_mw": installed_capacity_mw,
        "expected_annual_generation_mwh": expected_annual_generation_mwh,
        "capex_usd": capex_usd, "annual_revenue_usd": annual_revenue_usd,
        "om_cost_usd": om_cost_usd, "electricity_tariff_usd_mwh": electricity_tariff_usd_mwh,
        "technology_encoded": tech_code, "capacity_factor_pct": capacity_factor_pct,
        "site_suitability_score": site_suitability_score,
    }])

    scaled_input = scaler.transform(input_df)
    predicted_class = str(model.predict(scaled_input)[0])
    probabilities_arr = model.predict_proba(scaled_input)[0]

    probabilities_dict = {
        cls_name: round(float(prob), 4) for cls_name, prob in zip(classes, probabilities_arr)
    }

    return {
        "model": "RandomForestClassifier (v2.0.0)",
        "prediction_risk_category": predicted_class,
        "class_probabilities": probabilities_dict,
        "model_metrics": metrics,
        "dataset_source": artifacts.get("dataset_source"),
        "model_version": artifacts.get("model_version", "2.0.0"),
        "is_ml_prediction": True,
    }

# ===================================================================
# 8. TECHNOLOGY RECOMMENDATION
# ===================================================================
def recommend_technology_ml(
    ghi: float = 2150.0,
    wind_speed: float = 7.5,
    wind_power_density: float = 250.0,
    suitability_score: float = 82.0,
    solar_generation_mwh: float = 18000.0,
    wind_generation_mwh: float = 14000.0,
    revenue_usd: float = 2080000.0,
    capacity_factor_pct: float = 30.0,
    infrastructure_score: float = 75.0,
    environmental_score: float = 85.0,
) -> Dict[str, Any]:
    manager = get_ml_manager()
    artifacts = manager.artifacts

    model = artifacts["tech_model"]
    scaler = artifacts["tech_scaler"]
    classes = artifacts["tech_classes"]
    metrics = artifacts["tech_metrics"]

    input_df = pd.DataFrame([{
        "ghi": ghi, "wind_speed": wind_speed, "wind_power_density": wind_power_density,
        "suitability_score": suitability_score, "solar_generation_mwh": solar_generation_mwh,
        "wind_generation_mwh": wind_generation_mwh, "revenue_usd": revenue_usd,
        "capacity_factor_pct": capacity_factor_pct, "infrastructure_score": infrastructure_score,
        "environmental_score": environmental_score,
    }])

    scaled_input = scaler.transform(input_df)
    predicted_tech = str(model.predict(scaled_input)[0])
    probabilities_arr = model.predict_proba(scaled_input)[0]

    probabilities_dict = {
        cls_name: round(float(prob), 4) for cls_name, prob in zip(classes, probabilities_arr)
    }

    return {
        "model": "RandomForestClassifier (v2.0.0)",
        "recommended_technology": predicted_tech,
        "class_probabilities": probabilities_dict,
        "model_metrics": metrics,
        "dataset_source": artifacts.get("dataset_source"),
        "model_version": artifacts.get("model_version", "2.0.0"),
        "is_ml_prediction": True,
    }
