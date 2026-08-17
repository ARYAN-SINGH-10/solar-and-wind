from typing import Optional
from pydantic import BaseModel


class HealthCheckResponse(BaseModel):
    status: str
    version: str
    environment: str
    timestamp: str
    database: dict
    deterministic_engines: dict
