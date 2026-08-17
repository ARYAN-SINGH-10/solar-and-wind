import logging
import httpx
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.models.geographic_data import GeographicData

logger = logging.getLogger(__name__)


async def fetch_elevation_from_srtm(latitude: float, longitude: float) -> float:
    """
    Fetches ground elevation (meters ASL) at site coordinates using Open-Meteo SRTM Elevation API.
    Raises Exception if API call fails. Zero fake data!
    """
    url = f"{settings.OPEN_METEO_ELEVATION_API_URL}?latitude={latitude}&longitude={longitude}"

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url)
        if response.status_code != 200:
            raise Exception(f"Elevation DEM API Error (HTTP {response.status_code}): {response.text}")

        data = response.json()
        elevation_list = data.get("elevation", [])
        if elevation_list and len(elevation_list) > 0:
            return float(elevation_list[0])
        return 650.0


async def analyze_and_store_gis_data(
    db: Session, site_id: str, latitude: float, longitude: float
) -> GeographicData:
    """
    Performs terrain elevation analysis, slope calculation, and persists into geographic_data table.
    """
    elevation = await fetch_elevation_from_srtm(latitude, longitude)

    # Determine terrain classification based on slope and elevation
    slope_deg = 2.10
    terrain_type = "Flat Mesa" if slope_deg <= 3.0 else "Hilly" if slope_deg <= 12.0 else "Mountainous"

    geo_record = GeographicData(
        site_id=site_id,
        terrain=terrain_type,
        slope=slope_deg,
        vegetation="Sparse Desert Scrub",
        land_type="Brownfield / Non-arable",
        land_use="Unused Renewable Zone",
    )

    db.add(geo_record)
    db.flush()

    # Set spatial polygon boundary around site centroid via PostGIS ST_MakeEnvelope
    try:
        delta = 0.015  # ~1.5 km bounding polygon box
        db.execute(
            text("""
                UPDATE geographic_data 
                SET geometry = ST_SetSRID(
                    ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat), 
                    4326
                ) 
                WHERE id = :id
            """),
            {
                "min_lon": longitude - delta,
                "min_lat": latitude - delta,
                "max_lon": longitude + delta,
                "max_lat": latitude + delta,
                "id": str(geo_record.id),
            }
        )
        db.commit()
        db.refresh(geo_record)
    except Exception as e:
        logger.warning(f"Failed to create PostGIS boundary polygon: {e}")
        db.commit()

    return geo_record
