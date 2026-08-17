import sys
import os
import unittest
import uuid
from fastapi.testclient import TestClient

# Add parent backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)


class IntegrationTests(unittest.TestCase):

    def test_01_api_root(self):
        res = client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "online")

    def test_02_health_endpoint(self):
        res = client.get("/api/v1/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("status", data)
        self.assertIn(data["status"], ["ok", "degraded"])

    def test_03_unauthorized_access(self):
        res = client.get("/api/v1/projects")
        self.assertEqual(res.status_code, 401)

    def test_04_invalid_jwt_token(self):
        headers = {"Authorization": "Bearer invalid_token_xyz"}
        res = client.get("/api/v1/projects", headers=headers)
        self.assertEqual(res.status_code, 401)

    def test_05_nonexistent_site_unauthenticated_401(self):
        res = client.get("/api/v1/sites/00000000-0000-0000-0000-000000000000")
        self.assertEqual(res.status_code, 401)

    def test_06_direct_site_comparison_unauthenticated(self):
        payload = {"site_ids": ["00000000-0000-0000-0000-000000000001"]}
        res = client.post("/api/v1/sites/compare", json=payload)
        self.assertEqual(res.status_code, 401)


if __name__ == "__main__":
    print("======================================================================")
    print("SOLAR & WIND PLATFORM - FASTAPI API INTEGRATION TEST SUITE")
    print("======================================================================")
    unittest.main(verbosity=2)
