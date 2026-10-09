import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.router import api_router

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("solar_wind_app")

# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Deterministic Solar & Wind Deployment Intelligence Platform REST API",
    version="1.0.0",
)

# CORS middleware configuration
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept"],
    )


# Security Headers & Request Auditing Middleware
@app.middleware("http")
async def add_security_headers_and_audit(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# Global Exception Handler to prevent sensitive traceback leakage
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception on {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred. The administrative team has been notified.",
            "type": "InternalServerError"
        },
    )


# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.on_event("startup")
def startup_db_client():
    logger.info("Initializing database tables if not created...")
    try:
        from sqlalchemy import text
        from sqlalchemy.orm import Session
        from app.models.role import Role

        # 1. Enable PostGIS & UUID extensions if supported
        try:
            with engine.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
                conn.commit()
                logger.info("PostGIS and uuid-ossp extensions checked/enabled.")
        except Exception as ext_err:
            logger.warning(f"Note on extensions check: {ext_err}")

        # 2. Create tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")

        # 3. Seed default RBAC roles if empty
        with Session(engine) as session:
            existing_roles = session.query(Role).count()
            if existing_roles == 0:
                logger.info("Seeding initial RBAC roles...")
                roles = [
                    Role(id=1, role_name="ENERGY_PLANNER", description="Responsible for solar/wind resource modeling, yield forecasting, and site scoring."),
                    Role(id=2, role_name="GIS_ANALYST", description="Responsible for spatial layer ingestion, polygon boundary digitizing, and terrain slope analysis."),
                    Role(id=3, role_name="PROJECT_MANAGER", description="Responsible for renewable energy project lifecycle management, site approvals, and reporting."),
                    Role(id=4, role_name="ADMINISTRATOR", description="System administrative access, user RBAC management, and global weight configurations."),
                ]
                session.add_all(roles)
                session.commit()
                logger.info("Initial RBAC roles seeded successfully.")
    except Exception as e:
        logger.error(f"Error during DB startup initialization: {e}")


@app.get("/")
def root():
    return {
        "title": settings.PROJECT_NAME,
        "status": "online",
        "docs_url": "/docs",
        "health_check": f"{settings.API_V1_STR}/health",
        "policy": "Hybrid Intelligence: Deterministic Engineering Calculations + AI/ML Predictions",
        "ai_ml_enabled": True,
        "ai_ml_capabilities": [
            "Solar Energy Prediction",
            "Wind Energy Prediction",
            "Site Suitability Classification",
            "Energy Generation Forecasting",
            "Investment Payback Prediction",
            "Investment Risk Classification",
            "Technology Recommendation",
        ],
    }
