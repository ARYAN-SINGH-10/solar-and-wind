-- ===================================================================
-- SOLAR & WIND DEPLOYMENT INTELLIGENCE PLATFORM
-- FULL POSTGRESQL + POSTGIS DATABASE INITIALIZATION SCRIPT
-- ===================================================================

-- Enable PostGIS geospatial extension & UUID generation
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------
-- 1. ROLES TABLE & SEED DATA ONLY
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed data for ROLES ONLY (as requested, no fake environmental data)
INSERT INTO roles (id, role_name, description) VALUES
(1, 'ENERGY_PLANNER', 'Responsible for solar/wind resource modeling, yield forecasting, and site scoring.'),
(2, 'GIS_ANALYST', 'Responsible for spatial layer ingestion, polygon boundary digitizing, and terrain slope analysis.'),
(3, 'PROJECT_MANAGER', 'Responsible for renewable energy project lifecycle management, site approvals, and reporting.'),
(4, 'ADMINISTRATOR', 'System administrative access, user RBAC management, and global weight configurations.')
ON CONFLICT (id) DO UPDATE 
SET role_name = EXCLUDED.role_name, description = EXCLUDED.description;

-- Reset sequence for roles table
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));

-- -------------------------------------------------------------------
-- 2. USERS TABLE
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    phone VARCHAR(50),
    organization VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- -------------------------------------------------------------------
-- 3. PROJECTS TABLE
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_name VARCHAR(255) NOT NULL,
    project_code VARCHAR(100) UNIQUE NOT NULL,
    region VARCHAR(255) NOT NULL,
    description TEXT,
    land_area NUMERIC(12, 4), -- in hectares / sq km
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, IN_REVIEW, APPROVED, ARCHIVED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(project_code);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- -------------------------------------------------------------------
-- 4. SITES TABLE (WITH POSTGIS LOCATION POINT)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    site_name VARCHAR(255) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    location GEOMETRY(Point, 4326) NOT NULL,
    region VARCHAR(255),
    land_area NUMERIC(12, 4), -- in sq km
    elevation NUMERIC(8, 2), -- in meters
    land_ownership VARCHAR(255), -- Public, Private, Lease
    existing_infrastructure TEXT,
    status VARCHAR(50) DEFAULT 'PROPOSED', -- Workflow: CREATED, DATA_PENDING, DATA_COLLECTED, ANALYZED, SUITABILITY_CALCULATED, SCORED, FORECASTED, OPTIMIZED, RECOMMENDATION_READY, REPORT_GENERATED | Administrative: PROPOSED, EVALUATING, APPROVED, REJECTED, ARCHIVED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sites_project_id ON sites(project_id);
CREATE INDEX IF NOT EXISTS idx_sites_location ON sites USING GIST (location);

-- -------------------------------------------------------------------
-- 5. ENVIRONMENTAL DATA TABLE
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS environmental_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    solar_irradiance NUMERIC(10, 2), -- kWh/m2/year or W/m2
    wind_speed NUMERIC(6, 2),        -- m/s
    wind_direction NUMERIC(5, 2),    -- degrees 0-360
    temperature NUMERIC(5, 2),       -- Celsius
    rainfall NUMERIC(8, 2),          -- mm/year
    humidity NUMERIC(5, 2),          -- %
    cloud_cover NUMERIC(5, 2),       -- %
    elevation NUMERIC(8, 2),         -- meters
    land_slope NUMERIC(5, 2),        -- degrees
    vegetation_index NUMERIC(5, 4),  -- NDVI (-1.0 to 1.0)
    observation_date DATE NOT NULL,
    data_source VARCHAR(255),        -- Satellite, Weather Station, ERA5, NASA POWER
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_env_data_site_id ON environmental_data(site_id);
CREATE INDEX IF NOT EXISTS idx_env_data_obs_date ON environmental_data(observation_date);

-- -------------------------------------------------------------------
-- 6. GEOGRAPHIC DATA TABLE (WITH POSTGIS GEOMETRY)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS geographic_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    terrain VARCHAR(100),            -- Flat, Hilly, Mountainous
    slope NUMERIC(5, 2),             -- degrees
    vegetation VARCHAR(100),         -- Forest, Grassland, Barren, Desert
    land_type VARCHAR(100),          -- Arable, Non-arable, Brownfield
    land_use VARCHAR(100),           -- Agriculture, Industrial, Unused
    geometry GEOMETRY(Polygon, 4326),-- Spatial boundary polygon
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_geo_data_site_id ON geographic_data(site_id);
CREATE INDEX IF NOT EXISTS idx_geo_data_geometry ON geographic_data USING GIST (geometry);

