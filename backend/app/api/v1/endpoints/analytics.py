from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.api.v1.deps import require_roles
from app.services.analytics_service import (
    get_dashboard_analytics,
    get_gis_layers_data,
)

router = APIRouter()


@router.get("/dashboard")
def get_dashboard_analytics_data(
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db),
):
    """
    Returns aggregated dashboard metrics:
    - 8 Summary Cards
    - 5 Chart Data Distributions
    - Role-Specific Metrics for Planner, GIS, Manager, Admin
    Data is computed dynamically from PostgreSQL/PostGIS. Zero fake data!
    """
    return get_dashboard_analytics(db=db)


@router.get("/gis-layers")
def get_gis_layers_analytics_data(
    current_user: User = Depends(require_roles(["ENERGY_PLANNER", "GIS_ANALYST", "PROJECT_MANAGER", "ADMINISTRATOR"])),
    db: Session = Depends(get_db),
):
    """
    Returns rich geospatial layer vectors:
    - Sites GeoJSON with popups
    - Roads, Transmission Lines, Substations
    - Water Bodies, Protected Areas
    - Solar & Wind heatmap layers
    """
    return get_gis_layers_data(db=db)
