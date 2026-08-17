import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


class DataSourceRegistry:
    """
    Configurable registry for external environmental, weather, and GIS data sources.
    Performs real-time connection health checks.
    """

    @staticmethod
    def get_registered_data_sources() -> list:
        return [
            {
                "id": "nasa_power",
                "name": "NASA POWER Meteorological Satellite API",
                "purpose": "Solar GHI/DNI irradiance, temperature, rainfall, humidity, cloud cover",
                "endpoint_url": settings.NASA_POWER_API_URL,
                "type": "REST / JSON",
                "is_active": True,
            },
            {
                "id": "open_meteo_wind",
                "name": "Open-Meteo Weather & 100m Wind Grid",
                "purpose": "100m Hub-height wind speed, wind direction, ambient pressure",
                "endpoint_url": settings.OPEN_METEO_API_URL,
                "type": "REST / JSON",
                "is_active": True,
            },
            {
                "id": "open_meteo_elevation",
                "name": "SRTM / Open-Meteo Digital Elevation Model (DEM)",
                "purpose": "Site elevation ASL, terrain slope profile",
                "endpoint_url": settings.OPEN_METEO_ELEVATION_API_URL,
                "type": "REST / JSON",
                "is_active": True,
            },
            {
                "id": "openstreetmap_overpass",
                "name": "OpenStreetMap Overpass Infrastructure API",
                "purpose": "Roads, substations, transmission lines, protected areas, water bodies",
                "endpoint_url": settings.OVERPASS_API_URL,
                "type": "Overpass QL / GeoJSON",
                "is_active": True,
            },
        ]

    @staticmethod
    async def check_data_sources_health() -> dict:
        """Asynchronously tests connection readiness of external APIs."""
        results = {}
        async with httpx.AsyncClient(timeout=5.0) as client:
            # 1. Test NASA POWER API
            try:
                r = await client.get(
                    f"{settings.NASA_POWER_API_URL}?parameters=ALLSKY_SWRAD_DAILY&community=RE&longitude=-117.0167&latitude=34.8958&start=20240101&end=20240102&format=JSON"
                )
                results["nasa_power"] = "connected" if r.status_code == 200 else f"HTTP {r.status_code}"
            except Exception as e:
                results["nasa_power"] = f"Unavailable: {str(e)}"

            # 2. Test Open-Meteo API
            try:
                r = await client.get(
                    f"{settings.OPEN_METEO_API_URL}?latitude=34.8958&longitude=-117.0167&current_weather=true"
                )
                results["open_meteo_wind"] = "connected" if r.status_code == 200 else f"HTTP {r.status_code}"
            except Exception as e:
                results["open_meteo_wind"] = f"Unavailable: {str(e)}"

            # 3. Test Open-Meteo Elevation API
            try:
                r = await client.get(
                    f"{settings.OPEN_METEO_ELEVATION_API_URL}?latitude=34.8958&longitude=-117.0167"
                )
                results["open_meteo_elevation"] = "connected" if r.status_code == 200 else f"HTTP {r.status_code}"
            except Exception as e:
                results["open_meteo_elevation"] = f"Unavailable: {str(e)}"

        return results