-- -------------------------------------------------------------------
-- 7. INFRASTRUCTURE DATA TABLE (WITH POSTGIS GEOMETRY)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS infrastructure_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    roads TEXT,                      -- Highway, Access Road metadata
    substations TEXT,                -- Substation name, voltage level
    transmission_lines TEXT,         -- KV grid capacity
    protected_areas TEXT,            -- National Parks, Wildlife Sanctuaries
    water_bodies TEXT,               -- Lakes, Rivers proximity
    distance_from_site NUMERIC(10, 2), -- Grid/Road distance in km
    geometry GEOMETRY(Geometry, 4326), -- Spatial feature shape
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_infra_data_site_id ON infrastructure_data(site_id);
CREATE INDEX IF NOT EXISTS idx_infra_data_geometry ON infrastructure_data USING GIST (geometry);

-- -------------------------------------------------------------------
-- 8. SOLAR ASSESSMENTS TABLE
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS solar_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    annual_irradiance NUMERIC(10, 2) NOT NULL, -- kWh/m2/year
    peak_sun_hours NUMERIC(6, 2) NOT NULL,     -- hours/day
    panel_efficiency NUMERIC(5, 2) NOT NULL,   -- %
    expected_energy_output NUMERIC(14, 2) NOT NULL, -- kWh/year
    capacity_factor NUMERIC(5, 2) NOT NULL,    -- %
    performance_ratio NUMERIC(5, 2) NOT NULL,  -- % (0.75-0.85)
    shading_factor NUMERIC(5, 2) DEFAULT 0.00,  -- %
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_solar_assessments_site_id ON solar_assessments(site_id);

-- -------------------------------------------------------------------
-- 9. WIND ASSESSMENTS TABLE
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wind_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    average_wind_speed NUMERIC(6, 2) NOT NULL,   -- m/s
    wind_power_density NUMERIC(10, 2) NOT NULL,  -- W/m2
    turbulence_intensity NUMERIC(5, 2),          -- %
    capacity_factor NUMERIC(5, 2) NOT NULL,      -- %
    expected_annual_energy_production NUMERIC(14, 2) NOT NULL, -- kWh/year
    turbine_suitability VARCHAR(100),            -- Class I, II, III
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wind_assessments_site_id ON wind_assessments(site_id);

-- -------------------------------------------------------------------
-- 10. SITE SUITABILITY TABLE
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_suitability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    renewable_resource_score NUMERIC(5, 2) NOT NULL,
    geographic_score NUMERIC(5, 2) NOT NULL,
    infrastructure_score NUMERIC(5, 2) NOT NULL,
    environmental_score NUMERIC(5, 2) NOT NULL,
    economic_score NUMERIC(5, 2) NOT NULL,
    overall_score NUMERIC(5, 2) NOT NULL,
    category VARCHAR(50) NOT NULL, -- Excellent, Highly Suitable, Moderately Suitable, Low Suitability, Unsuitable
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_site_suitability_site_id ON site_suitability(site_id);

-- -------------------------------------------------------------------
-- 11. SITE SCORES TABLE (FORMULA WEIGHTING ENFORCEMENT)
-- Weighting: Resource 35%, Geographic 25%, Infrastructure 15%, Environmental 15%, Economic 10%
-- Categories: 90-100 Excellent, 80-89 Highly Suitable, 65-79 Moderately Suitable, 50-64 Low Suitability, 0-49 Unsuitable
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    renewable_resource_score NUMERIC(5, 2) NOT NULL CHECK (renewable_resource_score BETWEEN 0 AND 100),
    geographic_score NUMERIC(5, 2) NOT NULL CHECK (geographic_score BETWEEN 0 AND 100),
    infrastructure_score NUMERIC(5, 2) NOT NULL CHECK (infrastructure_score BETWEEN 0 AND 100),
    environmental_score NUMERIC(5, 2) NOT NULL CHECK (environmental_score BETWEEN 0 AND 100),
    economic_score NUMERIC(5, 2) NOT NULL CHECK (economic_score BETWEEN 0 AND 100),
    overall_score NUMERIC(5, 2) NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
    category VARCHAR(50) NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_site_scores_site_id ON site_scores(site_id);

