"""
Automated Test Suite for AI/ML Intelligence Layer (Phase 1 + Phase 2)
Tests:
- Model artifact loading & persistence
- Dataset source metadata verification (no misleading NREL/NASA claims)
- Solar Energy Prediction (GradientBoostingRegressor) & residual-based prediction intervals
- Site Suitability Classification (RandomForestClassifier) & Class Probabilities
- Explainable Composite Heuristic Candidate Ranking
- Wind Energy Prediction (RandomForestRegressor)
- Energy Generation Forecasting (GradientBoostingRegressor)
- Investment Payback & Risk Category Prediction (GradientBoostingRegressor & RandomForestClassifier)
- Technology Recommendation (RandomForestClassifier)
"""

import os
import sys
import unittest

# Ensure backend path is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.ml_service import (
    get_ml_manager,
    predict_solar_energy_ml,
    predict_site_suitability_ml,
    rank_candidate_sites_ml,
    predict_wind_energy_ml,
    forecast_energy_ml,
    predict_payback_ml,
    predict_investment_risk_ml,
    recommend_technology_ml,
)

class TestMLEngine(unittest.TestCase):

    def test_01_ml_artifacts_loading(self):
        """Verify that model artifacts load cleanly into memory via joblib."""
        manager = get_ml_manager()
        self.assertIsNotNone(manager.artifacts)
        self.assertIn("solar_model", manager.artifacts)
        self.assertIn("suitability_model", manager.artifacts)
        self.assertIn("wind_model", manager.artifacts)
        self.assertIn("forecast_model", manager.artifacts)
        self.assertIn("payback_model", manager.artifacts)
        self.assertIn("risk_model", manager.artifacts)
        self.assertIn("tech_model", manager.artifacts)
        self.assertGreater(manager.artifacts["solar_metrics"]["r2"], 0.90)
        self.assertGreater(manager.artifacts["suitability_metrics"]["accuracy"], 0.80)

    def test_02_dataset_source_metadata_accuracy(self):
        """Ensure dataset_source does NOT contain misleading NREL or NASA file claims."""
        manager = get_ml_manager()
        dataset_source = manager.artifacts.get("dataset_source", "")
        self.assertNotIn("NREL", dataset_source, "Dataset source metadata must not claim NREL file usage")
        self.assertNotIn("NASA POWER", dataset_source, "Dataset source metadata must not claim NASA POWER file usage")
        self.assertIn("synthetic development dataset", dataset_source.lower())

    def test_03_solar_energy_ml_prediction_and_interval(self):
        """Test GradientBoostingRegressor solar energy prediction & residual-based interval calculation."""
        res = predict_solar_energy_ml(
            ghi=2150.0, dni=2300.0, temperature=25.0, elevation=650.0,
            slope=2.0, latitude=23.25, longitude=77.41, installed_capacity_mw=10.0,
        )

        self.assertTrue(res["is_ml_prediction"])
        self.assertEqual(res["unit"], "MWh/year")
        self.assertGreater(res["prediction_annual_mwh"], 1000.0)
        self.assertIn("prediction_interval", res)
        self.assertIn("interval_type", res["prediction_interval"])
        self.assertIn("Residual-based 95% Prediction Interval", res["prediction_interval"]["interval_type"])
        self.assertNotIn("confidence_level", res["prediction_interval"])
        self.assertLessEqual(res["prediction_interval"]["lower_bound_mwh"], res["prediction_annual_mwh"])
        self.assertGreaterEqual(res["prediction_interval"]["upper_bound_mwh"], res["prediction_annual_mwh"])

    def test_04_site_suitability_ml_classification(self):
        """Test RandomForestClassifier site suitability classification & probabilities."""
        res_high = predict_site_suitability_ml(
            renewable_resource_score=90.0, geographic_score=85.0, infrastructure_score=80.0,
            environmental_score=85.0, economic_score=80.0, slope=2.0, elevation=500.0,
            grid_distance_km=3.0, road_distance_km=1.0,
        )

        self.assertTrue(res_high["is_ml_prediction"])
        self.assertIn(res_high["prediction_category"], ["EXCELLENT", "GOOD"])
        self.assertIn("class_probabilities", res_high)
        self.assertAlmostEqual(sum(res_high["class_probabilities"].values()), 1.0, places=3)

    def test_05_multi_site_candidate_ranking(self):
        """Test Explainable Composite Heuristic Site Ranker."""
        candidate_sites = [
            {
                "site_id": "site-001", "site_name": "Site Alpha (High Grid Proximity)",
                "overall_score": 88.5, "renewable_resource_score": 90.0,
                "expected_generation_mwh": 25000.0, "economic_score": 85.0,
                "grid_distance_km": 2.5, "road_distance_km": 1.0,
            },
            {
                "site_id": "site-002", "site_name": "Site Beta (Remote Location)",
                "overall_score": 52.0, "renewable_resource_score": 55.0,
                "expected_generation_mwh": 11000.0, "economic_score": 45.0,
                "grid_distance_km": 35.0, "road_distance_km": 20.0,
            },
        ]

        ranked = rank_candidate_sites_ml(candidate_sites)
        self.assertEqual(len(ranked), 2)
        self.assertEqual(ranked[0]["rank"], 1)
        self.assertEqual(ranked[0]["site_id"], "site-001")

    def test_06_wind_energy_ml_prediction(self):
        """Test RandomForestRegressor wind energy prediction & interval."""
        res = predict_wind_energy_ml(
            mean_wind_speed=8.5, wind_power_density=350.0, air_density=1.225,
            elevation=500.0, latitude=23.25, longitude=77.41, rotor_area=12469.0,
            turbine_rating_mw=3.5, num_turbines=10, capacity_factor_pct=38.0,
        )

        self.assertTrue(res["is_ml_prediction"])
        self.assertEqual(res["unit"], "MWh/year")
        self.assertGreater(res["prediction_annual_mwh"], 5000.0)
        self.assertIn("prediction_interval", res)
        self.assertIn("Residual-based 95% Prediction Interval", res["prediction_interval"]["interval_type"])

    def test_07_energy_forecast_ml(self):
        """Test GradientBoostingRegressor monthly energy forecasting."""
        res = forecast_energy_ml(
            month=7, historical_generation_mwh=4000.0, solar_generation_mwh=2500.0,
            wind_generation_mwh=1500.0, irradiance=2200.0, wind_speed=8.0,
            temperature=28.0, degradation_year=3, installed_capacity_mw=20.0,
        )

        self.assertTrue(res["is_ml_prediction"])
        self.assertEqual(res["unit"], "MWh/month")
        self.assertEqual(res["month"], 7)
        self.assertGreater(res["prediction_monthly_mwh"], 100.0)

    def test_08_investment_payback_and_risk_ml(self):
        """Test financial payback regression and investment risk classification."""
        payback = predict_payback_ml(
            installed_capacity_mw=15.0, expected_annual_generation_mwh=32000.0,
            capex_usd=14000000.0, annual_revenue_usd=2080000.0, om_cost_usd=250000.0,
            electricity_tariff_usd_mwh=65.0, technology="HYBRID",
            capacity_factor_pct=31.0, site_suitability_score=85.0,
        )
        self.assertTrue(payback["is_ml_prediction"])
        self.assertGreater(payback["predicted_payback_years"], 2.0)

        risk = predict_investment_risk_ml(
            installed_capacity_mw=15.0, expected_annual_generation_mwh=32000.0,
            capex_usd=14000000.0, annual_revenue_usd=2080000.0, om_cost_usd=250000.0,
            electricity_tariff_usd_mwh=65.0, technology="HYBRID",
            capacity_factor_pct=31.0, site_suitability_score=85.0,
        )
        self.assertTrue(risk["is_ml_prediction"])
        self.assertIn(risk["prediction_risk_category"], ["LOW", "MEDIUM", "HIGH"])
        self.assertIn("class_probabilities", risk)

    def test_09_technology_recommendation_ml(self):
        """Test RandomForestClassifier technology recommendation (SOLAR, WIND, HYBRID)."""
        rec_solar = recommend_technology_ml(
            ghi=2400.0, wind_speed=4.5, wind_power_density=120.0,
            suitability_score=88.0, solar_generation_mwh=25000.0,
            wind_generation_mwh=5000.0, revenue_usd=1850000.0,
            capacity_factor_pct=26.0, infrastructure_score=80.0,
            environmental_score=90.0,
        )
        self.assertTrue(rec_solar["is_ml_prediction"])
        self.assertIn(rec_solar["recommended_technology"], ["SOLAR", "WIND", "HYBRID"])
        self.assertIn("class_probabilities", rec_solar)

if __name__ == "__main__":
    unittest.main()
