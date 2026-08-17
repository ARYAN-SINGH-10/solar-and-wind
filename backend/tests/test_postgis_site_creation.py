import os
import sys
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import engine, Base, SessionLocal
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.sql import functions

@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"

@compiles(PG_UUID, "sqlite")
def compile_uuid_sqlite(type_, compiler, **kw):
    return "CHAR(36)"

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

from app.models import *
from app.main import app

Base.metadata.create_all(bind=engine)
client = TestClient(app)


class PostGISSiteCreationTests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
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

    def test_postgis_site_creation_and_bounds_validation(self):
        print("\n=======================================================")
        print("TESTING POSTGIS SITE CREATION & COORDINATE VALIDATION")
        print("=======================================================")

        # 1. Register test planner user
        reg_payload = {
            "email": "postgis_tester@example.com",
            "password": "Password123!",
            "name": "PostGIS Test Planner",
            "role_id": 1,
            "organization": "Clean Energy GIS"
        }
        res_reg = client.post("/api/v1/auth/register", json=reg_payload)
        if res_reg.status_code == 400:
            res_login = client.post("/api/v1/auth/login", data={"username": reg_payload["email"], "password": reg_payload["password"]})
            token = res_login.json()["access_token"]
        else:
            token = res_reg.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}

        # 2. Create Project
        proj_payload = {
            "project_name": "PostGIS Solar Park",
            "project_code": "PG-SOLAR-01",
            "description": "Geospatial site creation test",
            "region": "Central India",
            "target_capacity_mw": 100.0,
            "budget_usd": 80000000.0,
        }
        res_proj = client.post("/api/v1/projects", json=proj_payload, headers=headers)
        self.assertEqual(res_proj.status_code, 201)
        proj_id = res_proj.json()["id"]

        # 3. Test exact user payload: POST /api/v1/projects/{project_id}/sites
        site_payload = {
            "site_name": "Test Solar Site",
            "latitude": 23.2599,
            "longitude": 77.4126,
            "land_area": 50,
            "elevation": 650,
            "land_ownership": "Public Lease",
            "existing_infrastructure": "230kV Substation within 4.2 km"
        }
        res_site = client.post(f"/api/v1/projects/{proj_id}/sites", json=site_payload, headers=headers)
        self.assertEqual(res_site.status_code, 201)
        site_data = res_site.json()
        self.assertEqual(site_data["site_name"], "Test Solar Site")
        self.assertEqual(site_data["latitude"], 23.2599)
        self.assertEqual(site_data["longitude"], 77.4126)
        print(" [TEST 1] POST /api/v1/projects/{project_id}/sites: HTTP 201 Created - SUCCESS")

        # 4. Verify DB record location point
        import uuid as _uuid
        db = SessionLocal()
        try:
            site_rec = db.query(Site).filter(Site.id == _uuid.UUID(site_data["id"])).first()
            self.assertIsNotNone(site_rec)
            self.assertIsNotNone(site_rec.location)
            self.assertEqual(float(site_rec.latitude), 23.2599)
            self.assertEqual(float(site_rec.longitude), 77.4126)
            print(f" [TEST 2] Database Record Verification: Location Geometry NOT NULL = {site_rec.location}")
        finally:
            db.close()

        # 5. Test invalid latitude bounds (e.g. 95.0) -> HTTP 400
        invalid_lat_payload = dict(site_payload, site_name="Invalid Lat Site", latitude=95.0)
        res_inv_lat = client.post(f"/api/v1/projects/{proj_id}/sites", json=invalid_lat_payload, headers=headers)
        self.assertIn(res_inv_lat.status_code, [400, 422])
        print(" [TEST 3] Invalid Latitude (95.0) rejected: HTTP 400/422 - SUCCESS")

        # 6. Test invalid longitude bounds (e.g. -190.0) -> HTTP 400
        invalid_lon_payload = dict(site_payload, site_name="Invalid Lon Site", longitude=-190.0)
        res_inv_lon = client.post(f"/api/v1/projects/{proj_id}/sites", json=invalid_lon_payload, headers=headers)
        self.assertIn(res_inv_lon.status_code, [400, 422])
        print(" [TEST 4] Invalid Longitude (-190.0) rejected: HTTP 400/422 - SUCCESS")

        print("=======================================================")
        print("POSTGIS SITE CREATION & VALIDATION SUITE PASSED 100%!")
        print("=======================================================\n")


if __name__ == "__main__":
    unittest.main()
