# Solar & Wind Deployment Intelligence Platform - End-to-End Workflow

## Complete Business Workflow

```
[ START ]
   │
   ▼
[ 1. User Registration / Login ] ──► JWT Auth & Role Verification
   │
   ▼
[ 2. Role-Based Access ] ──► Assign Capabilities (Planner / Analyst / Manager / Admin)
   │
   ▼
[ 3. Create / Select Project ] ──► Define target region, budget, and capacity targets
   │
   ▼
[ 4. Select / Add Site ] ──► Draw boundary coordinates (Polygon / Point in EPSG:4326)
   │
   ▼
[ 5. Data Collection ] ──► Gather Solar Irradiance, Wind Speeds, Terrain Slope, Distance to Grid
   │
   ▼
[ 6. Data Preprocessing ] ──► Normalize units, validate coordinate bounding boxes
   │
   ▼
[ 7. Solar Analysis ] ──► Compute GHI/DNI yield, GCR, tilt angle optimization, performance losses
   │
   ▼
[ 8. Wind Analysis ] ──► Compute Weibull distribution, hub height extrapolation, wake effect loss
   │
   ▼
[ 9. Site Suitability Calculation ] ──► Apply slope limits, setback buffers, exclusion overlays
   │
   ▼
[ 10. Site Scoring ] ──► Compute composite Site Suitability Index (SSI: 0 - 100)
   │
   ▼
[ 11. Energy Forecasting ] ──► Deterministic monthly & annual kWh yield projection
   │
   ▼
[ 12. Deployment Optimization ] ──► Array spacing, turbine layout geometry, substations cost
   │
   ▼
[ 13. Recommendation Engine ] ──► Rank sites: Optimal, Feasible, Marginal, Unsuitable
   │
   ▼
[ 14. GIS + Analytics Dashboard ] ──► Render spatial map layers & chart visualizations
   │
   ▼
[ 15. Report Generation ] ──► Export PDF/CSV summary for project stakeholders
   │
   ▼
[ 16. Save Results & Notifications ] ──► Store audit logs, trigger role alerts
   │
   ▼
[ 17. Site Comparison ] ──► Side-by-side benchmark of candidate sites
   │
   ▼
[ END ]
```

---

## Stage Details & Responsibilities

1. **User Authentication & RBAC**: Users log in via email/password. FastAPI returns a signed JWT containing user ID and role.
2. **Project & Site Onboarding**: Projects group multiple candidate sites. GIS Analysts upload shapefiles/GeoJSON or draw boundaries on Leaflet interactive maps.
3. **Environmental Processing**: PostGIS geospatial functions (`ST_DWithin`, `ST_Area`, `ST_Slope`, `ST_Distance`) evaluate geographic constraints.
4. **Deterministic Analysis**:
   - Solar engine calculates optimal tilt angle $\theta_{opt} \approx |\text{Latitude}| \times 0.9 + 29^\circ$.
   - Wind engine computes density corrected power curves.
   - Suitability engine applies weighted scoring matrices.
5. **Reporting & Comparison**: Export detailed technical summaries and side-by-side site comparisons.
