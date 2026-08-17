"""
Wind Calculation Service — Dedicated Test Suite
================================================
Tests the deterministic wind calculation formulas for:
  1. Correctness of Wind Power Density (WPD = 0.5 × rho × v³)
  2. Capacity Factor always in [0, 100] %
  3. AEP always <= nameplate × operating_hours
  4. AEP always >= 0
  5. Edge case: v=0 (no wind)
  6. Edge case: very high v=28.3 m/s (previously caused DB overflow)
  7. IEC turbine classification thresholds
  8. Input guard: negative wind speed raises ValueError
"""
import sys
import os
import math
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.wind_calculation_service import (
    calculate_wind_power_performance,
    calculate_deterministic_wind_output,
)

# Turbine defaults used throughout
NUM_TURBINES = 5
TURBINE_RATING_MW = 3.0
ROTOR_DIAMETER_M = 126.0
AIR_DENSITY = 1.225
TURBINE_EFF_PCT = 45.0
OPERATING_HOURS = 8760.0

# Nameplate maximum AEP
MAX_AEP_MWH = NUM_TURBINES * TURBINE_RATING_MW * OPERATING_HOURS   # 131,400 MWh


class WindCalculationUnitTests(unittest.TestCase):

    # ------------------------------------------------------------------
    # Helper
    # ------------------------------------------------------------------
    def _calc(self, v):
        return calculate_wind_power_performance(
            wind_speed_m_s=v,
            air_density_kg_m3=AIR_DENSITY,
            turbine_efficiency_pct=TURBINE_EFF_PCT,
            rotor_diameter_m=ROTOR_DIAMETER_M,
            num_turbines=NUM_TURBINES,
            operating_hours_yr=OPERATING_HOURS,
            turbine_rating_mw=TURBINE_RATING_MW,
        )

    def _assert_bounds(self, res, label):
        """Assert that CF and AEP are physically valid."""
        cf = res["capacity_factor"]
        aep = res["expected_annual_energy_production"]
        self.assertGreaterEqual(cf, 0.0,  f"[{label}] CF={cf} is negative")
        self.assertLessEqual(cf, 100.0,   f"[{label}] CF={cf}% exceeds 100%")
        self.assertGreaterEqual(aep, 0.0, f"[{label}] AEP={aep} is negative")
        self.assertLessEqual(aep, MAX_AEP_MWH,
                             f"[{label}] AEP={aep} MWh exceeds nameplate max {MAX_AEP_MWH} MWh")

    # ------------------------------------------------------------------
    # 1. WPD formula: P/A = 0.5 × rho × v³
    # ------------------------------------------------------------------
    def test_01_wpd_formula_v7_5(self):
        """WPD at 7.5 m/s should equal 0.5 * 1.225 * 7.5^3 = 258.40 W/m²."""
        res = self._calc(7.5)
        expected = round(0.5 * AIR_DENSITY * (7.5 ** 3), 2)
        self.assertEqual(res["wind_power_density"], expected,
                         f"WPD mismatch at 7.5 m/s: got {res['wind_power_density']}, expected {expected}")

    def test_02_wpd_formula_v10(self):
        """WPD at 10 m/s should equal 0.5 * 1.225 * 10^3 = 612.50 W/m²."""
        res = self._calc(10.0)
        expected = round(0.5 * AIR_DENSITY * (10.0 ** 3), 2)
        self.assertEqual(res["wind_power_density"], expected)

    def test_03_wpd_formula_v28_3(self):
        """WPD at 28.3 m/s (bug-triggering speed) must equal 0.5*1.225*28.3^3 = 13882.43."""
        res = self._calc(28.3)
        expected = round(0.5 * AIR_DENSITY * (28.3 ** 3), 2)
        self.assertEqual(res["wind_power_density"], expected,
                         f"WPD mismatch at 28.3 m/s: got {res['wind_power_density']}, expected {expected}")
        # Confirm the value is what was reported in the bug
        self.assertEqual(res["wind_power_density"], 13882.43)

    # ------------------------------------------------------------------
    # 2. Capacity Factor bounds for all test wind speeds
    # ------------------------------------------------------------------
    def test_04_cf_bounds_edge_cases(self):
        """CF must be in [0, 100] for all physically meaningful wind speeds."""
        for v in [0, 5, 10, 15, 25, 28.3]:
            res = self._calc(v)
            self._assert_bounds(res, f"v={v}")

    def test_05_cf_at_v0(self):
        """CF at wind speed 0 must be 0%."""
        res = self._calc(0)
        self.assertEqual(res["capacity_factor"], 0.0,
                         "CF at v=0 should be 0%")
        self.assertEqual(res["expected_annual_energy_production"], 0.0,
                         "AEP at v=0 should be 0 MWh")

    def test_06_cf_capped_at_high_wind(self):
        """At very high wind speed (28.3 m/s), CF must be exactly 100% (nameplate capped)."""
        res = self._calc(28.3)
        # At 28.3 m/s, aerodynamic power far exceeds nameplate → capped at 100%
        self.assertEqual(res["capacity_factor"], 100.0,
                         f"Expected CF=100% at 28.3 m/s (nameplate-capped), got {res['capacity_factor']}%")

    def test_07_aep_capped_at_nameplate(self):
        """AEP at 28.3 m/s must equal nameplate × 8760 = 131,400 MWh (fully capped)."""
        res = self._calc(28.3)
        self.assertEqual(res["expected_annual_energy_production"], MAX_AEP_MWH,
                         f"Expected AEP={MAX_AEP_MWH} MWh (nameplate max), got {res['expected_annual_energy_production']}")

    def test_08_aep_increases_with_wind_speed(self):
        """AEP should increase as wind speed increases (until capped at nameplate)."""
        aeps = [self._calc(v)["expected_annual_energy_production"] for v in [0, 5, 7.5, 10, 15]]
        for i in range(1, len(aeps)):
            self.assertGreaterEqual(aeps[i], aeps[i - 1],
                                    f"AEP did not increase from v={[0,5,7.5,10,15][i-1]} to v={[0,5,7.5,10,15][i]}")

    # ------------------------------------------------------------------
    # 3. AEP absolute bounds
    # ------------------------------------------------------------------
    def test_09_aep_never_negative(self):
        """AEP must never be negative for any non-negative wind speed."""
        for v in [0, 0.1, 1.0, 5, 10, 15, 20, 25, 28.3, 50]:
            res = self._calc(v)
            self.assertGreaterEqual(res["expected_annual_energy_production"], 0.0,
                                    f"AEP negative at v={v}: {res['expected_annual_energy_production']}")

    def test_10_aep_never_exceeds_nameplate(self):
        """AEP must never exceed nameplate capacity × 8760 for any wind speed."""
        for v in [0, 5, 10, 15, 20, 25, 28.3, 50, 100]:
            res = self._calc(v)
            self.assertLessEqual(res["expected_annual_energy_production"], MAX_AEP_MWH,
                                 f"AEP exceeded nameplate max at v={v}: {res['expected_annual_energy_production']} > {MAX_AEP_MWH}")

    # ------------------------------------------------------------------
    # 4. IEC Turbine Classification
    # ------------------------------------------------------------------
    def test_11_iec_class_i_high_wind(self):
        """v >= 10.0 m/s → IEC Class I."""
        res = self._calc(10.0)
        self.assertIn("Class I", res["turbine_suitability"])

    def test_12_iec_class_ii_medium_wind(self):
        """8.5 <= v < 10.0 m/s → IEC Class II."""
        res = self._calc(9.0)
        self.assertIn("Class II", res["turbine_suitability"])

    def test_13_iec_class_iii_low_wind(self):
        """7.5 <= v < 8.5 m/s → IEC Class III."""
        res = self._calc(8.0)
        self.assertIn("Class III", res["turbine_suitability"])

    def test_14_iec_class_iv_marginal(self):
        """v < 7.5 m/s → IEC Class IV (Marginal)."""
        res = self._calc(7.0)
        self.assertIn("Class IV", res["turbine_suitability"])

    def test_15_iec_class_i_at_v28(self):
        """v=28.3 m/s is a high-wind site → IEC Class I."""
        res = self._calc(28.3)
        self.assertIn("Class I", res["turbine_suitability"])

    # ------------------------------------------------------------------
    # 5. Input guard: negative wind speed must raise ValueError
    # ------------------------------------------------------------------
    def test_16_negative_wind_speed_raises(self):
        """Negative wind speed must raise ValueError (physically impossible)."""
        with self.assertRaises(ValueError):
            calculate_wind_power_performance(wind_speed_m_s=-1.0)

    # ------------------------------------------------------------------
    # 6. Backward-compat alias
    # ------------------------------------------------------------------
    def test_17_alias_backward_compat(self):
        """calculate_deterministic_wind_output must expose legacy key names."""
        res = calculate_deterministic_wind_output(
            wind_speed_m_s=7.5,
            air_density_kg_m3=AIR_DENSITY,
            num_turbines=NUM_TURBINES,
            turbine_rating_mw=TURBINE_RATING_MW,
        )
        self.assertIn("wind_power_density_w_m2", res)
        self.assertIn("expected_annual_energy_kwh", res)
        self.assertIn("installed_capacity_mw", res)
        self.assertEqual(res["installed_capacity_mw"], NUM_TURBINES * TURBINE_RATING_MW)
        expected_wpd = round(0.5 * AIR_DENSITY * (7.5 ** 3), 2)
        self.assertEqual(res["wind_power_density_w_m2"], expected_wpd)

    # ------------------------------------------------------------------
    # 7. Output keys completeness
    # ------------------------------------------------------------------
    def test_18_output_keys_present(self):
        """Result dict must contain all required keys."""
        res = self._calc(7.5)
        required_keys = [
            "average_wind_speed",
            "wind_power_density",
            "capacity_factor",
            "expected_annual_energy_production",
            "turbine_suitability",
            "assumptions",
        ]
        for key in required_keys:
            self.assertIn(key, res, f"Missing key: {key}")

    # ------------------------------------------------------------------
    # 8. Regression: 28.3 m/s must NOT produce DB-overflowing values
    # ------------------------------------------------------------------
    def test_19_v28_3_db_safe_values(self):
        """
        At v=28.3 m/s (the bug input):
          - WPD = 13882.43  (fits in NUMERIC(10,2): max 99999999.99)
          - CF  = 100.00    (fits in NUMERIC(5,2):  max 999.99)
          - AEP = 131400.0  (fits in NUMERIC(14,2): max 999999999999.99)
        All values must fit in the database column types defined in
        backend/app/models/wind_assessment.py.
        """
        res = self._calc(28.3)
        wpd = res["wind_power_density"]
        cf  = res["capacity_factor"]
        aep = res["expected_annual_energy_production"]

        # NUMERIC(10,2): 8 integer digits + 2 decimal → max 99999999.99
        self.assertLessEqual(wpd, 99_999_999.99,
                             f"WPD {wpd} would overflow NUMERIC(10,2)")
        # NUMERIC(5,2): 3 integer digits + 2 decimal → max 999.99
        self.assertLessEqual(cf, 999.99,
                             f"CF {cf} would overflow NUMERIC(5,2)")
        # NUMERIC(14,2): 12 integer digits + 2 decimal → max 999999999999.99
        self.assertLessEqual(aep, 999_999_999_999.99,
                             f"AEP {aep} would overflow NUMERIC(14,2)")


if __name__ == "__main__":
    print("=" * 70)
    print("WIND CALCULATION SERVICE — DEDICATED TEST SUITE")
    print("=" * 70)
    unittest.main(verbosity=2)
