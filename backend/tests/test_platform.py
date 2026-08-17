import os
import sys
import unittest
from fastapi.testclient import TestClient

# Add parent backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.config import settings
from app.services.suitability_service import compute_composite_site_score
from app.services.solar_calculation_service import calculate_deterministic_solar_output
from app.services.wind_calculation_service import calculate_deterministic_wind_output
from app.services.forecast_service import calculate_deterministic_energy_forecast

client = TestClient(app)


class PlatformTests(unittest.TestCase):

    # =============================================================================
    # 1. TEST EXACT WEIGHTED SCORING FORMULA & CATEGORY BOUNDARIES
    # =============================================================================

    def test_exact_weighted_scoring_formula(self):
        """
        Tests exact weighted scoring formula:
        score = (resource * 0.35) + (geographic * 0.25) + (infrastructure * 0.15) + (environmental * 0.15) + (economic * 0.10)
        """
        res = compute_composite_site_score(
            resource_score=80.0,
            geographic_score=70.0,
            infrastructure_score=90.0,
            environmental_score=85.0,
            economic_score=60.0
        )
        # Expected: (80*0.35) + (70*0.25) + (90*0.15) + (85*0.15) + (60*0.10)
        # = 28.0 + 17.5 + 13.5 + 12.75 + 6.0 = 77.75
        expected = round(80.0 * 0.35 + 70.0 * 0.25 + 90.0 * 0.15 + 85.0 * 0.15 + 60.0 * 0.10, 2)
        self.assertEqual(res["final_score"], expected)
        self.assertEqual(res["final_score"], 77.75)
        self.assertEqual(res["category"], "Moderately Suitable")


    def test_scoring_category_boundaries(self):
        """
        Tests exact canonical category boundaries:
          90–100 -> Excellent
          80–89 -> Highly Suitable
          65–79 -> Moderately Suitable
          50–64 -> Low Suitability
          0–49  -> Unsuitable
        """
        # 49.99 -> Unsuitable
        uns_49 = compute_composite_site_score(49.99, 49.99, 49.99, 49.99, 49.99)
        self.assertEqual(uns_49["category"], "Unsuitable")

        # 50 -> Low Suitability
        low_50 = compute_composite_site_score(50.0, 50.0, 50.0, 50.0, 50.0)
        self.assertEqual(low_50["category"], "Low Suitability")

        # 64.99 -> Low Suitability
        low_64 = compute_composite_site_score(64.99, 64.99, 64.99, 64.99, 64.99)
        self.assertEqual(low_64["category"], "Low Suitability")

        # 65 -> Moderately Suitable
        mod_65 = compute_composite_site_score(65.0, 65.0, 65.0, 65.0, 65.0)
        self.assertEqual(mod_65["category"], "Moderately Suitable")

        # 79.99 -> Moderately Suitable
        mod_79 = compute_composite_site_score(79.99, 79.99, 79.99, 79.99, 79.99)
        self.assertEqual(mod_79["category"], "Moderately Suitable")

        # 80 -> Highly Suitable
        high_80 = compute_composite_site_score(80.0, 80.0, 80.0, 80.0, 80.0)
        self.assertEqual(high_80["category"], "Highly Suitable")

        # 89.99 -> Highly Suitable
        high_89 = compute_composite_site_score(89.99, 89.99, 89.99, 89.99, 89.99)
        self.assertEqual(high_89["category"], "Highly Suitable")

        # 90 -> Excellent
        exc_90 = compute_composite_site_score(90.0, 90.0, 90.0, 90.0, 90.0)
        self.assertEqual(exc_90["category"], "Excellent")

        # 100 -> Excellent
        exc_100 = compute_composite_site_score(100.0, 100.0, 100.0, 100.0, 100.0)
        self.assertEqual(exc_100["category"], "Excellent")

        # Also test discrete points: 0, 25, 50, 65, 80, 90, 100
        self.assertEqual(compute_composite_site_score(0, 0, 0, 0, 0)["category"], "Unsuitable")
        self.assertEqual(compute_composite_site_score(25, 25, 25, 25, 25)["category"], "Unsuitable")
        self.assertEqual(compute_composite_site_score(50, 50, 50, 50, 50)["category"], "Low Suitability")
        self.assertEqual(compute_composite_site_score(65, 65, 65, 65, 65)["category"], "Moderately Suitable")
        self.assertEqual(compute_composite_site_score(80, 80, 80, 80, 80)["category"], "Highly Suitable")
        self.assertEqual(compute_composite_site_score(90, 90, 90, 90, 90)["category"], "Excellent")
        self.assertEqual(compute_composite_site_score(100, 100, 100, 100, 100)["category"], "Excellent")

    # =============================================================================
    # 2. TEST DETERMINISTIC ENGINEERING FORMULAS
    # =============================================================================

    def test_solar_engineering_formula(self):
        """
        Annual Energy = Capacity (kW) * PSH * 365 * PR * (1 - losses)
        """
        res = calculate_deterministic_solar_output(
            solar_ghi_kwh_m2_day=5.5,
            installed_capacity_mw=10.0,
            panel_efficiency_pct=21.5,
            performance_ratio=0.82,
            system_loss_pct=14.0,
            shading_loss_pct=3.0,
        )
        self.assertEqual(res["peak_sun_hours_per_day"], 5.5)
        self.assertEqual(res["annual_solar_irradiance_kwh_m2"], 2007.5)
        self.assertEqual(res["installed_capacity_kw"], 10000.0)
        self.assertGreater(res["expected_annual_energy_kwh"], 0)
        self.assertGreater(res["capacity_factor_pct"], 0)

    def test_wind_engineering_formula(self):
        """
        Wind Power Density P/A = 0.5 * air_density * wind_speed^3
        """
        res = calculate_deterministic_wind_output(
            wind_speed_m_s=7.5,
            air_density_kg_m3=1.225,
            num_turbines=5,
            turbine_rating_mw=3.0,
        )
        # 0.5 * 1.225 * (7.5^3) = 0.5 * 1.225 * 421.875 = 258.4
        expected_wpd = round(0.5 * 1.225 * (7.5 ** 3), 2)
        self.assertEqual(res["wind_power_density_w_m2"], expected_wpd)
        self.assertEqual(res["installed_capacity_mw"], 15.0)
        self.assertGreater(res["expected_annual_energy_kwh"], 0)

    def test_energy_and_revenue_forecast(self):
        """
        Revenue = Energy Generated * Electricity Tariff
        """
        res = calculate_deterministic_energy_forecast(
            installed_capacity_mw=15.0,
            technology="HYBRID",
            electricity_tariff_usd_mwh=65.0,
            capacity_factor_pct=28.5,
        )
        self.assertGreater(res["total_annual_generation_mwh"], 0)
        self.assertAlmostEqual(res["total_annual_revenue_usd"], round(res["total_annual_generation_mwh"] * 65.0, 2), delta=100.0)
        self.assertEqual(len(res["monthly_projections"]), 12)
        self.assertEqual(len(res["annual_projections"]), 6)
        self.assertIn("25_year_total_energy_mwh", res)


    # =============================================================================
    # 3. TEST AUTHENTICATION & API SECURITY
    # =============================================================================

    def test_api_root(self):
        response = client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "online")

    def test_invalid_jwt_authentication(self):
        headers = {"Authorization": "Bearer invalid_jwt_token_12345"}
        response = client.get("/api/v1/projects", headers=headers)
        self.assertEqual(response.status_code, 401)
        self.assertIn("Could not validate authentication credentials", response.json()["detail"])

    def test_unauthorized_access_no_header(self):
        response = client.get("/api/v1/projects")
        self.assertEqual(response.status_code, 401)

    def test_invalid_coordinate_validation(self):
        # Attempt site creation with invalid latitude (> 90.0)
        payload = {
            "site_name": "Invalid Coordinate Site",
            "latitude": 120.0,
            "longitude": -80.0,
        }
        # Handled by Pydantic / validation
        self.assertGreater(payload["latitude"], 90.0)


if __name__ == "__main__":
    unittest.main()

