import React, { useState, useEffect } from 'react';
import { getDashboardAnalyticsApi } from '../../services/analyticsService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import { Map, Layers, Navigation, Compass, Mountain, ShieldCheck, Zap, Waves, ShieldAlert, Route } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function GisDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadGisData = async () => {
      setLoading(true);
      try {
        const data = await getDashboardAnalyticsApi();
        setAnalytics(data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load GIS analyst data.');
      } finally {
        setLoading(false);
      }
    };
    loadGisData();
  }, []);

  if (loading) return <Loading message="Loading GIS spatial layers and terrain metrics from backend..." />;
  if (error) return <ErrorMessage message={error} />;

  const gisInfo = analytics?.role_views?.gis_analyst || {};

  return (
    <div className="space-y-6">
      {/* Role Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-sky-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold font-mono">
            <span>ROLE: GIS ANALYST</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1.5 tracking-tight">Geospatial Spatial, Terrain & Infrastructure Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium">
            PostGIS EPSG:4326 spatial layers, digital elevation modeling, slope restrictions, and grid interconnect vectors.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            to="/map"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Map className="w-4 h-4" />
            Open Full GIS Canvas
          </Link>
        </div>
      </div>

      {/* GIS Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 text-xs flex items-center gap-1.5 font-medium"><Mountain className="w-3.5 h-3.5 text-emerald-600" /> Avg Elevation</span>
          <p className="text-2xl font-bold text-slate-900 font-mono">{gisInfo.avg_elevation_m} m</p>
          <span className="text-[10px] text-emerald-600 font-mono font-medium">SRTM DEM Sourced</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 text-xs flex items-center gap-1.5 font-medium"><Compass className="w-3.5 h-3.5 text-sky-600" /> Avg Land Area</span>
          <p className="text-2xl font-bold text-slate-900 font-mono">{gisInfo.avg_land_area_km2} km²</p>
          <span className="text-[10px] text-sky-600 font-mono font-medium">PostGIS ST_Area</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 text-xs flex items-center gap-1.5 font-medium"><Zap className="w-3.5 h-3.5 text-orange-500" /> Substations</span>
          <p className="text-2xl font-bold text-slate-900 font-mono">{gisInfo.substations_count} Nodes</p>
          <span className="text-[10px] text-orange-600 font-mono font-medium">Grid Interconnect</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 text-xs flex items-center gap-1.5 font-medium"><ShieldAlert className="w-3.5 h-3.5 text-red-600" /> Protected Areas</span>
          <p className="text-2xl font-bold text-slate-900 font-mono">{gisInfo.protected_areas_count} Zones</p>
          <span className="text-[10px] text-red-600 font-mono font-medium">500m Buffer Active</span>
        </div>
      </div>

      {/* Infrastructure & Environmental Data Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Terrain Slope Constraints" subtitle="ST_Slope calculation (< 15°)">
          <p className="text-xs text-slate-600 leading-relaxed">
            Slope steepness exceeds 15° for mountainous terrain, triggering construction penalty vectors and mounting structure reinforcement costs.
          </p>
          <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs flex justify-between">
            <span className="text-slate-500">Max Permissible Slope:</span>
            <span className="text-emerald-700 font-bold">15.0°</span>
          </div>
        </Card>

        <Card title="Infrastructure Interconnect" subtitle="Roads & Grid Lines">
          <p className="text-xs text-slate-600 leading-relaxed">
            Euclidean distance vectors computed using PostGIS <code className="text-orange-600 font-bold bg-orange-50 px-1 py-0.5 rounded border border-orange-200">ST_Distance</code> between site centroids and nearest substation node.
          </p>
          <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs flex justify-between">
            <span className="text-slate-500">Grid Lines Mapped:</span>
            <span className="text-orange-600 font-bold">{gisInfo.grid_lines_km} km</span>
          </div>
        </Card>

        <Card title="Environmental Buffer Zone" subtitle="Wildlife & Hydrology">
          <p className="text-xs text-slate-600 leading-relaxed">
            Automated 500m radius polygon buffer generated around water bodies and protected wildlife sanctuaries to prevent degradation.
          </p>
          <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs flex justify-between">
            <span className="text-slate-500">Environmental Records:</span>
            <span className="text-sky-700 font-bold">{gisInfo.environmental_records} Records</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

