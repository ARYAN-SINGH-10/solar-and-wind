# 🌞 Solar & Wind Deployment Intelligence Platform

[![Production Status](https://img.shields.io/badge/Production-Live-success?style=for-the-badge&logo=render&logoColor=white)](https://solar-wind-frontend.onrender.com)
[![API Docs](https://img.shields.io/badge/FastAPI-Interactive_Swagger-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://solar-wind-backend-7s38.onrender.com/docs)
[![Database](https://img.shields.io/badge/Database-Supabase_PostGIS-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

An enterprise-grade hybrid intelligence platform for renewable energy planners, GIS analysts, and project managers. Evaluates, scores, forecasts, optimizes, and ranks candidate solar PV and wind turbine sites — powered by deterministic physics engines and an intelligent 7-model AI/ML prediction layer.

---

## 🌐 Live Production Deployments

| Component | Service | Live Production URL | Description |
| :--- | :--- | :--- | :--- |
| **Frontend Application** | Render Static Site | 🔗 [**solar-wind-frontend.onrender.com**](https://solar-wind-frontend.onrender.com) | Responsive React UI, GIS Map Viewer, Project Dashboard |
| **Backend REST API** | Render Docker Web Service | 🔗 [**solar-wind-backend-7s38.onrender.com**](https://solar-wind-backend-7s38.onrender.com) | FastAPI REST service with physics math & ML inference |
| **Interactive API Docs** | Swagger UI | 🔗 [**solar-wind-backend-7s38.onrender.com/docs**](https://solar-wind-backend-7s38.onrender.com/docs) | Interactive testing for all endpoints & ML models |
| **Database & GIS** | Supabase Managed | 🗄️ **Supabase Cloud (PostgreSQL 15 + PostGIS 3.3)** | Spatial geometry storage, RBAC roles, persistent project records |

---

## 🛠️ Technology Stack

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-GIS-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![PostGIS](https://img.shields.io/badge/PostGIS-3.3-636363?style=for-the-badge&logo=postgresql&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-ML-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)

---

## ✨ Key Platform Features

### 🔐 Security & Access Control
- **JWT Bearer Token Authentication**: Secure token-based session lifecycle management.
- **Role-Based Access Control (RBAC)**: 4 distinct roles:
  - `ENERGY_PLANNER`: Energy yield modeling, suitability scoring, and generation forecasting.
  - `GIS_ANALYST`: GIS spatial layer ingestion, DEM slope analysis, and setback buffer zone verification.
  - `PROJECT_MANAGER`: Lifecycle tracking, target capacity planning, and capital budget management.
  - `ADMINISTRATOR`: User RBAC administration, audit log inspection, and system metrics.

### 🗺️ Geospatial Intelligence (GIS)
- **Interactive Leaflet 1.9.4 Mapping**: Multi-layer spatial visualization with high-resolution map tiles.
- **PostGIS Vector Geometries**: Native `EPSG:4326` geographic storage (`POINT`, `POLYGON`).
- **Terrain & Slope Analysis**: DEM slope calculation, road and power grid proximity checks, environmental exclusions.
- **OpenStreetMap Overpass API**: Automated real-world infrastructure layer ingestion.

### 🌦️ Real-Time Environmental Data
- Automated weather and solar irradiance telemetry from **NASA POWER API**, **Open-Meteo**, and **SRTM Elevation API**.
- Tracks Global Horizontal Irradiance (GHI), Direct Normal Irradiance (DNI), Diffuse Horizontal Irradiance (DHI), hub-height wind speed, surface temperature, and atmospheric pressure.

### ☀️ Deterministic Engineering Physics Engines
- **Solar AC Yield**: $E = \text{GHI} \times A \times \eta \times \text{PR}$ — annual AC generation in MWh/year.
- **Wind Power Density**: $\frac{P}{A} = \frac{1}{2}\rho v^3$ — IEC Class I–IV wind turbine assessment.
- **MCDA Suitability Index**: 5-Factor multi-criteria decision analysis (Resource 35%, Geographic 25%, Infrastructure 15%, Environmental 15%, Economic 10%).
- **25-Year Lifecycle Forecast**: Annual degradation modeling (PV 0.5%/yr, Wind 1.2%/yr), tariff revenue, and net cash flow.

### 🤖 AI/ML Intelligence Layer (7 Capabilities)
Seven scikit-learn models provide predictive intelligence alongside deterministic physics calculations:

| # | Model Capability | Architecture | Target Output |
|:---|:---|:---|:---|
| 1 | **Solar Energy Predictor** | `GradientBoostingRegressor` | Annual AC yield ($MWh/year$) with $\pm1.96 \times \text{RMSE}$ interval |
| 2 | **Wind Energy Predictor** | `RandomForestRegressor` | Annual wind energy production ($MWh/year$) |
| 3 | **Site Suitability Classifier** | `RandomForestClassifier` | `EXCELLENT`, `GOOD`, `MODERATE`, `POOR` classification |
| 4 | **Candidate Site Ranker** | `Explainable Heuristic Ranker` | Multi-site benchmark rank with factor breakdown |
| 5 | **Monthly Energy Forecaster** | `GradientBoostingRegressor` | 12-month generation seasonality curve |
| 6 | **Investment Payback & Risk** | `GradientBoosting` + `Classifier` | Payback duration (years) & `LOW` / `MEDIUM` / `HIGH` risk rating |
| 7 | **Technology Recommender** | `RandomForestClassifier` | Recommended deployment: `SOLAR`, `WIND`, or `HYBRID` |

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    React + Vite Frontend                     │
│        (Leaflet GIS, Tailwind CSS, Axios, Modern Dark UI)    │
│            https://solar-wind-frontend.onrender.com          │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTPS / JSON (JWT Bearer Token)
┌──────────────────────────────▼───────────────────────────────┐
│                FastAPI Backend (Python 3.11+)                │
│         https://solar-wind-backend-7s38.onrender.com         │
│  ┌───────────────────────────┐  ┌─────────────────────────┐  │
│  │   Deterministic Engines   │  │   AI/ML Intelligence    │  │
│  │  - Solar Yield Engine     │  │  - 7 Trained Models     │  │
│  │  - Wind Density Engine    │  │  - Feature Scalers      │  │
│  │  - MCDA Suitability (5F)  │  │  - Prediction Intervals │  │
│  │  - 25-Year Cashflow Model │  │  - Tech Recommendation  │  │
│  └─────────────┬─────────────┘  └─────────────────────────┘  │
└────────────────┼─────────────────────────────────────────────┘
                 │ SQLAlchemy ORM (PostgreSQL Dialect)
┌────────────────▼─────────────────────────────────────────────┐
│             Supabase PostgreSQL 15 + PostGIS 3.3             │
│            (Spatial Geometry, RBAC, Data Isolation)          │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Running Locally

You can run the full stack locally using either Docker Compose or direct native processes:

### Option A: Using Docker Compose

```bash
# 1. Clone repository
git clone https://github.com/ARYAN-SINGH-10/solar-and-wind.git
cd solar-and-wind

# 2. Configure environment file
cp .env.example .env

# 3. Spin up full 3-container stack
docker compose up -d --build

# 4. View running services
docker compose ps
```

Local access:
- **Frontend App**: [http://localhost:5173](http://localhost:5173) (or `http://localhost`)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Option B: Running Without Docker

#### Backend:
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 🤖 AI/ML API Reference

All machine learning inference endpoints are available under the `/api/v1/ml` route prefix:

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/v1/ml/solar/predict` | Predict annual solar generation with confidence intervals |
| `POST` | `/api/v1/ml/wind/predict` | Predict wind energy output from aerodynamic parameters |
| `POST` | `/api/v1/ml/suitability/predict` | Classify multi-factor site suitability |
| `POST` | `/api/v1/ml/rank-sites` | Benchmark and rank multiple candidate locations |
| `POST` | `/api/v1/ml/forecast/predict` | Predict 12-month generation seasonality |
| `POST` | `/api/v1/ml/investment/predict` | Predict capital payback period and risk category |
| `POST` | `/api/v1/ml/technology/recommend` | Determine optimal technology (Solar, Wind, Hybrid) |
| `GET`  | `/api/v1/health` | Comprehensive system, database, and ML health status |

---

## 🧪 Automated Testing Suite

The repository includes a comprehensive unit and integration test suite:

```bash
# Run ML engine inference & validation tests
python backend/tests/test_ml_engine.py

# Run deterministic wind calculations verification
python backend/tests/test_wind_calculation.py

# Run API endpoint access control & data isolation tests
python backend/tests/test_data_isolation.py

# Run general formula verification
python backend/tests/run_tests.py
```

---

## 📁 Repository Structure

```
solar-and-wind/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # REST API route handlers
│   │   ├── core/               # App configuration, database connection, JWT security
│   │   ├── ml_models/          # Trained model artifacts (.joblib) & training pipeline
│   │   ├── models/             # SQLAlchemy ORM database models
│   │   ├── schemas/            # Pydantic validation schemas
│   │   └── services/           # Physics math, GIS processing, ML service, report generators
│   ├── tests/                  # Unit tests, integration tests, ML test suite
│   ├── Dockerfile              # Production Python Docker image
│   └── requirements.txt        # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/         # Shared UI components (Navigation, Layout, Modal, Alerts)
│   │   ├── context/            # AuthContext (JWT state management)
│   │   ├── pages/              # Project Dashboard, Map GIS Explorer, Analysis, Admin
│   │   └── services/           # Axios HTTP API clients
│   ├── package.json            # Node.js dependencies
│   └── vite.config.js          # Vite configuration
├── docs/                       # Technical documentation and workflow guides
├── render.yaml                 # Render cloud deployment blueprint
├── docker-compose.yml          # Local multi-service orchestration
└── README.md                   # Project documentation
```

---

## 👥 Contributors & Authors

- **Aryan Singh** ([@ARYAN-SINGH-10](https://github.com/ARYAN-SINGH-10))

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
