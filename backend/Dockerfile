FROM python:3.11-slim

# Minimal system dependencies — avoids heavy libgdal-dev for Render free tier
# psycopg2-binary handles PostgreSQL natively (no libpq-dev compile needed)
# GeoAlchemy2 + Shapely use precompiled wheels (no GDAL dev headers needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libgeos-c1v5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Production FastAPI Uvicorn Command (1 worker for free-tier 512MB RAM)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers ${WORKERS:-1}"]
