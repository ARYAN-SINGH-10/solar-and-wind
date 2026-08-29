"""
ML Model Training & Pipeline Script for Solar & Wind Deployment Intelligence Platform

This script trains and evaluates 7 core machine-learning models:
1. Solar Energy Prediction Model (GradientBoostingRegressor)
2. Site Suitability Classifier (RandomForestClassifier)
3. Wind Resource / Energy Prediction Model (RandomForestRegressor)
4. Energy Generation Forecasting Model (GradientBoostingRegressor)
5. Financial Payback Prediction Model (GradientBoostingRegressor)
6. Investment Risk Category Classifier (RandomForestClassifier)
7. Technology Recommendation Classifier (RandomForestClassifier)

Data Strategy:
Uses a 5,000-sample synthetic development dataset calibrated using renewable-energy physical relationships.
Clearly marked as a calibrated development training dataset.

Documentation of Pipeline:
- Dataset Source: 5,000-sample synthetic development dataset calibrated using renewable-energy physical relationships
- Preprocessing: StandardScaler normalization & Train/Test Split (80/20 ratio)
- Evaluation Metrics: MAE, RMSE, R^2 for Regressors; Accuracy, Precision, Recall, F1 for Classifiers
- Limitations: Calibrated for macro-geographic terrestrial renewable energy installations. Requires hyper-local satellite & ground-telemetry fine-tuning for micro-grid deployment.
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor, RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
)

def train_and_save_models():
    models_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(models_dir, exist_ok=True)
    
    print("=" * 75)
    print("SOLAR & WIND PLATFORM — FULL AI/ML TRAINING PIPELINE (PHASE 1 + PHASE 2)")
    print("=" * 75)

    np.random.seed(42)
    n_samples = 5000

    # ===================================================================
    # 1. SOLAR ENERGY PREDICTION MODEL (GradientBoostingRegressor)
    # ===================================================================
    print("\n[1/7] Training Solar Energy Prediction Model (GradientBoostingRegressor)...")
    ghi = np.random.uniform(1100.0, 2500.0, n_samples)
    dni = ghi * np.random.uniform(0.8, 1.25, n_samples)
    temp = np.random.uniform(5.0, 42.0, n_samples)
    elevation = np.random.uniform(10.0, 2800.0, n_samples)
    slope = np.random.uniform(0.0, 22.0, n_samples)
    lat = np.random.uniform(15.0, 35.0, n_samples)
    lon = np.random.uniform(68.0, 97.0, n_samples)
    capacity_mw = np.random.uniform(1.0, 100.0, n_samples)

    pr = 0.82 - (slope * 0.003) - (temp * 0.0015) + (elevation * 0.00002)
    annual_solar_gen = (capacity_mw * 1000.0) * (ghi / 1000.0) * pr * np.random.uniform(0.96, 1.04, n_samples)

    X_solar = pd.DataFrame({
        'ghi': ghi, 'dni': dni, 'temperature': temp, 'elevation': elevation,
        'slope': slope, 'latitude': lat, 'longitude': lon, 'installed_capacity_mw': capacity_mw
    })
    y_solar = annual_solar_gen

    X_train_sol, X_test_sol, y_train_sol, y_test_sol = train_test_split(
        X_solar, y_solar, test_size=0.20, random_state=42
    )

    solar_scaler = StandardScaler()
    X_train_sol_scaled = solar_scaler.fit_transform(X_train_sol)
    X_test_sol_scaled = solar_scaler.transform(X_test_sol)

    solar_model = GradientBoostingRegressor(n_estimators=150, learning_rate=0.08, max_depth=5, random_state=42)
    solar_model.fit(X_train_sol_scaled, y_train_sol)

    y_pred_sol = solar_model.predict(X_test_sol_scaled)
    mae_sol = mean_absolute_error(y_test_sol, y_pred_sol)
    rmse_sol = np.sqrt(mean_squared_error(y_test_sol, y_pred_sol))
    r2_sol = r2_score(y_test_sol, y_pred_sol)

    print(f"   - Solar MAE:  {mae_sol:.2f} MWh/yr | RMSE: {rmse_sol:.2f} MWh/yr | R²: {r2_sol:.4f}")

    # ===================================================================
    # 2. SITE SUITABILITY CLASSIFIER (RandomForestClassifier)
    # ===================================================================
    print("\n[2/7] Training Site Suitability Classifier (RandomForestClassifier)...")
    res_score = np.random.uniform(30.0, 98.0, n_samples)
    geo_score = np.random.uniform(30.0, 98.0, n_samples)
    infra_score = np.random.uniform(20.0, 95.0, n_samples)
    env_score = np.random.uniform(25.0, 95.0, n_samples)
    econ_score = np.random.uniform(20.0, 95.0, n_samples)
    grid_dist = np.random.uniform(0.5, 45.0, n_samples)
    road_dist = np.random.uniform(0.2, 25.0, n_samples)

    overall = (res_score * 0.35) + (geo_score * 0.25) + (infra_score * 0.15) + (env_score * 0.15) + (econ_score * 0.10)
    suit_categories = ["EXCELLENT" if s >= 82.0 else "GOOD" if s >= 68.0 else "MODERATE" if s >= 50.0 else "POOR" for s in overall]

    X_suit = pd.DataFrame({
        'renewable_resource_score': res_score, 'geographic_score': geo_score,
        'infrastructure_score': infra_score, 'environmental_score': env_score,
        'economic_score': econ_score, 'slope': slope, 'elevation': elevation,
        'grid_distance_km': grid_dist, 'road_distance_km': road_dist
    })
    y_suit = np.array(suit_categories)

    X_train_suit, X_test_suit, y_train_suit, y_test_suit = train_test_split(
        X_suit, y_suit, test_size=0.20, random_state=42, stratify=y_suit
    )

    suit_scaler = StandardScaler()
    X_train_suit_scaled = suit_scaler.fit_transform(X_train_suit)
    X_test_suit_scaled = suit_scaler.transform(X_test_suit)

    suitability_model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    suitability_model.fit(X_train_suit_scaled, y_train_suit)

    y_pred_suit = suitability_model.predict(X_test_suit_scaled)
    acc_suit = accuracy_score(y_test_suit, y_pred_suit)
    prec_suit = precision_score(y_test_suit, y_pred_suit, average='weighted')
    rec_suit = recall_score(y_test_suit, y_pred_suit, average='weighted')
    f1_suit = f1_score(y_test_suit, y_pred_suit, average='weighted')

    print(f"   - Suitability Acc: {acc_suit*100:.2f}% | Prec: {prec_suit*100:.2f}% | F1: {f1_suit*100:.2f}%")

    # ===================================================================
    # 3. WIND RESOURCE / ENERGY PREDICTION MODEL (RandomForestRegressor)
    # ===================================================================
    print("\n[3/7] Training Wind Energy Prediction Model (RandomForestRegressor)...")
    wind_speed = np.random.uniform(4.0, 14.0, n_samples)  # m/s
    air_density = np.random.uniform(1.10, 1.28, n_samples) # kg/m3
    wpd = 0.5 * air_density * (wind_speed ** 3)            # W/m2
    rotor_diameter = np.random.uniform(80.0, 150.0, n_samples)
    rotor_area = np.pi * ((rotor_diameter / 2.0) ** 2)
    num_turbines = np.random.randint(1, 40, n_samples)
    turbine_rating = np.random.uniform(2.0, 6.0, n_samples) # MW
    total_wind_capacity_mw = turbine_rating * num_turbines
    capacity_factor = np.clip((wind_speed / 12.0) ** 3 * 0.45 * 100.0, 5.0, 55.0)

    # Annual Wind Generation formula + turbulence loss
    raw_wind_gen = (total_wind_capacity_mw * 1000.0) * (capacity_factor / 100.0) * 8760.0 / 1000.0
    annual_wind_gen_mwh = raw_wind_gen * np.random.uniform(0.95, 1.05, n_samples)

    X_wind = pd.DataFrame({
        'mean_wind_speed': wind_speed, 'wind_power_density': wpd, 'air_density': air_density,
        'elevation': elevation, 'latitude': lat, 'longitude': lon, 'rotor_area': rotor_area,
        'turbine_rating_mw': turbine_rating, 'num_turbines': num_turbines, 'capacity_factor_pct': capacity_factor
    })
    y_wind = annual_wind_gen_mwh

    X_train_wnd, X_test_wnd, y_train_wnd, y_test_wnd = train_test_split(
        X_wind, y_wind, test_size=0.20, random_state=42
    )

    wind_scaler = StandardScaler()
    X_train_wnd_scaled = wind_scaler.fit_transform(X_train_wnd)
    X_test_wnd_scaled = wind_scaler.transform(X_test_wnd)

    wind_model = RandomForestRegressor(n_estimators=120, max_depth=10, random_state=42)
    wind_model.fit(X_train_wnd_scaled, y_train_wnd)

    y_pred_wnd = wind_model.predict(X_test_wnd_scaled)
    mae_wnd = mean_absolute_error(y_test_wnd, y_pred_wnd)
    rmse_wnd = np.sqrt(mean_squared_error(y_test_wnd, y_pred_wnd))
    r2_wnd = r2_score(y_test_wnd, y_pred_wnd)

    print(f"   - Wind MAE:   {mae_wnd:.2f} MWh/yr | RMSE: {rmse_wnd:.2f} MWh/yr | R²: {r2_wnd:.4f}")

    # ===================================================================
    # 4. ENERGY GENERATION FORECASTING MODEL (GradientBoostingRegressor)
    # ===================================================================
    print("\n[4/7] Training Energy Generation Forecast Model (GradientBoostingRegressor)...")
    month = np.random.randint(1, 13, n_samples)
    degradation_year = np.random.randint(1, 26, n_samples)
    hist_gen = np.random.uniform(500.0, 15000.0, n_samples)
    sol_gen_part = hist_gen * np.random.uniform(0.4, 0.7, n_samples)
    wnd_gen_part = hist_gen - sol_gen_part

    # Seasonal weight array
    month_weights = np.array([0.085, 0.088, 0.095, 0.092, 0.090, 0.082, 0.075, 0.078, 0.080, 0.084, 0.076, 0.075])
    m_weight = np.array([month_weights[m - 1] for m in month])

    deg_factor = (1.0 - 0.005) ** (degradation_year - 1)
    monthly_target = (hist_gen * 12.0) * m_weight * deg_factor * np.random.uniform(0.96, 1.04, n_samples)

    X_forecast = pd.DataFrame({
        'month': month, 'historical_generation_mwh': hist_gen,
        'solar_generation_mwh': sol_gen_part, 'wind_generation_mwh': wnd_gen_part,
        'irradiance': ghi, 'wind_speed': wind_speed, 'temperature': temp,
        'degradation_year': degradation_year, 'installed_capacity_mw': capacity_mw
    })
    y_forecast = monthly_target

    X_train_fc, X_test_fc, y_train_fc, y_test_fc = train_test_split(
        X_forecast, y_forecast, test_size=0.20, random_state=42
    )

    forecast_scaler = StandardScaler()
    X_train_fc_scaled = forecast_scaler.fit_transform(X_train_fc)
    X_test_fc_scaled = forecast_scaler.transform(X_test_fc)

    forecast_model = GradientBoostingRegressor(n_estimators=150, learning_rate=0.08, max_depth=6, random_state=42)
    forecast_model.fit(X_train_fc_scaled, y_train_fc)

    y_pred_fc = forecast_model.predict(X_test_fc_scaled)
    mae_fc = mean_absolute_error(y_test_fc, y_pred_fc)
    rmse_fc = np.sqrt(mean_squared_error(y_test_fc, y_pred_fc))
    r2_fc = r2_score(y_test_fc, y_pred_fc)

    print(f"   - Forecast MAE: {mae_fc:.2f} MWh/month | RMSE: {rmse_fc:.2f} MWh/month | R²: {r2_fc:.4f}")

    # ===================================================================
    # 5. INVESTMENT PAYBACK PREDICTION MODEL (GradientBoostingRegressor)
    # ===================================================================
    print("\n[5/7] Training Financial Payback Model (GradientBoostingRegressor)...")
    exp_gen_mwh = np.random.uniform(5000.0, 150000.0, n_samples)
    capex_usd = capacity_mw * np.random.uniform(850000.0, 1200000.0, n_samples)
    tariff_usd = np.random.uniform(45.0, 95.0, n_samples)
    ann_rev_usd = exp_gen_mwh * tariff_usd
    om_cost_usd = capex_usd * np.random.uniform(0.015, 0.035, n_samples)
    tech_code = np.random.choice([0, 1, 2], n_samples) # 0=SOLAR, 1=WIND, 2=HYBRID

    net_annual_income = np.maximum(100000.0, ann_rev_usd - om_cost_usd)
    raw_payback = capex_usd / net_annual_income
    payback_years_target = np.clip(raw_payback * np.random.uniform(0.97, 1.03, n_samples), 2.5, 20.0)

    X_payback = pd.DataFrame({
        'installed_capacity_mw': capacity_mw, 'expected_annual_generation_mwh': exp_gen_mwh,
        'capex_usd': capex_usd, 'annual_revenue_usd': ann_rev_usd, 'om_cost_usd': om_cost_usd,
        'electricity_tariff_usd_mwh': tariff_usd, 'technology_encoded': tech_code,
        'capacity_factor_pct': capacity_factor, 'site_suitability_score': res_score
    })
    y_payback = payback_years_target

    X_train_pb, X_test_pb, y_train_pb, y_test_pb = train_test_split(
        X_payback, y_payback, test_size=0.20, random_state=42
    )

    payback_scaler = StandardScaler()
    X_train_pb_scaled = payback_scaler.fit_transform(X_train_pb)
    X_test_pb_scaled = payback_scaler.transform(X_test_pb)

    payback_model = GradientBoostingRegressor(n_estimators=120, learning_rate=0.08, max_depth=5, random_state=42)
    payback_model.fit(X_train_pb_scaled, y_train_pb)

    y_pred_pb = payback_model.predict(X_test_pb_scaled)
    mae_pb = mean_absolute_error(y_test_pb, y_pred_pb)
    rmse_pb = np.sqrt(mean_squared_error(y_test_pb, y_pred_pb))
    r2_pb = r2_score(y_test_pb, y_pred_pb)

    print(f"   - Payback MAE: {mae_pb:.2f} years | RMSE: {rmse_pb:.2f} years | R²: {r2_pb:.4f}")

    # ===================================================================
    # 6. INVESTMENT RISK CATEGORY CLASSIFIER (RandomForestClassifier)
    # ===================================================================
    print("\n[6/7] Training Investment Risk Classifier (RandomForestClassifier)...")
    risk_labels = []
    for pb, suit in zip(payback_years_target, res_score):
        if pb <= 6.5 and suit >= 75.0:
            risk_labels.append("LOW")
        elif pb <= 9.5 or suit >= 60.0:
            risk_labels.append("MEDIUM")
        else:
            risk_labels.append("HIGH")

    X_risk = X_payback.copy()
    y_risk = np.array(risk_labels)

    X_train_risk, X_test_risk, y_train_risk, y_test_risk = train_test_split(
        X_risk, y_risk, test_size=0.20, random_state=42, stratify=y_risk
    )

    risk_scaler = StandardScaler()
    X_train_risk_scaled = risk_scaler.fit_transform(X_train_risk)
    X_test_risk_scaled = risk_scaler.transform(X_test_risk)

    risk_model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    risk_model.fit(X_train_risk_scaled, y_train_risk)

    y_pred_risk = risk_model.predict(X_test_risk_scaled)
    acc_risk = accuracy_score(y_test_risk, y_pred_risk)
    prec_risk = precision_score(y_test_risk, y_pred_risk, average='weighted')
    rec_risk = recall_score(y_test_risk, y_pred_risk, average='weighted')
    f1_risk = f1_score(y_test_risk, y_pred_risk, average='weighted')

    print(f"   - Risk Acc:   {acc_risk*100:.2f}% | Prec: {prec_risk*100:.2f}% | F1: {f1_risk*100:.2f}%")

    # ===================================================================
    # 7. TECHNOLOGY RECOMMENDATION CLASSIFIER (RandomForestClassifier)
    # ===================================================================
    print("\n[7/7] Training Technology Recommendation Classifier (RandomForestClassifier)...")
    tech_labels = []
    for g, w in zip(ghi, wind_speed):
        if g >= 1950.0 and w < 6.5:
            tech_labels.append("SOLAR")
        elif w >= 7.5 and g < 1850.0:
            tech_labels.append("WIND")
        else:
            tech_labels.append("HYBRID")

    X_tech = pd.DataFrame({
        'ghi': ghi, 'wind_speed': wind_speed, 'wind_power_density': wpd,
        'suitability_score': res_score, 'solar_generation_mwh': annual_solar_gen,
        'wind_generation_mwh': annual_wind_gen_mwh, 'revenue_usd': ann_rev_usd,
        'capacity_factor_pct': capacity_factor, 'infrastructure_score': infra_score,
        'environmental_score': env_score
    })
    y_tech = np.array(tech_labels)

    X_train_tech, X_test_tech, y_train_tech, y_test_tech = train_test_split(
        X_tech, y_tech, test_size=0.20, random_state=42, stratify=y_tech
    )

    tech_scaler = StandardScaler()
    X_train_tech_scaled = tech_scaler.fit_transform(X_train_tech)
    X_test_tech_scaled = tech_scaler.transform(X_test_tech)

    tech_model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    tech_model.fit(X_train_tech_scaled, y_train_tech)

    y_pred_tech = tech_model.predict(X_test_tech_scaled)
    acc_tech = accuracy_score(y_test_tech, y_pred_tech)
    prec_tech = precision_score(y_test_tech, y_pred_tech, average='weighted')
    rec_tech = recall_score(y_test_tech, y_pred_tech, average='weighted')
    f1_tech = f1_score(y_test_tech, y_pred_tech, average='weighted')

    print(f"   - Tech Acc:   {acc_tech*100:.2f}% | Prec: {prec_tech*100:.2f}% | F1: {f1_tech*100:.2f}%")

    # ===================================================================
    # EXPORT ALL 7 MODELS AND SCALERS TO SINGLE JOB_LIB ARTIFACT
    # ===================================================================
    print("\n[Export] Saving All Phase 1 + Phase 2 Model Artifacts via joblib...")
    artifacts = {
        # Models & Scalers
        "solar_model": solar_model, "solar_scaler": solar_scaler,
        "suitability_model": suitability_model, "suitability_scaler": suit_scaler,
        "wind_model": wind_model, "wind_scaler": wind_scaler,
        "forecast_model": forecast_model, "forecast_scaler": forecast_scaler,
        "payback_model": payback_model, "payback_scaler": payback_scaler,
        "risk_model": risk_model, "risk_scaler": risk_scaler,
        "tech_model": tech_model, "tech_scaler": tech_scaler,
        # Classes
        "suitability_classes": list(suitability_model.classes_),
        "risk_classes": list(risk_model.classes_),
        "tech_classes": list(tech_model.classes_),
        # Metrics
        "solar_metrics": {"mae": float(round(mae_sol, 2)), "rmse": float(round(rmse_sol, 2)), "r2": float(round(r2_sol, 4))},
        "suitability_metrics": {"accuracy": float(round(acc_suit, 4)), "precision": float(round(prec_suit, 4)), "recall": float(round(rec_suit, 4)), "f1_score": float(round(f1_suit, 4))},
        "wind_metrics": {"mae": float(round(mae_wnd, 2)), "rmse": float(round(rmse_wnd, 2)), "r2": float(round(r2_wnd, 4))},
        "forecast_metrics": {"mae": float(round(mae_fc, 2)), "rmse": float(round(rmse_fc, 2)), "r2": float(round(r2_fc, 4))},
        "payback_metrics": {"mae": float(round(mae_pb, 2)), "rmse": float(round(rmse_pb, 2)), "r2": float(round(r2_pb, 4))},
        "risk_metrics": {"accuracy": float(round(acc_risk, 4)), "precision": float(round(prec_risk, 4)), "recall": float(round(rec_risk, 4)), "f1_score": float(round(f1_risk, 4))},
        "tech_metrics": {"accuracy": float(round(acc_tech, 4)), "precision": float(round(prec_tech, 4)), "recall": float(round(rec_tech, 4)), "f1_score": float(round(f1_tech, 4))},
        # Metadata
        "model_version": "2.0.0",
        "dataset_source": "5,000-sample synthetic development dataset calibrated using renewable-energy physical relationships"
    }

    model_path = os.path.join(models_dir, "solar_wind_ml_artifacts.joblib")
    joblib.dump(artifacts, model_path)
    print(f"   Artifact successfully saved to: {model_path}")
    print("=" * 75)

if __name__ == "__main__":
    train_and_save_models()
