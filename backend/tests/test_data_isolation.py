"""
Regression Test Suite: Strict Account-Level User Data Isolation & IDOR Protection
Verifies:
1. User A creates private projects, sites, assessments, forecasts, recommendations, reports, comparisons.
2. User B registers and initially sees clean empty states (0 projects, 0 sites, empty analytics, 0 reports).
3. User B cannot access or modify any of User A's records by tampering with IDs (IDOR protection: 404).
4. User B creates their own project and site; User B's analytics reflect only User B's data.
5. User A's data remains isolated and completely unaffected by User B's actions.
6. Administrator role preserves system-wide administrative oversight.
"""

import time
import uuid
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


ROLE_MAP = {
    "ENERGY_PLANNER": 1,
    "GIS_ANALYST": 2,
    "PROJECT_MANAGER": 3,
    "ADMINISTRATOR": 4,
}


def _register_and_login(email: str, password: str, role_name: str = "ENERGY_PLANNER") -> tuple[dict, str]:
    role_id = ROLE_MAP.get(role_name, 1)
    reg_payload = {
        "name": f"Test {role_name}",
        "email": email,
        "password": password,
        "role_id": role_id
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
    user_data = reg_res.json()

    login_res = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    return user_data, token


def test_user_data_isolation_e2e():
    ts = int(time.time() * 1000)
    user_a_email = f"user_a_{ts}@example.com"
    user_b_email = f"user_b_{ts}@example.com"
    admin_email = f"admin_{ts}@example.com"
    pwd = "SecurePassword123!"

    # 1. Register & login User A
    user_a, token_a = _register_and_login(user_a_email, pwd, "ENERGY_PLANNER")
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # User A creates Project A
    proj_a_code = f"PRJ-A-{ts % 100000}"
    proj_a_res = client.post(
        "/api/v1/projects",
        headers=headers_a,
        json={
            "project_name": f"User A Project {ts}",
            "project_code": proj_a_code,
            "target_capacity_mw": 50.0,
            "technology_type": "HYBRID",
            "region": "California",
            "status": "DRAFT"
        }
    )
    assert proj_a_res.status_code == 201, f"Failed to create Project A: {proj_a_res.text}"
    proj_a_id = proj_a_res.json()["id"]

    # User A creates Site A1 and Site A2
    site_a1_res = client.post(
        f"/api/v1/projects/{proj_a_id}/sites",
        headers=headers_a,
        json={
            "site_name": f"Site A1 Mojave {ts}",
            "latitude": 34.5,
            "longitude": -116.5,
            "elevation": 720.0,
            "land_area": 25.0,
            "region": "California",
            "technology_type": "SOLAR"
        }
    )
    assert site_a1_res.status_code == 201
    site_a1_id = site_a1_res.json()["id"]

    site_a2_res = client.post(
        f"/api/v1/projects/{proj_a_id}/sites",
        headers=headers_a,
        json={
            "site_name": f"Site A2 Tehachapi {ts}",
            "latitude": 35.1,
            "longitude": -118.4,
            "elevation": 1200.0,
            "land_area": 30.0,
            "region": "California",
            "technology_type": "WIND"
        }
    )
    assert site_a2_res.status_code == 201
    site_a2_id = site_a2_res.json()["id"]

    # User A inputs environmental observations for Site A1
    env_res = client.post(
        f"/api/v1/sites/{site_a1_id}/environmental-data/manual",
        headers=headers_a,
        json={
            "solar_irradiance": 2150.0,
            "wind_speed": 7.5,
            "temperature": 24.0,
            "elevation": 720.0,
            "land_slope": 2.5
        }
    )
    assert env_res.status_code == 200, f"Env data failed: {env_res.text}"

    # User A runs Solar and Wind assessments on Site A1
    solar_res = client.post(
        f"/api/v1/sites/{site_a1_id}/solar/analyze",
        headers=headers_a,
        json={
            "installed_capacity_mw": 20.0,
            "panel_efficiency_pct": 21.5,
            "performance_ratio": 0.82,
            "system_loss_pct": 14.0,
            "shading_loss_pct": 2.0
        }
    )
    assert solar_res.status_code == 200, f"Solar failed: {solar_res.text}"

    wind_res = client.post(
        f"/api/v1/sites/{site_a1_id}/wind/analyze",
        headers=headers_a,
        json={
            "air_density_kg_m3": 1.225,
            "turbine_efficiency_pct": 45.0,
            "rotor_diameter_m": 126.0,
            "num_turbines": 5,
            "turbine_rating_mw": 3.0
        }
    )
    assert wind_res.status_code == 200, f"Wind failed: {wind_res.text}"

    # User A runs suitability scoring on Site A1
    suit_res = client.post(
        f"/api/v1/sites/{site_a1_id}/suitability/calculate",
        headers=headers_a,
        json={}
    )
    assert suit_res.status_code == 200, f"Suitability failed: {suit_res.text}"

    # User A runs forecast on Site A1
    fc_res = client.post(
        f"/api/v1/sites/{site_a1_id}/forecast/calculate",
        headers=headers_a,
        json={
            "installed_capacity_mw": 20.0,
            "technology": "SOLAR",
            "electricity_tariff_usd_mwh": 65.0
        }
    )
    assert fc_res.status_code == 200, f"Forecast failed: {fc_res.text}"

    # User A runs optimization and recommendation on Site A1
    opt_res = client.post(f"/api/v1/sites/{site_a1_id}/optimization/run", headers=headers_a)
    assert opt_res.status_code == 200

    rec_res = client.post(f"/api/v1/sites/{site_a1_id}/recommendation/generate", headers=headers_a)
    assert rec_res.status_code == 200

    # User A generates a report for Site A1
    rep_res = client.post(
        "/api/v1/reports/site-assessment",
        headers=headers_a,
        json={"site_id": site_a1_id}
    )
    assert rep_res.status_code == 200
    report_a_id = rep_res.json()["id"]

    # User A creates a comparison between Site A1 and Site A2
    comp_res = client.post(
        "/api/v1/comparisons",
        headers=headers_a,
        json={
            "comparison_name": f"User A Mojave vs Tehachapi {ts}",
            "site_ids": [site_a1_id, site_a2_id]
        }
    )
    assert comp_res.status_code == 201
    comparison_a_id = comp_res.json()["id"]

    # -------------------------------------------------------------------------
    # 2. Register & login User B with a completely separate account
    # -------------------------------------------------------------------------
    user_b, token_b = _register_and_login(user_b_email, pwd, "ENERGY_PLANNER")
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 3. Verify User B initially sees clean, isolated empty state
    # User B projects list must be empty
    projs_b = client.get("/api/v1/projects", headers=headers_b).json()
    b_items = projs_b.get("items", projs_b) if isinstance(projs_b, dict) else projs_b
    assert len(b_items) == 0, f"User B should see 0 projects, saw {len(b_items)}"

    # User B sites list must be empty
    sites_b = client.get("/api/v1/sites", headers=headers_b).json()
    b_site_items = sites_b.get("items", sites_b) if isinstance(sites_b, dict) else sites_b
    assert len(b_site_items) == 0, f"User B should see 0 sites, saw {len(b_site_items)}"

    # User B dashboard analytics must be zeroed out
    dash_b = client.get("/api/v1/analytics/dashboard", headers=headers_b).json()
    cards_b = dash_b.get("cards", {})
    assert cards_b.get("total_projects") == 0
    assert cards_b.get("total_sites") == 0
    assert cards_b.get("expected_energy_mwh") == 0.0
    assert cards_b.get("estimated_revenue_usd") == 0.0

    # User B GIS layers must have 0 sites and empty features
    gis_b = client.get("/api/v1/analytics/gis-layers", headers=headers_b).json()
    assert len(gis_b["sites_geojson"]["features"]) == 0
    assert len(gis_b["infrastructure"]["substations"]) == 0

    # User B reports list must be empty
    reps_b = client.get("/api/v1/reports", headers=headers_b).json()
    assert len(reps_b) == 0, f"User B should see 0 reports, saw {len(reps_b)}"

    # User B comparisons list must be empty
    comps_b = client.get("/api/v1/comparisons", headers=headers_b).json()
    assert len(comps_b) == 0, f"User B should see 0 comparisons, saw {len(comps_b)}"

    # -------------------------------------------------------------------------
    # 4. Verify IDOR Prevention: User B cannot access User A's records
    # -------------------------------------------------------------------------
    # Query User A's project by ID -> 404 (or 403 for role-restricted operations)
    assert client.get(f"/api/v1/projects/{proj_a_id}", headers=headers_b).status_code == 404
    assert client.put(f"/api/v1/projects/{proj_a_id}", headers=headers_b, json={"project_name": "Tampered"}).status_code == 404
    assert client.delete(f"/api/v1/projects/{proj_a_id}", headers=headers_b).status_code in (403, 404)

    # Query User A's site by ID -> 404 (or 403 for role-restricted operations)
    assert client.get(f"/api/v1/sites/{site_a1_id}", headers=headers_b).status_code == 404
    assert client.put(f"/api/v1/sites/{site_a1_id}", headers=headers_b, json={"site_name": "Tampered"}).status_code == 404
    assert client.delete(f"/api/v1/sites/{site_a1_id}", headers=headers_b).status_code in (403, 404)

    # Attempt to run calculations on User A's site -> 404
    assert client.post(f"/api/v1/sites/{site_a1_id}/environmental-data/manual", headers=headers_b, json={"solar_irradiance": 2000.0}).status_code == 404
    assert client.post(f"/api/v1/sites/{site_a1_id}/solar/analyze", headers=headers_b, json={"installed_capacity_mw": 10.0}).status_code == 404
    assert client.post(f"/api/v1/sites/{site_a1_id}/wind/analyze", headers=headers_b, json={"num_turbines": 2}).status_code == 404
    assert client.post(f"/api/v1/sites/{site_a1_id}/suitability/calculate", headers=headers_b, json={}).status_code == 404
    assert client.post(f"/api/v1/sites/{site_a1_id}/forecast/calculate", headers=headers_b, json={"installed_capacity_mw": 10.0}).status_code == 404
    assert client.post(f"/api/v1/sites/{site_a1_id}/optimization/run", headers=headers_b).status_code == 404
    assert client.post(f"/api/v1/sites/{site_a1_id}/recommendation/generate", headers=headers_b).status_code == 404

    # Attempt to access User A's report or download it -> 404
    assert client.get(f"/api/v1/reports/{report_a_id}", headers=headers_b).status_code == 404
    assert client.get(f"/api/v1/reports/{report_a_id}/download", headers=headers_b).status_code == 404

    # Attempt to access User A's comparison -> 404
    assert client.get(f"/api/v1/comparisons/{comparison_a_id}", headers=headers_b).status_code == 404
    assert client.delete(f"/api/v1/comparisons/{comparison_a_id}", headers=headers_b).status_code == 404

    # Attempt to directly compare User A's sites -> 404
    assert client.post("/api/v1/sites/compare", headers=headers_b, json={"site_ids": [site_a1_id, site_a2_id]}).status_code == 404

    # -------------------------------------------------------------------------
    # 5. User B creates independent Project B & Site B1
    # -------------------------------------------------------------------------
    proj_b_code = f"PRJ-B-{ts % 100000}"
    proj_b_res = client.post(
        "/api/v1/projects",
        headers=headers_b,
        json={
            "project_name": f"User B Texas Wind Farm {ts}",
            "project_code": proj_b_code,
            "target_capacity_mw": 80.0,
            "technology_type": "WIND",
            "region": "Texas",
            "status": "DRAFT"
        }
    )
    assert proj_b_res.status_code == 201
    proj_b_id = proj_b_res.json()["id"]

    site_b1_res = client.post(
        f"/api/v1/projects/{proj_b_id}/sites",
        headers=headers_b,
        json={
            "site_name": f"Site B1 Sweetwater {ts}",
            "latitude": 32.4,
            "longitude": -100.4,
            "elevation": 650.0,
            "land_area": 40.0,
            "region": "Texas",
            "technology_type": "WIND"
        }
    )
    assert site_b1_res.status_code == 201
    site_b1_id = site_b1_res.json()["id"]

    # Verify User B sees exactly 1 project and 1 site
    projs_b_after = client.get("/api/v1/projects", headers=headers_b).json()
    b_after_items = projs_b_after.get("items", projs_b_after) if isinstance(projs_b_after, dict) else projs_b_after
    assert len(b_after_items) == 1
    assert b_after_items[0]["id"] == proj_b_id

    sites_b_after = client.get("/api/v1/sites", headers=headers_b).json()
    b_after_sites = sites_b_after.get("items", sites_b_after) if isinstance(sites_b_after, dict) else sites_b_after
    assert len(b_after_sites) == 1
    assert b_after_sites[0]["id"] == site_b1_id

    # -------------------------------------------------------------------------
    # 6. Verify User A's data remains untouched and does NOT include User B's records
    # -------------------------------------------------------------------------
    projs_a = client.get("/api/v1/projects", headers=headers_a).json()
    a_items = projs_a.get("items", projs_a) if isinstance(projs_a, dict) else projs_a
    # User A should only see their own projects, not User B's
    assert not any(p["id"] == proj_b_id for p in a_items)

    sites_a = client.get("/api/v1/sites", headers=headers_a).json()
    a_sites = sites_a.get("items", sites_a) if isinstance(sites_a, dict) else sites_a
    assert not any(s["id"] == site_b1_id for s in a_sites)
    assert any(s["id"] == site_a1_id for s in a_sites)
    assert any(s["id"] == site_a2_id for s in a_sites)

    # User A cannot access User B's project or site
    assert client.get(f"/api/v1/projects/{proj_b_id}", headers=headers_a).status_code == 404
    assert client.get(f"/api/v1/sites/{site_b1_id}", headers=headers_a).status_code == 404

    # -------------------------------------------------------------------------
    # 7. Verify Administrator role can view management statistics
    # -------------------------------------------------------------------------
    user_admin, token_admin = _register_and_login(admin_email, pwd, "ADMINISTRATOR")
    headers_admin = {"Authorization": f"Bearer {token_admin}"}

    admin_dash = client.get("/api/v1/admin/stats", headers=headers_admin)
    assert admin_dash.status_code == 200
    metrics = admin_dash.json()
    assert metrics.get("total_projects", 0) >= 2
    assert metrics.get("total_sites", 0) >= 3


if __name__ == "__main__":
    test_user_data_isolation_e2e()
    print("ALL USER DATA ISOLATION TESTS PASSED SUCCESSFULLY!")
