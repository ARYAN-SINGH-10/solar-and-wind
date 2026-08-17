from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

db_uri = settings.SQLALCHEMY_DATABASE_URI
try:
    engine = create_engine(
        db_uri,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )
except Exception:
    from sqlalchemy.pool import StaticPool
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator:
    """Dependency for obtaining database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> dict:
    """Helper function to verify database and PostGIS extension readiness."""
    try:
        with engine.connect() as connection:
            db_res = connection.execute(text("SELECT 1")).scalar()
            
            try:
                postgis_version = connection.execute(text("SELECT PostGIS_Full_Version()")).scalar()
                has_postgis = True
            except Exception as postgis_err:
                postgis_version = f"PostGIS unavailable: {str(postgis_err)}"
                has_postgis = False

            return {
                "status": "connected" if db_res == 1 else "error",
                "database": settings.POSTGRES_DB,
                "has_postgis": has_postgis,
                "postgis_version": postgis_version,
            }
    except Exception as e:
        return {
            "status": "disconnected",
            "error": str(e),
            "database": settings.POSTGRES_DB,
            "has_postgis": False,
            "postgis_version": "N/A",
        }
