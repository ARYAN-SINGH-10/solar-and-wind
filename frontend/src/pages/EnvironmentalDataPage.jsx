import React, { useState, useEffect } from 'react';
import { getSitesApi } from '../services/siteService';
import {
  checkDataSourcesHealthApi,
  fetchSiteEnvDataApi,
  getSiteEnvDataApi,
  submitManualEnvDataApi,
  getSiteInfraDataApi
} from '../services/analysisService';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import Modal from '../components/common/Modal';
import {
  CloudSun,
  Sun,
  Wind,
  Thermometer,
  Droplets,
  Mountain,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  Database,
  Navigation
} from 'lucide-react';

export default function EnvironmentalDataPage() {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [envRecords, setEnvRecords] = useState([]);
  const [infraRecords, setInfraRecords] = useState([]);
  const [apiHealth, setApiHealth] = useState(null);

  const [loading, setLoading] = useState(true);
  const [fetchingApi, setFetchingApi] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Manual Input Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualSolar, setManualSolar] = useState(2150);
  const [manualWind, setManualWind] = useState(7.45);
  const [manualTemp, setManualTemp] = useState(18.5);
  const [manualRainfall, setManualRainfall] = useState(120);
  const [manualHumidity, setManualHumidity] = useState(42);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const sitesRes = await getSitesApi();
      const sItems = sitesRes.items || sitesRes;
      setSites(sItems);

      let targetSiteId = selectedSiteId;
      if (!targetSiteId && sItems.length > 0) {
        targetSiteId = sItems[0].id;
        setSelectedSiteId(targetSiteId);
      }

      if (targetSiteId) {
        const records = await getSiteEnvDataApi(targetSiteId);
        setEnvRecords(records);
        const infra = await getSiteInfraDataApi(targetSiteId);
        setInfraRecords(infra);
      }

      const healthRes = await checkDataSourcesHealthApi();
      setApiHealth(healthRes.health);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load environmental records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSiteId]);

  const handleFetchExternalData = async () => {
    if (!selectedSiteId) return;
    setFetchingApi(true);
    setError('');
    setSuccessMsg('');

    try {
      const newRecord = await fetchSiteEnvDataApi(selectedSiteId);
      setSuccessMsg(`Successfully retrieved data from NASA POWER & Open-Meteo APIs for site.`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'External API connection error. You may use manual data entry.');
    } finally {
      setFetchingApi(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSiteId) return;

    try {
      await submitManualEnvDataApi(selectedSiteId, {
        solar_irradiance: Number(manualSolar),
        wind_speed: Number(manualWind),
        temperature: Number(manualTemp),
        rainfall: Number(manualRainfall),
        humidity: Number(manualHumidity),
        data_source: 'Manual Testing Fallback Entry',
      });
      setIsManualModalOpen(false);
      setSuccessMsg('Successfully logged manual environmental test record.');
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit manual environmental record.');
    }
  };

  const latestRecord = envRecords.length > 0 ? envRecords[0] : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CloudSun className="w-6 h-6 text-orange-500" />
            <span>Environmental & GIS Data Collection Engine</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Automated retrieval from NASA POWER, Open-Meteo Weather Grid, and OpenStreetMap spatial vectors.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4 text-orange-500" />
            <span>Manual Test Entry</span>
          </button>

          <button
            onClick={handleFetchExternalData}
            disabled={fetchingApi || !selectedSiteId}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${fetchingApi ? 'animate-spin' : ''}`} />
            <span>{fetchingApi ? 'Fetching Satellite Data...' : 'Fetch External Data'}</span>
          </button>
        </div>
      </div>

      {/* External Data Source API Health Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase block">NASA POWER API</span>
            <span className="text-xs font-bold text-slate-900">Solar GHI & Atmosphere</span>
          </div>
          <Badge type={apiHealth?.nasa_power === 'connected' ? 'success' : 'danger'}>
            {apiHealth?.nasa_power || 'CHECKING'}
          </Badge>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Open-Meteo Grid API</span>
            <span className="text-xs font-bold text-slate-900">100m Hub Wind Speed</span>
          </div>
          <Badge type={apiHealth?.open_meteo_wind === 'connected' ? 'success' : 'danger'}>
            {apiHealth?.open_meteo_wind || 'CHECKING'}
          </Badge>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase block">OSM Overpass API</span>
            <span className="text-xs font-bold text-slate-900">Grid Vectors & Roads</span>
          </div>
          <Badge type="success">CONNECTED</Badge>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-emerald-800 text-xs font-mono font-bold">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <ErrorMessage message={error} />

      {/* Site Selector Dropdown */}
      <Card title="Select Target Site for Data Ingest" subtitle="Choose candidate site coordinates">
        <select
          value={selectedSiteId}
          onChange={(e) => setSelectedSiteId(e.target.value)}
          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-mono font-bold"
        >
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.site_name} ({s.latitude}°N, {s.longitude}°W)
            </option>
          ))}
        </select>
      </Card>

      {loading ? (
        <Loading message="Loading site environmental records from database..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Environmental Telemetry Metrics */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Card>
                <div className="flex items-center space-x-2 text-orange-600 text-xs font-bold">
                  <Sun className="w-4 h-4" />
                  <span>Solar Irradiance</span>
                </div>
                <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">
                  {latestRecord?.solar_irradiance ? `${latestRecord.solar_irradiance} kWh/m²` : 'N/A'}
                </p>
              </Card>

              <Card>
                <div className="flex items-center space-x-2 text-sky-700 text-xs font-bold">
                  <Wind className="w-4 h-4" />
                  <span>100m Wind Speed</span>
                </div>
                <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">
                  {latestRecord?.wind_speed ? `${latestRecord.wind_speed} m/s` : 'N/A'}
                </p>
              </Card>

              <Card>
                <div className="flex items-center space-x-2 text-red-600 text-xs font-bold">
                  <Thermometer className="w-4 h-4" />
                  <span>Temperature</span>
                </div>
                <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">
                  {latestRecord?.temperature ? `${latestRecord.temperature} °C` : 'N/A'}
                </p>
              </Card>
            </div>

            {/* Environmental Observations History Table */}
            <Card title="Recorded Observations History" subtitle="Telemetry timestamp & data source provenance">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-orange-50/80 text-orange-950 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">Observation Date</th>
                      <th className="p-3">Solar GHI</th>
                      <th className="p-3">Wind Speed</th>
                      <th className="p-3">Temp</th>
                      <th className="p-3">Data Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {envRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="p-3 text-slate-900 font-bold">{r.observation_date}</td>
                        <td className="p-3 text-orange-600 font-bold">{r.solar_irradiance} kWh/m²</td>
                        <td className="p-3 text-sky-700 font-bold">{r.wind_speed} m/s</td>
                        <td className="p-3 font-semibold">{r.temperature} °C</td>
                        <td className="p-3 text-[11px] text-slate-500 font-sans">{r.data_source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Infrastructure Proximity Data */}
          <div className="space-y-6">
            <Card title="PostGIS Infrastructure Distances" subtitle="Grid, road, and water proximity vectors">
              <div className="space-y-3 text-xs">
                {infraRecords.map((inf, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Road Network Access</span>
                      <span className="text-slate-900 font-bold">{inf.roads}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Substation Proximity</span>
                      <span className="text-orange-600 font-bold">{inf.substations}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Transmission Lines</span>
                      <span className="text-sky-700 font-bold">{inf.transmission_lines}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Protected Reserves Setback</span>
                      <span className="text-emerald-700 font-bold">{inf.protected_areas}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Manual Data Input Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Manual Environmental Data Entry (Testing Fallback)"
      >
        <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Solar GHI (kWh/m²/yr)</label>
              <input
                type="number"
                value={manualSolar}
                onChange={(e) => setManualSolar(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-orange-600 font-mono font-bold focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">100m Wind Speed (m/s)</label>
              <input
                type="number"
                step="0.1"
                value={manualWind}
                onChange={(e) => setManualWind(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sky-700 font-mono font-bold focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Temp (°C)</label>
              <input
                type="number"
                value={manualTemp}
                onChange={(e) => setManualTemp(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Rainfall (mm)</label>
              <input
                type="number"
                value={manualRainfall}
                onChange={(e) => setManualRainfall(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Humidity (%)</label>
              <input
                type="number"
                value={manualHumidity}
                onChange={(e) => setManualHumidity(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 shadow-sm"
            >
              Submit Test Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