-- -------------------------------------------------------------------
-- 12. ENERGY FORECASTS TABLE
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS energy_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    technology VARCHAR(50) NOT NULL, -- SOLAR, WIND, HYBRID
    capacity_kw NUMERIC(12, 2) NOT NULL,
    monthly_generation JSONB,        -- Array of 12 monthly kWh values
    annual_generation NUMERIC(14, 2) NOT NULL, -- total kWh/year
    expected_revenue NUMERIC(14, 2),  -- in local currency / USD
    forecast_period VARCHAR(50) DEFAULT '25_YEARS',
    assumptions JSONB,               -- Tariff rate, degradation rate, O&M cost
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_energy_forecasts_site_id ON energy_forecasts(site_id);

-- -------------------------------------------------------------------
-- 13. DEPLOYMENT OPTIMIZATIONS TABLE
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deployment_optimizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    recommended_technology VARCHAR(50) NOT NULL, -- SOLAR, WIND, HYBRID
    recommended_capacity NUMERIC(12, 2) NOT NULL, -- in kW / MW
    recommended_location GEOMETRY(Point, 4326),
    grid_distance NUMERIC(10, 2),                 -- in km
    expansion_possible BOOLEAN DEFAULT TRUE,
    optimization_score NUMERIC(5, 2) NOT NULL,    -- 0 to 100
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deployment_opt_site_id ON deployment_optimizations(site_id);

-- -------------------------------------------------------------------
-- 14. RECOMMENDATIONS TABLE
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    technology VARCHAR(50) NOT NULL,
    expected_energy_output NUMERIC(14, 2) NOT NULL, -- kWh/year
    investment_estimate NUMERIC(14, 2) NOT NULL,    -- Currency
    expected_revenue NUMERIC(14, 2) NOT NULL,       -- Currency / year
    investment_payback NUMERIC(5, 2) NOT NULL,      -- Years
    recommendation_status VARCHAR(50) NOT NULL,     -- RECOMMENDED, CONDITIONALLY_RECOMMENDED, REJECTED
    explanation TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recommendations_site_id ON recommendations(site_id);

-- -------------------------------------------------------------------
-- 15. REPORTS TABLE (Enhanced with JSON payload storage)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    report_type VARCHAR(100) NOT NULL, -- SITE_SUITABILITY, SOLAR_ANALYSIS, WIND_ANALYSIS, ENERGY_FORECAST, FULL_FEASIBILITY, GIS_EXPORT
    title VARCHAR(512) NOT NULL,
    description TEXT,
    report_data JSONB,              -- Full structured JSON report payload
    file_path VARCHAR(512),         -- Optional physical export file path
    file_size_bytes INTEGER,
    status VARCHAR(50) DEFAULT 'GENERATED', -- GENERATED, EXPORTED, ARCHIVED
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_project_id ON reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_site_id ON reports(site_id);

-- -------------------------------------------------------------------
-- 16. NOTIFICATIONS TABLE
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- ALERT, APPROVAL, SYSTEM, REPORT_READY
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read_status);

-- -------------------------------------------------------------------
-- 17. SITE COMPARISON & JUNCTION TABLES (MULTI-SITE COMPARISON)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_comparisons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comparison_name VARCHAR(255) NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_comparison_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_comparison_id UUID NOT NULL REFERENCES site_comparisons(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_site_per_comparison UNIQUE (site_comparison_id, site_id)
);

CREATE INDEX IF NOT EXISTS idx_comp_items_comp_id ON site_comparison_items(site_comparison_id);
CREATE INDEX IF NOT EXISTS idx_comp_items_site_id ON site_comparison_items(site_id);

-- -------------------------------------------------------------------
-- 18. AUDIT LOGS TABLE
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, EXPORT
    entity VARCHAR(100) NOT NULL, -- PROJECT, SITE, SCORE, REPORT, USER
    entity_id VARCHAR(255),
    ip_address VARCHAR(45),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
