import os
import json
from typing import List, Optional, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Solar & Wind Deployment Intelligence Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "super_secret_jwt_key_solar_wind_platform_2026_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "solar_wind_db"

    DATABASE_URL: Optional[str] = None
    SQLALCHEMY_DATABASE_URI: Optional[str] = None

    @field_validator("DATABASE_URL", "SQLALCHEMY_DATABASE_URI", mode="before")
    @classmethod
    def fix_db_scheme(cls, v: Optional[str]) -> Optional[str]:
        if isinstance(v, str) and v:
            clean = v.strip()
            if clean.startswith("postgres://"):
                return clean.replace("postgres://", "postgresql+psycopg2://", 1)
            elif clean.startswith("postgresql://"):
                return clean.replace("postgresql://", "postgresql+psycopg2://", 1)
            return clean
        return v

    def get_db_uri(self) -> str:
        """Return the effective database URI, preferring DATABASE_URL over individual params."""
        if self.DATABASE_URL:
            return self.DATABASE_URL.strip()
        if self.SQLALCHEMY_DATABASE_URI:
            return self.SQLALCHEMY_DATABASE_URI.strip()
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # External Data Source API Endpoints
    NASA_POWER_API_URL: str = "https://power.larc.nasa.gov/api/temporal/daily/point"
    OPEN_METEO_API_URL: str = "https://api.open-meteo.com/v1/forecast"
    OPEN_METEO_ELEVATION_API_URL: str = "https://api.open-meteo.com/v1/elevation"
    OVERPASS_API_URL: str = "https://overpass-api.de/api/interpreter"

    BACKEND_CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="after")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, list):
            return [str(x) for x in v]
        if isinstance(v, str):
            stripped = v.strip()
            if stripped.startswith("["):
                try:
                    parsed = json.loads(stripped)
                    if isinstance(parsed, list):
                        return [str(item) for item in parsed]
                except Exception:
                    pass
            # Split comma-delimited strings or handle "*"
            origins = [origin.strip() for origin in stripped.split(",") if origin.strip()]
            return origins if origins else ["*"]
        return [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:8000",
        ]

    model_config = {"case_sensitive": True, "env_file": ".env", "extra": "ignore"}


settings = Settings()
