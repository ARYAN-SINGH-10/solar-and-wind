# 🌞 Solar & Wind Deployment Intelligence Platform

An enterprise-grade web application for renewable energy planners, GIS analysts, and project managers to evaluate, score, forecast, optimize, and intelligently rank candidate solar PV and wind turbine deployment sites — powered by deterministic physics engines and a supplemental AI/ML intelligence layer.

---

## 🛠️ Technology Stack

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-GIS-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![PostGIS](https://img.shields.io/badge/PostGIS-3.3-636363?style=for-the-badge&logo=postgresql&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-ML-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)

---

## ✨ Key Features

### 🔐 Security & Access Control
- JWT Bearer Token authentication
- 4-tier Role-Based Access Control (RBAC): `ENERGY_PLANNER`, `GIS_ANALYST`, `PROJECT_MANAGER`, `ADMINISTRATOR`

### 🗺️ Geospatial Intelligence (GIS)
- Interactive Leaflet 1.9.4 map with 10 spatial layer overlays
- PostGIS `EPSG:4326` geometry for precise site coordinate storage
- DEM slope analysis, road/grid proximity, setback buffer zones
- OpenStreetMap Overpass API integration for infrastructure layers

### 🌦️ Environmental Data Engine
- Automated satellite data retrieval from NASA POWER, Open-Meteo, SRTM elevation API
- Solar irradiance (GHI, DNI, DHI), wind speed, temperature, humidity, and terrain data

### ☀️💨 Deterministic Physics Engines
- **Solar**: `E = GHI × A × η × PR` — annual AC yield (MWh/yr)
- **Wind**: `P/A = ½ρv³` — Wind Power Density, IEC Class I–IV turbine classification
- **Suitability**: 5-Factor MCDA weighted index (Resource 35%, Geographic 25%, Infrastructure 15%, Environmental 15%, Economic 10%)
- **Forecast**: 25-year generation with degradation curve and tariff revenue projections
- **Optimization**: MW capacity array density with terrain exclusion zones

### 🤖 AI/ML Intelligence Layer (v2.0.0)

Seven machine learning models provide **supplemental intelligence** alongside deterministic calculations:

| Model | Algorithm | Purpose |
|:---|:---|:---|
| Solar Energy Predictor | GradientBoostingRegressor | Predict annual AC yield (MWh/yr) |
| Wind Energy Predictor | RandomForestRegressor | Predict annual wind AEP (MWh/yr) |
| Site Suitability Classifier | RandomForestClassifier | Classify sites: EXCELLENT / GOOD / MODERATE / POOR |
| Candidate Site Ranker | Explainable Heuristic | Rank and explain multi-site candidates |
| Monthly Energy Forecaster | GradientBoostingRegressor | Monthly energy output projection |
| Investment Payback & Risk | GradientBoosting + Classifier | Payback years + LOW / MEDIUM / HIGH risk |
| Technology Recommender | RandomForestClassifier | Recommend SOLAR / WIND / HYBRID |

> ⚠️ **AI/ML Development Disclaimer**: AI/ML models are trained on a **5,000-sample synthetic development dataset calibrated using renewable-energy physical relationships**. The models are intended for demonstration and development purposes and **do not replace physical engineering calculations**. All authoritative yield, suitability, and financial figures are produced by the deterministic physics engines.

### 📊 Analytics & Reporting
- Executive role-specific dashboards (Energy Planner, GIS Analyst, Project Manager, Administrator)
- Multi-site benchmarking across 18 physical and financial metrics
- Styled PDF reports (ReportLab) and multi-sheet Excel workbooks (OpenPyXL)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                React + Vite Frontend                    │
│   (White + Orange Design System, Tailwind, Leaflet)    │
└──────────────────────┬──────────────────────────────────┘
                       │ REST / JSON (JWT)
┌──────────────────────▼──────────────────────────────────┐
│          FastAPI Backend (Python 3.12+)                 │
│  ┌──────────────────┐  ┌─────────────────────────────┐  │
│  │ Deterministic    │  │  AI/ML Intelligence Layer   │  │
│  │ Physics Engines  │  │  (scikit-learn, joblib)     │  │
│  │ (Solar, Wind,    │  │  7 Models — Supplemental    │  │
│  │ Suitability,     │  │  Predictions Only           │  │
│  │ Forecast, Opt)   │  └─────────────────────────────┘  │
│  └────────┬─────────┘                                   │
└───────────┼─────────────────────────────────────────────┘
            │ SQLAlchemy ORM
┌───────────▼─────────────────────────────────────────────┐
│        PostgreSQL 15 + PostGIS 3.3                      │
│        (Spatial Geometry, Vector Layers, Analytics)     │
└─────────────────────────────────────────────────────────┘
```

---

## 👥 User Roles

| Role | Purpose |
| :--- | :--- |
| `ENERGY_PLANNER` | Energy yield modeling, suitability scoring, forecasting, and report exporting |
| `GIS_ANALYST` | GIS spatial layer ingestion, DEM slope analysis, and setback buffer zone checks |
| `PROJECT_MANAGER` | Project lifecycle oversight, target capacity planning, and budget management |
| `ADMINISTRATOR` | Global user administration, role assignment, and audit log monitoring |

---

## 🚀 Run Locally (Docker Compose)

### Prerequisites

- **Git**
- **Docker Desktop** (with WSL2 backend on Windows)

### 1. Clone the Repository

```bash
git clone https://github.com/ARYAN-SINGH-10/solar-and-wind.git
cd solar-and-wind
```

### 2. Configure Environment

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

```bash
# Linux / macOS
cp .env.example .env
```

Edit `.env` and set a strong `SECRET_KEY` for any shared deployment.

### 3. Start the Full Stack

```bash
docker compose up -d --build
```

Verify all 3 services are running:

```bash
docker compose ps
```

Expected:
```
NAME                  STATUS
solar_wind_postgres   running (healthy)
solar_wind_backend    running (healthy)
solar_wind_frontend   running (healthy)
```

### 4. Access Application Services

| Service | URL |
|:---|:---|
| **Web Application** | http://localhost |
| **Swagger API Docs** | http://localhost:8000/docs |
| **Backend Health** | http://localhost:8000/api/v1/health |

### 5. Stop the Application

```bash
docker compose down
```

### 6. Restart (No Rebuild)

```bash
docker compose up -d
```

---

## 🤖 AI/ML API Endpoints

All ML endpoints are available under the **AI/ML Intelligence Layer** tag in Swagger:

| Method | Endpoint | Purpose |
|:---|:---|:---|
| POST | `/api/v1/ml/solar/predict` | Solar ML energy prediction |
| POST | `/api/v1/ml/wind/predict` | Wind ML energy prediction |
| POST | `/api/v1/ml/suitability/predict` | Site suitability ML classification |
| POST | `/api/v1/ml/rank-sites` | Explainable multi-site candidate ranking |
| POST | `/api/v1/ml/forecast/predict` | ML monthly energy forecast |
| POST | `/api/v1/ml/investment/predict` | Investment payback & risk ML |
| POST | `/api/v1/ml/technology/recommend` | Technology recommendation ML |

---

## 📍 GIS & PostGIS Coordinate Convention

> ⚠️ Coordinate order differs between Leaflet and PostGIS.

- **Frontend (Leaflet)**: `[latitude, longitude]` — e.g. `[23.2599, 77.4126]`
- **Backend (PostGIS)**: `POINT(longitude latitude)` — OGC/WKT standard:
  ```sql
  ST_SetSRID(ST_MakePoint(77.4126, 23.2599), 4326)
  ```

---

## 🧪 Testing Suite

```bash
# FastAPI route + auth tests (9 tests)
python backend/tests/test_platform.py

# Wind power density physics tests (19 tests)
python backend/tests/test_wind_calculation.py

# Unit & formula verification suite (5 tests)
python backend/tests/run_tests.py

# FastAPI integration tests — no DB required (6 tests)
python backend/tests/run_integration_tests.py

# ML engine tests — 7 models (9 tests)
python backend/tests/test_ml_engine.py

# PostGIS site creation tests (requires Docker DB)
python backend/tests/test_postgis_site_creation.py

# End-to-end platform workflow (requires Docker DB)
python backend/tests/run_end_to_end_test.py
```

---

## 📁 Repository Structure

```
solar-and-wind/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # REST API route handlers
│   │   ├── core/               # Config, database, JWT security
│   │   ├── ml_models/          # ML training script + trained artifact (.joblib)
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic schemas
│   │   └── services/           # Physics engines, ML service, GIS, reports
│   └── tests/                  # Unit, integration, and ML test suites
├── database/
│   ├── Dockerfile              # PostgreSQL 15 + PostGIS 3.3 image
│   └── init.sql                # Schema, RBAC, seed data
├── docs/
│   ├── architecture.md         # System architecture specification
│   └── workflow.md             # Platform workflow guide
├── frontend/
│   ├── src/
│   │   ├── components/         # Shared UI components
│   │   ├── context/            # AuthContext (JWT state)
│   │   ├── pages/              # All application pages
│   │   └── services/           # API clients (mlService.js, analysisService.js, …)
│   └── Dockerfile              # Nginx production server
├── .env.example                # Safe configuration template (no real credentials)
├── .gitignore
├── docker-compose.yml          # 3-service Docker Compose stack
└── README.md
```

---

## 📚 Technical Documentation

- 📐 **[System Architecture Specification](docs/architecture.md)**
- 🔄 **[Platform Workflow Guide](docs/workflow.md)**
- 📋 **[Milestone 1 Design & Dataset Report](milestone1_design_and_documentation.md)**

---

## 📄 License

**License**: Academic Project / Not specified.
