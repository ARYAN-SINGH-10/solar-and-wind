# 🌞 Solar & Wind Deployment Intelligence Platform

An enterprise-grade web application designed for renewable energy planners, GIS analysts, and project managers to evaluate, score, forecast, and optimize candidate solar PV and wind turbine deployment sites.

> 🔒 **Deterministic Analytics Policy — No AI / No Machine Learning**  
> All solar/wind yield calculations, MCDA suitability scores, and financial projections rely strictly on **reproducible physics equations and PostGIS spatial queries**. No black-box AI/ML models are used.

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
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)

---

## ✨ Features

- 🔐 **JWT Auth & RBAC**: Secure authentication with 4-tier Role-Based Access Control.
- 📁 **Project Management**: Full lifecycle management of renewable energy projects.
- 📍 **Candidate Site Management**: Site registration with PostGIS `EPSG:4326` geometry and coordinate validation.
- 🗺️ **Interactive GIS Map Engine**: 10-layer spatial map overlay using Leaflet 1.9.4 and PostGIS vector layers.
- 🌦️ **Environmental Data Feeds**: Automated satellite data retrieval from NASA POWER, Open-Meteo, SRTM, and OpenStreetMap.
- ☀️ **Solar Physics Analysis**: Photovoltaic peak sun hours and annual AC yield calculations.
- 💨 **Wind Physics Analysis**: Fluid mechanics Wind Power Density ($P/A = \frac{1}{2} \rho v^3$) calculations.
- 📊 **5-Factor Site Suitability Index**: MCDA scoring across Resource, Geographic, Infrastructure, Environmental, and Economic dimensions.
- ⚡ **Energy & Revenue Forecasting**: 25-year generation degradation and tariff revenue projections.
- 🏗️ **Deployment Optimization**: MW capacity array density optimization with terrain exclusion zones.
- 💰 **Technology & Investment Recommendations**: Automated technology matching and payback period estimation.
- 📄 **PDF & Excel Reports Exporter**: Styled executive PDF reports (ReportLab) and multi-sheet Excel workbooks (OpenPyXL).
- 📈 **Multi-Site Benchmarking**: Side-by-side comparison across 18 physical and financial metrics.

---

## 👥 User Roles

| Role | Purpose |
| :--- | :--- |
| `ENERGY_PLANNER` | Energy yield modeling, suitability scoring, forecasting, and report exporting |
| `GIS_ANALYST` | GIS spatial layer ingestion, DEM slope analysis, and setback buffer zone checks |
| `PROJECT_MANAGER` | Project lifecycle oversight, target capacity planning, and budget management |
| `ADMINISTRATOR` | Global user administration, role assignment, and audit log monitoring |

---

## 🚀 Run Locally

The easiest way to run the platform locally is using Docker Compose.

### Prerequisites

- **Git**
- **Docker Desktop**

### 1. Clone the Repository

```bash
git clone https://github.com/ARYAN-SINGH-10/solar-and-wind.git
cd solar-and-wind
```

### 2. Configure Environment

Copy the default environment configuration template:

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

```bash
# Linux / macOS
cp .env.example .env
```

### 3. Launch Docker Compose Stack

```bash
docker compose up -d --build
```

Verify that all 3 services are running and healthy:

```bash
docker compose ps
```

### 4. Access Application Services

- **Web Application UI**: [http://localhost](http://localhost)
- **Interactive API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend API Health Endpoint**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

## 📍 GIS & PostGIS Conventions

- **Frontend (Leaflet)**: Expects `[latitude, longitude]` coordinate order (e.g. `[23.2599, 77.4126]`).
- **Backend (PostGIS)**: Stores coordinates in OGC standard WKT `POINT(longitude latitude)` order with `SRID 4326`:
  ```sql
  ST_SetSRID(ST_MakePoint(77.4126, 23.2599), 4326)
  ```

---

## 🧪 Testing Suite

Run backend physics calculation and API integration tests:

```bash
# Platform router & auth tests
python backend/tests/test_platform.py

# PostGIS site creation & coordinate validation tests
python backend/tests/test_postgis_site_creation.py

# Wind power density calculation tests
python backend/tests/test_wind_calculation.py

# Unit & formula verification test suite
python backend/tests/run_tests.py

# Real end-to-end platform workflow test
python backend/tests/run_end_to_end_test.py
```

---

## 📚 Technical Documentation

For complete design specifications, architecture diagrams, and workflow guides, consult the dedicated documentation files:

- 📐 **[System Architecture Specification](docs/architecture.md)**
- 🔄 **[Platform Workflow Guide](docs/workflow.md)**
- 📋 **[Milestone 1 Design & Dataset Report](milestone1_design_and_documentation.md)**

---

## 📄 License

**License**: Academic Project / Not specified.
