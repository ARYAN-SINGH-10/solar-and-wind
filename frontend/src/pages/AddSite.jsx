import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjectsApi } from '../services/projectService';
import { createSiteApi } from '../services/siteService';
import Card from '../components/common/Card';
import ErrorMessage from '../components/common/ErrorMessage';
import { MapPin, ArrowLeft, Map, CheckCircle2, Crosshair } from 'lucide-react';

export default function AddSite() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [siteName, setSiteName] = useState('');
  const [latitude, setLatitude] = useState(34.8958);
  const [longitude, setLongitude] = useState(-117.0167);
  const [region, setRegion] = useState('Southern California');
  const [landArea, setLandArea] = useState(12.5);
  const [elevation, setElevation] = useState(650);
  const [landOwnership, setLandOwnership] = useState('Public Lease');
  const [existingInfra, setExistingInfra] = useState('230kV Substation within 4.2 km');
  const [status, setStatus] = useState('PROPOSED');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadProj() {
      try {
        const pList = await getProjectsApi();
        const items = pList.items || pList;
        setProjects(items);
        if (items.length > 0) setProjectId(items[0].id);
      } catch (err) {
        setError('Failed to load project list.');
      }
    }
    loadProj();
  }, []);

  // Map Click Simulation Helper
  const handleMapClickPreset = (lat, lon, presetName) => {
    setLatitude(lat);
    setLongitude(lon);
    setSiteName(presetName);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Front-end Coordinate Bounds Validation
    if (latitude < -90 || latitude > 90) {
      setError('Latitude must be between -90.0 and +90.0 degrees.');
      return;
    }
    if (longitude < -180 || longitude > 180) {
      setError('Longitude must be between -180.0 and +180.0 degrees.');
      return;
    }

    setLoading(true);

    try {
      await createSiteApi({
        project_id: projectId,
        site_name: siteName,
        latitude: Number(latitude),
        longitude: Number(longitude),
        region,
        land_area: Number(landArea),
        elevation: Number(elevation),
        land_ownership: landOwnership,
        existing_infrastructure: existingInfra,
        status,
      });
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create site with PostGIS POINT location.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/sites')}
        className="flex items-center space-x-2 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Candidate Sites</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Container */}
        <Card title="Add Candidate Deployment Site" subtitle="PostGIS ST_SetSRID(ST_MakePoint(lon, lat), 4326)">
          <ErrorMessage message={error} />

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Parent Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-medium"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_name} ({p.project_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Site Name</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="e.g. Barstow Mesa Sector Alpha"
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Latitude (°N)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-orange-600 font-mono font-bold focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Longitude (°E/W)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-orange-600 font-mono font-bold focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Land Area (sq km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={landArea}
                  onChange={(e) => setLandArea(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Elevation (m ASL)</label>
                <input
                  type="number"
                  value={elevation}
                  onChange={(e) => setElevation(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Existing Infrastructure Access</label>
              <input
                type="text"
                value={existingInfra}
                onChange={(e) => setExistingInfra(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 text-xs mt-2"
            >
              {loading ? 'Executing ST_MakePoint & Creating Site...' : 'Create PostGIS Candidate Site'}
            </button>
          </form>
        </Card>

        {/* Interactive Map Picker Simulation */}
        <Card title="Map-Based Coordinate Selector" subtitle="Click map location presets to set coordinates">
          <div className="space-y-4 text-xs">
            <div className="relative h-64 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
              <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-60"></div>
              
              <div className="relative z-10 space-y-2">
                <Crosshair className="w-8 h-8 text-orange-500 animate-bounce mx-auto" />
                <p className="font-bold text-slate-900">Active Location Coordinates:</p>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-orange-600 font-bold text-sm shadow-xs">
                  {latitude}°N, {longitude}°W
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-700 block">Select Map Candidate Presets:</span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => handleMapClickPreset(34.8958, -117.0167, 'Barstow Mesa Sector Alpha')}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-orange-300 text-left flex items-center justify-between text-slate-700 hover:text-slate-900 transition-colors shadow-xs"
                >
                  <span className="font-bold">Preset 1: Barstow Mesa Sector Alpha</span>
                  <span className="font-mono text-orange-600 font-bold">34.8958°N, -117.0167°W</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMapClickPreset(34.4362, -116.9112, 'Lucerne Valley High Mesa')}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-orange-300 text-left flex items-center justify-between text-slate-700 hover:text-slate-900 transition-colors shadow-xs"
                >
                  <span className="font-bold">Preset 2: Lucerne Valley High Mesa</span>
                  <span className="font-mono text-orange-600 font-bold">34.4362°N, -116.9112°W</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMapClickPreset(35.0112, -118.1750, 'Mojave North Wind Pass')}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-orange-300 text-left flex items-center justify-between text-slate-700 hover:text-slate-900 transition-colors shadow-xs"
                >
                  <span className="font-bold">Preset 3: Mojave North Wind Pass</span>
                  <span className="font-mono text-orange-600 font-bold">35.0112°N, -118.1750°W</span>
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

