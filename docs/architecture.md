# Solar & Wind Deployment Intelligence Platform - Architecture Documentation

## System Overview

The **Solar & Wind Deployment Intelligence Platform** is a enterprise-grade geospatial decision-support application. It evaluates geographic regions for utility-scale solar photovoltaic (PV) and wind energy farm deployments.

> [!IMPORTANT]
> **Strict Deterministic Policy**: This system operates exclusively using physical law equations, deterministic GIS spatial algorithms, rule-based threshold scoring matrices, and multi-criteria decision analysis (MCDA). It contains zero Machine Learning, Deep Learning, or AI prediction models.

---

## 1. High-Level System Architecture

```
+-----------------------------------------------------------------------+
|                           CLIENT LAYER                                |
|   React SPA (Vite + Tailwind CSS + Axios + Leaflet GIS + Recharts)    |
+-----------------------------------++----------------------------------+
                                    || HTTP / REST / JSON APIs
+-----------------------------------vv----------------------------------+
|                            API LAYER                                  |
|               FastAPI (Python) REST Endpoints + OpenAPI               |
|  - Role-Based Access Control (RBAC)                                   |
|  - JWT Bearer Authentication                                          |
|  - Request Validation via Pydantic v2                                 |
+-----------------------------------++----------------------------------+
                                    ||
+-----------------------------------vv----------------------------------+
|                   DETERMINISTIC ANALYSIS ENGINES                      |
|  - Solar Irradiance Engine (PVUSA / HDKR Solar Equations)             |
|  - Wind Energy Engine (Air Density Correction + Betz Law)             |
|  - GIS Spatial Analysis Engine (Buffer, Slope, Elevation, Proximity)  |
|  - Multi-Criteria Decision Engine (Analytic Hierarchy Process - AHP)  |
+-----------------------------------++----------------------------------+
                                    || SQL / GeoAlchemy2
+-----------------------------------vv----------------------------------+
|                          DATABASE LAYER                               |
|                  PostgreSQL 15 + PostGIS 3.3 Extension                |
|  - Spatial Reference System: WGS 84 (EPSG:4326) / UTM                 |
|  - Tables: users, projects, sites, spatial_layers, evaluation_runs   |
+-----------------------------------------------------------------------+
```

---

## 2. User Roles & Permission Matrix

| Role | Access Level & Capabilities |
| :--- | :--- |
| **ADMINISTRATOR** | System user management, global scoring weights configuration, system logs audit, database maintenance. |
| **PROJECT_MANAGER** | Project lifecycle management, site assignment, team approvals, report validation, budget tracking. |
| **GIS_ANALYST** | Spatial layer ingestion, polygon site drafting, buffer zone analysis, environmental exclusion zone checks. |
| **ENERGY_PLANNER** | Solar PV yield modeling, wind turbine power curve calculation, suitability scoring execution, layout optimization. |

---

## 3. Deterministic Intelligence Formulas

### A. Solar PV Energy Yield Calculation
The annual AC energy generation $E_{PV}$ (in kWh) is calculated using the physical performance ratio formula:

$$E_{PV} = A \cdot \eta_{module} \cdot G_{annual} \cdot PR \cdot (1 - \text{Degradation})^{t}$$

Where:
- $A$: Total module surface area ($m^2$)
- $\eta_{module}$: Nominal module efficiency (%)
- $G_{annual}$: Annual global horizontal/tilted irradiance ($kWh/m^2/year$)
- $PR$: Performance Ratio (typically 0.75 - 0.85, accounting for temperature, inverter, cabling losses)
- $\text{Degradation}$: Annual PV panel degradation rate (e.g., 0.5%/yr)

### B. Wind Energy Power Density Calculation
Wind power density ($W/m^2$) is calculated using fluid mechanics equations:

$$P/A = \frac{1}{2} \cdot \rho \cdot v^3$$

Where:
- $\rho$: Air density ($kg/m^3$), adjusted for temperature ($T$) and site elevation ($z$):
  $$\rho = \frac{P_0}{R \cdot T} \cdot e^{-\frac{g \cdot z}{R \cdot T}}$$
- $v$: Mean annual wind speed ($m/s$) measured or extrapolated to hub height ($h$) via logarithmic wind profile:
  $$v(h) = v_{ref} \cdot \frac{\ln(h / z_0)}{\ln(h_{ref} / z_0)}$$

### C. Multi-Criteria Site Suitability Index (SSI)
Sites are scored using an Analytic Hierarchy Process (AHP) weighted linear combination:

$$SSI = \sum_{i=1}^{n} w_i \cdot S_i = w_1 S_{solar/wind} + w_2 S_{slope} + w_3 S_{grid\_dist} + w_4 S_{road\_dist} - \text{Penalty}_{exclusions}$$

Where:
- $w_i$: Configurable normalized weight criteria ($\sum w_i = 1.0$)
- $S_i$: Normalized score ($0 - 100$) for attribute $i$
- $\text{Penalty}_{exclusions}$: Infinitely high penalty (or hard score 0) if site violates environmental/buffer constraints (e.g. within protected park or $<500m$ from residential areas).
