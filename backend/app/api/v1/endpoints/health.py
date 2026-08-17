from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db, check_db_connection
from app.schemas.health import HealthCheckResponse
from app.services.solar_engine import calculate_solar_yield
from app.services.wind_engine import calculate_wind_power_density

router = APIRouter()


@router.get("", response_model=HealthCheckResponse)
def get_health_status(db: Session = Depends(get_db)):
    """
    Health Check Endpoint.
    Verifies FastAPI server readiness, PostgreSQL connection, PostGIS extension status,
    and deterministic calculation engine integrity.
    """
    db_status = check_db_connection()

    # Quick sanity test on deterministic calculation engines
    solar_test = calculate_solar_yield(area_sq_m=1000, efficiency_pct=20.0, annual_ghi_kwh_m2=2000)
    wind_test = calculate_wind_power_density(wind_speed_m_s=8.5, elevation_m=100)

    engines_status = {
        "solar_engine": "operational" if solar_test.get("annual_yield_kwh") > 0 else "error",
        "wind_engine": "operational" if wind_test.get("wind_power_density_w_m2") > 0 else "error",
        "ai_ml_model_active": False,  # Explicitly zero AI/ML
        "mode": "deterministic_formulas_only"
    }

    return HealthCheckResponse(
        status="ok" if db_status.get("status") == "connected" else "degraded",
        version="1.0.0",
        environment="development" if "localhost" in settings.POSTGRES_SERVER or "db" in settings.POSTGRES_SERVER else "production",
        timestamp=datetime.now(timezone.utc).isoformat(),
        database=db_status,
        deterministic_engines=engines_status,
    )

