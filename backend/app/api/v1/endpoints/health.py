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

    # Verify deterministic calculation engines (authoritative math)
    solar_test = calculate_solar_yield(area_sq_m=1000, efficiency_pct=20.0, annual_ghi_kwh_m2=2000)
    wind_test = calculate_wind_power_density(wind_speed_m_s=8.5, elevation_m=100)
    solar_ok = solar_test.get("annual_yield_kwh", 0) > 0
    wind_ok = wind_test.get("wind_power_density_w_m2", 0) > 0

    # Dynamically verify all seven AI/ML capabilities without hardcoding
    from app.services.ml_service import check_ml_capabilities_health
    ml_health = check_ml_capabilities_health()

    # Determine system intelligence mode based on actual component readiness
    if solar_ok and wind_ok and ml_health["is_operational"]:
        mode = "hybrid_deterministic_and_ml"
    elif solar_ok and wind_ok and ml_health["active_count"] > 0:
        mode = "hybrid_degraded_ml"
    elif solar_ok and wind_ok:
        mode = "deterministic_formulas_only"
    else:
        mode = "degraded"

    engines_status = {
        "solar_engine": "operational" if solar_ok else "error",
        "wind_engine": "operational" if wind_ok else "error",
        "ai_ml_model_active": ml_health["is_operational"],
        "mode": mode,
        "ai_ml_capabilities": ml_health["capabilities_summary"],
    }

    ai_ml_services = {
        "status": "operational" if ml_health["is_operational"] else ("degraded" if ml_health["active_count"] > 0 else "unavailable"),
        "mode": mode,
        "active_capabilities_count": ml_health["active_count"],
        "total_capabilities_count": ml_health["total_count"],
        "model_version": ml_health.get("model_version", "2.0.0"),
        "dataset_source": ml_health.get("dataset_source"),
        "capabilities": ml_health["capabilities_detail"],
    }

    overall_ok = (db_status.get("status") == "connected" and solar_ok and wind_ok)

    return HealthCheckResponse(
        status="ok" if overall_ok else "degraded",
        version="1.0.0",
        environment="development" if "localhost" in settings.POSTGRES_SERVER or "db" in settings.POSTGRES_SERVER else "production",
        timestamp=datetime.now(timezone.utc).isoformat(),
        database=db_status,
        deterministic_engines=engines_status,
        ai_ml_services=ai_ml_services,
    )

