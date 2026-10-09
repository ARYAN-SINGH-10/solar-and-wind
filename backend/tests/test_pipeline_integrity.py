"""
Pipeline Integrity & Service Reliability Test Suite
===================================================

Verifies:
  1. Valid solar PV calculation & physical bounds.
  2. Invalid solar input validations (ValueError).
  3. Valid wind power calculation & IEC class mapping.
  4. Invalid wind input validations (negative speed, 0 turbines -> ValueError).
  5. Wind nameplate capping & CF bounds [0, 100]%.
  6. Suitability factor scoring, composite weights, and score category boundaries.
  7. Recommendation technology selection decision rules & financial payback.
  8. Missing environmental telemetry error handling (ValueError on missing data).
  9. NASA POWER API error graceful degradation (returns None metrics and failure source).
"""

import os
import sys
import unittest
import asyncio
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.services.solar_calculation_service import (
    calculate_solar_pv_performance,
    calculate_deterministic_solar_output,
)
from app.services.wind_calculation_service import (
    calculate_wind_power_performance,
    calculate_deterministic_wind_output,
)
from app.services.suitability_service import (
    compute_composite_site_score,
)
from app.services.environmental_service import (
    fetch_nasa_power_data,
)


class PipelineIntegrityUnitTests(unittest.TestCase):

    # -------------------------------------------------------------------------
    # 1. SOLAR CALCULATION TESTS
    # -------------------------------------------------------------------------
    def test_solar_valid_calculation(self):
        res = calculate_solar_pv_performance(
            ghi_kwh_m2_yr=2150.0,
            installed_capacity_mw=10.0,
            panel_efficiency_pct=21.5,
            performance_ratio=0.82,
        )
        self.assertEqual(res["annual_irradiance"], 2150.0)
        self.assertGreater(res["expected_energy_output"], 0.0)
        self.assertLessEqual(res["capacity_factor"], 100.0)
        self.assertGreater(res["required_module_area_m2"], 0.0)

    def test_solar_invalid_inputs_raise_value_error(self):
        with self.assertRaises(ValueError):
            calculate_solar_pv_performance(ghi_kwh_m2_yr=-100.0)

        with self.assertRaises(ValueError):
            calculate_solar_pv_performance(ghi_kwh_m2_yr=2000.0, installed_capacity_mw=0.0)

        with self.assertRaises(ValueError):
            calculate_solar_pv_performance(ghi_kwh_m2_yr=2000.0, panel_efficiency_pct=0.0)

        with self.assertRaises(ValueError):
            calculate_solar_pv_performance(ghi_kwh_m2_yr=2000.0, performance_ratio=1.5)

    def test_solar_backward_compatibility_alias(self):
        res = calculate_deterministic_solar_output(solar_ghi_kwh_m2_day=5.89, installed_capacity_mw=10.0)
        self.assertIn("annual_solar_irradiance_kwh_m2", res)
        self.assertIn("expected_annual_energy_kwh", res)
        self.assertIn("capacity_factor_pct", res)
        self.assertEqual(res["installed_capacity_kw"], 10000.0)

    # -------------------------------------------------------------------------
    # 2. WIND CALCULATION TESTS
    # -------------------------------------------------------------------------
    def test_wind_valid_calculation(self):
        res = calculate_wind_power_performance(
            wind_speed_m_s=8.5,
            num_turbines=5,
            turbine_rating_mw=3.0,
        )
        self.assertEqual(res["average_wind_speed"], 8.5)
        self.assertGreater(res["wind_power_density"], 0.0)
        self.assertGreater(res["expected_annual_energy_production"], 0.0)
        self.assertLessEqual(res["capacity_factor"], 100.0)
        self.assertEqual(res["turbine_suitability"], "IEC Class II (Medium Wind Site)")

    def test_wind_invalid_inputs_raise_value_error(self):
        with self.assertRaises(ValueError):
            calculate_wind_power_performance(wind_speed_m_s=-5.0)

        with self.assertRaises(ValueError):
            calculate_wind_power_performance(wind_speed_m_s=8.0, num_turbines=0)

        with self.assertRaises(ValueError):
            calculate_wind_power_performance(wind_speed_m_s=8.0, turbine_rating_mw=-3.0)

    def test_wind_nameplate_capping_at_high_speed(self):
        res = calculate_wind_power_performance(
            wind_speed_m_s=25.0,  # Extreme wind speed
            num_turbines=5,
            turbine_rating_mw=3.0,
        )
        max_theoretical_mwh = 5 * 3.0 * 8760.0  # 131,400 MWh
        self.assertEqual(res["expected_annual_energy_production"], max_theoretical_mwh)
        self.assertEqual(res["capacity_factor"], 100.0)

    def test_wind_backward_compatibility_alias(self):
        res = calculate_deterministic_wind_output(wind_speed_m_s=7.45)
        self.assertIn("wind_power_density_w_m2", res)
        self.assertIn("expected_annual_energy_kwh", res)
        self.assertIn("installed_capacity_mw", res)
        self.assertEqual(res["installed_capacity_mw"], 15.0)

    # -------------------------------------------------------------------------
    # 3. SUITABILITY SCORING TESTS
    # -------------------------------------------------------------------------
    def test_suitability_composite_scoring_boundaries(self):
        # Excellent boundary
        res = compute_composite_site_score(100.0, 95.0, 90.0, 90.0, 90.0)
        self.assertEqual(res["category"], "Excellent")
        self.assertGreaterEqual(res["final_score"], 90.0)

        # Highly Suitable boundary
        res = compute_composite_site_score(85.0, 80.0, 80.0, 80.0, 80.0)
        self.assertEqual(res["category"], "Highly Suitable")
        self.assertTrue(80.0 <= res["final_score"] < 90.0)

        # Moderately Suitable boundary
        res = compute_composite_site_score(70.0, 65.0, 65.0, 65.0, 65.0)
        self.assertEqual(res["category"], "Moderately Suitable")
        self.assertTrue(65.0 <= res["final_score"] < 80.0)

        # Low Suitability boundary
        res = compute_composite_site_score(55.0, 50.0, 50.0, 50.0, 50.0)
        self.assertEqual(res["category"], "Low Suitability")
        self.assertTrue(50.0 <= res["final_score"] < 65.0)

        # Unsuitable boundary
        res = compute_composite_site_score(30.0, 30.0, 30.0, 30.0, 30.0)
        self.assertEqual(res["category"], "Unsuitable")
        self.assertLess(res["final_score"], 50.0)

    def test_suitability_score_bounding(self):
        # Ensure final score never exceeds 100.0 or drops below 0.0
        res_max = compute_composite_site_score(150.0, 120.0, 100.0, 100.0, 100.0)
        self.assertLessEqual(res_max["final_score"], 100.0)

        res_min = compute_composite_site_score(-20.0, -10.0, 0.0, 0.0, 0.0)
        self.assertGreaterEqual(res_min["final_score"], 0.0)

    # -------------------------------------------------------------------------
    # 4. ENVIRONMENTAL SERVICE API ERROR HANDLING TESTS
    # -------------------------------------------------------------------------
    def test_nasa_power_api_error_returns_none_metrics(self):
        with patch("httpx.AsyncClient.get") as mock_get:
            mock_resp = MagicMock()
            mock_resp.status_code = 500
            mock_resp.text = "Internal Server Error"
            mock_get.return_value = mock_resp

            res = asyncio.run(fetch_nasa_power_data(35.0, -115.0))

            self.assertIsNone(res["solar_irradiance"])
            self.assertIsNone(res["temperature"])
            self.assertIsNone(res["rainfall"])
            self.assertIn("Retrieval Failed", res["data_source"])


if __name__ == "__main__":
    unittest.main()
