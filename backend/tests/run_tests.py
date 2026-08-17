import sys
import os
import unittest

# Add parent backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.services.suitability_service import compute_composite_site_score
from app.services.solar_calculation_service import calculate_solar_pv_performance
from app.services.wind_calculation_service import calculate_wind_power_performance
from app.services.forecast_service import calculate_deterministic_energy_forecast


class PlatformBackendTests(unittest.TestCase):

    def test_01_exact_weighted_scoring_formula(self):
        """Test exact weighted scoring formula: (resource*0.35)+(geo*0.25)+(infra*0.15)+(env*0.15)+(econ*0.10)"""
        res = compute_composite_site_score(
            resource_score=80.0,
            geographic_score=70.0,
            infrastructure_score=90.0,
            environmental_score=85.0,
            economic_score=60.0
        )
        expected = round(80.0 * 0.35 + 70.0 * 0.25 + 90.0 * 0.15 + 85.0 * 0.15 + 60.0 * 0.10, 2)
        self.assertEqual(res["final_score"], expected)
        self.assertEqual(res["final_score"], 77.75)
        self.assertEqual(res["category"], "Moderately Suitable")

    def test_02_scoring_category_boundaries(self):
        """Test score category boundaries: 90-100 Excellent, 80-89 Highly Suitable, 65-79 Moderately Suitable, 50-64 Low Suitability, 0-49 Unsuitable."""
        self.assertEqual(compute_composite_site_score(49.99, 49.99, 49.99, 49.99, 49.99)["category"], "Unsuitable")
        self.assertEqual(compute_composite_site_score(50.0, 50.0, 50.0, 50.0, 50.0)["category"], "Low Suitability")
        self.assertEqual(compute_composite_site_score(64.99, 64.99, 64.99, 64.99, 64.99)["category"], "Low Suitability")
        self.assertEqual(compute_composite_site_score(65.0, 65.0, 65.0, 65.0, 65.0)["category"], "Moderately Suitable")
        self.assertEqual(compute_composite_site_score(79.99, 79.99, 79.99, 79.99, 79.99)["category"], "Moderately Suitable")
        self.assertEqual(compute_composite_site_score(80.0, 80.0, 80.0, 80.0, 80.0)["category"], "Highly Suitable")
        self.assertEqual(compute_composite_site_score(89.99, 89.99, 89.99, 89.99, 89.99)["category"], "Highly Suitable")
        self.assertEqual(compute_composite_site_score(90.0, 90.0, 90.0, 90.0, 90.0)["category"], "Excellent")
        self.assertEqual(compute_composite_site_score(100.0, 100.0, 100.0, 100.0, 100.0)["category"], "Excellent")

        # Discrete points
        self.assertEqual(compute_composite_site_score(0, 0, 0, 0, 0)["category"], "Unsuitable")
        self.assertEqual(compute_composite_site_score(25, 25, 25, 25, 25)["category"], "Unsuitable")
        self.assertEqual(compute_composite_site_score(50, 50, 50, 50, 50)["category"], "Low Suitability")
        self.assertEqual(compute_composite_site_score(65, 65, 65, 65, 65)["category"], "Moderately Suitable")
        self.assertEqual(compute_composite_site_score(80, 80, 80, 80, 80)["category"], "Highly Suitable")
        self.assertEqual(compute_composite_site_score(90, 90, 90, 90, 90)["category"], "Excellent")
        self.assertEqual(compute_composite_site_score(100, 100, 100, 100, 100)["category"], "Excellent")

    def test_03_solar_engineering_formula(self):
        """Test PV energy output equation."""
        res = calculate_solar_pv_performance(
            ghi_kwh_m2_yr=2007.5,
            installed_capacity_mw=10.0,
            panel_efficiency_pct=21.5,
            performance_ratio=0.82,
            system_loss_pct=14.0,
            shading_loss_pct=3.0,
        )
        self.assertEqual(res["peak_sun_hours"], 5.5)
        self.assertEqual(res["annual_irradiance"], 2007.5)
        self.assertGreater(res["expected_energy_output"], 0)

    def test_04_wind_engineering_formula(self):
        """Test Wind Power Density equation: P/A = 0.5 * rho * v^3.
        
        Also verifies that capacity factor is 0–100% and AEP does not
        exceed nameplate capacity × 8760 hours.
        """
        res = calculate_wind_power_performance(
            wind_speed_m_s=7.5,
            air_density_kg_m3=1.225,
            num_turbines=5,
            turbine_rating_mw=3.0,
        )
        expected_wpd = round(0.5 * 1.225 * (7.5 ** 3), 2)
        self.assertEqual(res["wind_power_density"], expected_wpd)
        # Capacity factor must be between 0 and 100
        self.assertGreaterEqual(res["capacity_factor"], 0.0)
        self.assertLessEqual(res["capacity_factor"], 100.0)
        # AEP must be positive
        self.assertGreater(res["expected_annual_energy_production"], 0.0)
        # AEP must not exceed nameplate maximum: 5 × 3 MW × 8760 h = 131,400 MWh
        max_aep = 5 * 3.0 * 8760.0
        self.assertLessEqual(res["expected_annual_energy_production"], max_aep)

        # Regression: v=28.3 m/s previously caused DB overflow with CF=2596.5%
        # Verify the fix produces bounded valid results
        res_high = calculate_wind_power_performance(
            wind_speed_m_s=28.3,
            air_density_kg_m3=1.225,
            num_turbines=5,
            turbine_rating_mw=3.0,
        )
        expected_wpd_high = round(0.5 * 1.225 * (28.3 ** 3), 2)
        self.assertEqual(res_high["wind_power_density"], expected_wpd_high)
        self.assertLessEqual(res_high["capacity_factor"], 100.0)
        self.assertGreaterEqual(res_high["capacity_factor"], 0.0)
        self.assertLessEqual(res_high["expected_annual_energy_production"], max_aep)
        self.assertGreater(res_high["expected_annual_energy_production"], 0.0)


    def test_05_revenue_and_energy_forecast(self):
        """Test Revenue = Energy * Tariff."""
        res = calculate_deterministic_energy_forecast(
            installed_capacity_mw=15.0,
            technology="HYBRID",
            electricity_tariff_usd_mwh=65.0,
            capacity_factor_pct=28.5,
        )
        expected_revenue = round(res["annual_generation_mwh"] * 65.0, 2)
        self.assertAlmostEqual(res["annual_revenue_usd"], expected_revenue, delta=100.0)
        self.assertEqual(len(res["monthly_breakdown"]), 12)
        self.assertEqual(len(res["annual_projections"]), 6)


if __name__ == "__main__":
    print("======================================================================")
    print("SOLAR & WIND PLATFORM - BACKEND UNIT & FORMULA VERIFICATION SUITE")
    print("======================================================================")
    unittest.main(verbosity=2)
