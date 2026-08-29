from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    projects,
    sites,
    admin,
    environmental,
    analysis,
    suitability,
    forecast,
    optimization,
    reports,
    notifications,
    comparison,
    analytics,
    ml,
)

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["Health & System"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & RBAC"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administrative User & Audit Management"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects Management"])
api_router.include_router(sites.router, prefix="/sites", tags=["Sites & GIS Intelligence"])
api_router.include_router(environmental.router, prefix="", tags=["Data Collection Engine & GIS Layers"])
api_router.include_router(analysis.router, prefix="", tags=["Solar & Wind Analysis Engines"])
api_router.include_router(suitability.router, prefix="", tags=["Site Suitability & Scoring Engine"])
api_router.include_router(forecast.router, prefix="", tags=["Energy Forecasting Engine"])
api_router.include_router(optimization.router, prefix="", tags=["Optimization & Recommendation Engines"])
api_router.include_router(reports.router, prefix="", tags=["Reports & Exports"])
api_router.include_router(notifications.router, prefix="", tags=["Notifications"])
api_router.include_router(comparison.router, prefix="", tags=["Site Comparison & Benchmarking"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["GIS & Analytics Dashboard Engine"])
api_router.include_router(ml.router, prefix="/ml", tags=["AI/ML Intelligence Layer"])

