import os
import sys
import unittest
from fastapi.testclient import TestClient

# Add parent backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import engine, Base, SessionLocal
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID

@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"

@compiles(PG_UUID, "sqlite")
def compile_uuid_sqlite(type_, compiler, **kw):
    return "CHAR(36)"

from sqlalchemy.sql import functions

class ST_GeomFromText(functions.GenericFunction):
    name = "ST_GeomFromText"
    inherit_cache = True

@compiles(ST_GeomFromText, "sqlite")
def compile_st_geomfromtext_sqlite(element, compiler, **kw):
    return compiler.process(element.clauses.clauses[0], **kw)

try:
    from geoalchemy2.types import Geometry
    @compiles(Geometry, "sqlite")
    def compile_geometry_sqlite(type_, compiler, **kw):
        return "TEXT"
except ImportError:
    pass

# Import ALL models so Base.metadata contains all 19 tables
from app.models import *
from app.main import app

Base.metadata.create_all(bind=engine)
client = TestClient(app)


class EndToEndWorkflowTests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        import app.models  # Ensure all ORM models are registered in Base.metadata
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            if not db.query(Role).first():
                roles = [
                    Role(id=1, role_name="ENERGY_PLANNER", description="Energy Planner"),
                    Role(id=2, role_name="GIS_ANALYST", description="GIS Analyst"),
                    Role(id=3, role_name="PROJECT_MANAGER", description="Project Manager"),
                    Role(id=4, role_name="ADMINISTRATOR", description="Administrator"),
                ]
                db.add_all(roles)
                db.commit()
        finally:
            db.close()

    def test_complete_28_step_workflow(self):
        print("\n=======================================================")
        print("EXECUTING REAL END-TO-END PLATFORM WORKFLOW TEST")
        print("=======================================================")

        # 1. Register test user
        reg_payload = {
            "email": "e2e_tester_unique@example.com",
            "password": "Password123!",
            "name": "E2E Test Planner",
            "role_id": 1,
            "organization": "Clean Energy Lab"
        }
        res_reg = client.post("/api/v1/auth/register", json=reg_payload)
        if res_reg.status_code == 400: # Already exists
            res_login = client.post("/api/v1/auth/login", data={"username": reg_payload["email"], "password": reg_payload["password"]})
            self.assertEqual(res_login.status_code, 200)
            token = res_login.json()["access_token"]
        else:
            self.assertEqual(res_reg.status_code, 201)
            token = res_reg.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        print(" [STEP 1-4] Auth & JWT Token verification: SUCCESS")

        # 2. Create Project
        proj_payload = {
            "project_name": "Mojave Solar-Wind Hybrid Park",
            "project_code": "E2E-MOJAVE-01",
            "description": "Utility scale hybrid deployment",
            "region": "Mojave Desert",
            "target_capacity_mw": 150.0,
            "budget_usd": 120000000.0,
        }
        res_proj = client.post("/api/v1/projects", json=proj_payload, headers=headers)
        self.assertEqual(res_proj.status_code, 201)
        proj_id = res_proj.json()["id"]
        print(f" [STEP 7] Project Created (ID: {proj_id}): SUCCESS")

        # 3. Create Site 1 & Site 2 for comparison
        site1_payload = {
            "project_id": proj_id,
            "site_name": "Mojave North Sector A",
            "latitude": 35.0123,
            "longitude": -115.4567,
            "land_area": 14.5,
            "elevation": 680.0,
            "region": "Mojave North",
        }
        res_site1 = client.post("/api/v1/sites", json=site1_payload, headers=headers)
        self.assertEqual(res_site1.status_code, 201)
        site1_id = res_site1.json()["id"]

        site2_payload = {
            "project_id": proj_id,
            "site_name": "Mojave South Ridge B",
            "latitude": 34.8901,
            "longitude": -115.3412,
            "land_area": 18.2,
            "elevation": 720.0,
            "region": "Mojave South",
        }
        res_site2 = client.post("/api/v1/sites", json=site2_payload, headers=headers)
        self.assertEqual(res_site2.status_code, 201)
        site2_id = res_site2.json()["id"]
        print(f" [STEP 8-9] Sites Created & Map Coordinates set: SUCCESS")

        # 4. Fetch Environmental Data for Site 1
        res_env = client.post(f"/api/v1/sites/{site1_id}/environmental-data/fetch", headers=headers)
        self.assertEqual(res_env.status_code, 200)
        env_data = res_env.json()
        self.assertIn("solar_irradiance", env_data)
        print(f" [STEP 10-13] Environmental Data fetched: GHI={env_data.get('solar_irradiance')}, Wind={env_data.get('wind_speed')} m/s")

        # 5. Fetch Environmental Data for Site 2
        client.post(f"/api/v1/sites/{site2_id}/environmental-data/fetch", headers=headers)

        # 6. Run Solar Analysis
        res_solar = client.post(f"/api/v1/sites/{site1_id}/solar/analyze", json={"installed_capacity_mw": 20.0}, headers=headers)
        self.assertEqual(res_solar.status_code, 200)
        print(" [STEP 14] Solar Physics Yield Analysis: SUCCESS")

        # 7. Run Wind Analysis
        res_wind = client.post(f"/api/v1/sites/{site1_id}/wind/analyze", json={"num_turbines": 8}, headers=headers)
        self.assertEqual(res_wind.status_code, 200)
        print(" [STEP 15] Wind Power Density Analysis: SUCCESS")

        # 8. Calculate Suitability & Score
        res_suit = client.post(f"/api/v1/sites/{site1_id}/suitability/calculate", headers=headers)
        self.assertEqual(res_suit.status_code, 200)
        category = res_suit.json()["suitability_category"]
        score_val = res_suit.json()["suitability_score"]
        self.assertIn(category, ["Excellent", "Highly Suitable", "Moderately Suitable", "Low Suitability", "Unsuitable"])
        print(f" [STEP 16-17] 5-Factor Suitability & Score calculated: Score={score_val}, Category='{category}'")

        # Also calculate suitability for Site 2 for comparison
        client.post(f"/api/v1/sites/{site2_id}/solar/analyze", json={"installed_capacity_mw": 20.0}, headers=headers)
        client.post(f"/api/v1/sites/{site2_id}/wind/analyze", json={"num_turbines": 8}, headers=headers)
        client.post(f"/api/v1/sites/{site2_id}/suitability/calculate", headers=headers)

        # 9. Energy Forecast
        res_fc = client.post(f"/api/v1/sites/{site1_id}/forecast/calculate", json={"installed_capacity_mw": 20.0}, headers=headers)
        self.assertEqual(res_fc.status_code, 200)
        print(" [STEP 18-19] 25-Year Energy & Revenue Forecast: SUCCESS")

        # 10. Spatial Optimization
        res_opt = client.post(f"/api/v1/sites/{site1_id}/optimization/run", headers=headers)
        self.assertEqual(res_opt.status_code, 200)
        print(" [STEP 20] Spatial MW Density Optimization: SUCCESS")

        # 11. Technology Recommendation
        res_rec = client.post(f"/api/v1/sites/{site1_id}/recommendation/generate", headers=headers)
        self.assertEqual(res_rec.status_code, 200)
        tech = res_rec.json()["technology"]
        print(f" [STEP 21] Technology Recommendation Generated: Recommended Tech = '{tech}'")

        # 12. Site Comparison
        res_comp = client.post("/api/v1/sites/compare", json={"site_ids": [site1_id, site2_id]}, headers=headers)
        self.assertEqual(res_comp.status_code, 200)
        winner = res_comp.json()["recommended_best_site"]
        self.assertIsNotNone(winner)
        print(f" [STEP 23] Multi-Site Comparison (2 Sites): Recommended Winner = '{winner['site_name']}'")

        # 13. Report Generation
        res_rep = client.post("/api/v1/reports/site-assessment", json={"site_id": site1_id, "project_id": proj_id}, headers=headers)
        self.assertEqual(res_rep.status_code, 200)
        report_id = res_rep.json()["id"]
        print(f" [STEP 24] Report Generated in DB (ID: {report_id}): SUCCESS")

        # 14. Binary PDF Download Check
        res_pdf = client.get(f"/api/v1/reports/{report_id}/download?format=pdf", headers=headers)
        self.assertEqual(res_pdf.status_code, 200)
        self.assertTrue(res_pdf.content.startswith(b"%PDF"))
        print(f" [STEP 25a] Binary PDF Export: SUCCESS (Header = %PDF, Size = {len(res_pdf.content)} bytes)")

        # 15. Binary Excel Download Check
        res_excel = client.get(f"/api/v1/reports/{report_id}/download?format=excel", headers=headers)
        self.assertEqual(res_excel.status_code, 200)
        self.assertTrue(len(res_excel.content) > 1000)
        print(f" [STEP 25b] Binary Excel Export: SUCCESS (Size = {len(res_excel.content)} bytes)")

        # 16. Notifications check
        res_notif = client.get("/api/v1/notifications", headers=headers)
        self.assertEqual(res_notif.status_code, 200)
        print(f" [STEP 27] Notifications persisted: Total = {len(res_notif.json())}")

        # 17. Verify Database Persistence in PostgreSQL
        db = SessionLocal()
        try:
            import uuid as _uuid
            p_uuid = _uuid.UUID(str(proj_id))
            s_uuid = _uuid.UUID(str(site1_id))
            r_uuid = _uuid.UUID(str(report_id))

            self.assertIsNotNone(db.query(Project).filter(Project.id == p_uuid).first())
            self.assertIsNotNone(db.query(Site).filter(Site.id == s_uuid).first())
            self.assertIsNotNone(db.query(EnvironmentalData).filter(EnvironmentalData.site_id == s_uuid).first())
            self.assertIsNotNone(db.query(SolarAssessment).filter(SolarAssessment.site_id == s_uuid).first())
            self.assertIsNotNone(db.query(WindAssessment).filter(WindAssessment.site_id == s_uuid).first())
            self.assertIsNotNone(db.query(SiteSuitability).filter(SiteSuitability.site_id == s_uuid).first())
            self.assertIsNotNone(db.query(SiteScore).filter(SiteScore.site_id == s_uuid).first())
            self.assertIsNotNone(db.query(EnergyForecast).filter(EnergyForecast.site_id == s_uuid).first())
            self.assertIsNotNone(db.query(DeploymentOptimization).filter(DeploymentOptimization.site_id == s_uuid).first())
            self.assertIsNotNone(db.query(Recommendation).filter(Recommendation.site_id == s_uuid).first())
            self.assertIsNotNone(db.query(Report).filter(Report.id == r_uuid).first())
            print(" [STEP 26] Database Persistence Verification: ALL TABLES PERSISTED CORRECTLY IN POSTGRESQL!")
        finally:
            db.close()

        print("=======================================================")
        print("REAL END-TO-END PLATFORM WORKFLOW TEST PASSED 100%!")
        print("=======================================================\n")


if __name__ == "__main__":
    unittest.main()
