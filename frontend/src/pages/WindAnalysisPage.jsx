import React, { useState, useEffect } from 'react';

// Safe number formatter — never throws on null/undefined
function fmtNum(value, digits = 2) {
  if (value === null || value === undefined || value === '') return 'N/A';
  const n = Number(value);
  if (Number.isNaN(n)) return 'N/A';
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}
import { getSitesApi } from '../services/siteService';
import { runWindAnalysisApi, getWindAssessmentsApi } from '../services/analysisService';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { Wind, MapPin, Calculator, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function WindAnalysisPage() {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Input form state (defaults)
  const [airDensity, setAirDensity] = useState(1.225);
  const [turbineEff, setTurbineEff] = useState(45.0);
  const [rotorDiameter, setRotorDiameter] = useState(126.0);
  const [numTurbines, setNumTurbines] = useState(5);
  const [operatingHours, setOperatingHours] = useState(8760.0);
  const [turbineRating, setTurbineRating] = useState(3.0);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const sRes = await getSitesApi({ limit: 100 });
        const siteList = sRes.items || sRes;
        setSites(siteList);
        if (siteList.length > 0) {
          setSelectedSiteId(siteList[0].id);
        }
      } catch (err) {
        setError('Failed to load candidate sites.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedSiteId) return;
    async function loadAssessments() {
      try {
        const data = await getWindAssessmentsApi(selectedSiteId);
        setAssessments(data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load wind assessments.');
      }
    }
    loadAssessments();
  }, [selectedSiteId]);

  const handleRunAnalysis = async (e) => {
    e.preventDefault();
    if (!selectedSiteId) return;
    setAnalyzing(true);
    setError('');
    setSuccessMsg('');

    try {
      await runWindAnalysisApi(selectedSiteId, {
        air_density_kg_m3: Number(airDensity),
        turbine_efficiency_pct: Number(turbineEff),
        rotor_diameter_m: Number(rotorDiameter),
        num_turbines: Number(numTurbines),
        operating_hours_yr: Number(operatingHours),
        turbine_rating_mw: Number(turbineRating),
      });

      setSuccessMsg('Successfully executed deterministic fluid dynamics wind analysis and stored assessment.');
      const updated = await getWindAssessmentsApi(selectedSiteId);
      setAssessments(updated);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to run wind calculation engine.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <Loading message="Loading wind potential site parameters..." />;

  const latestAssessment = assessments.length > 0 ? assessments[0] : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center flex-shrink-0">
            <Wind className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Deterministic Wind Analysis Engine</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Fluid mechanics aerodynamic wind power modeling based on hub-height velocity and atmospheric air density profiles.
            </p>
          </div>
        </div>
      </div>

      <ErrorMessage message={error} />
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Parameters Controls */}
        <Card title="Select Target Deployment Site" subtitle="Candidate site coordinates for wind power density modeling">
          <form onSubmit={handleRunAnalysis} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Deployment Site</label>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-medium"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.site_name} ({parseFloat(s.latitude).toFixed(4)}°, {parseFloat(s.longitude).toFixed(4)}°)
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-slate-200 pt-3">
              <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider block mb-2 font-mono">
                Turbine & Atmospheric Parameters
              </span>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Air Density (ρ in kg/m³)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={airDensity}
                    onChange={(e) => setAirDensity(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Turbine Rating (MW)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={turbineRating}
                      onChange={(e) => setTurbineRating(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Number of Turbines</label>
                    <input
                      type="number"
                      value={numTurbines}
                      onChange={(e) => setNumTurbines(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Rotor Diameter (m)</label>
                    <input
                      type="number"
                      value={rotorDiameter}
                      onChange={(e) => setRotorDiameter(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Turbine Efficiency (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={turbineEff}
                      onChange={(e) => setTurbineEff(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={analyzing || !selectedSiteId}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 text-xs flex items-center justify-center space-x-2 mt-2"
            >
              <Calculator className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
              <span>{analyzing ? 'Executing Fluid Calculation...' : 'Run Wind Analysis Engine'}</span>
            </button>
          </form>
        </Card>

        {/* Calculated Results & Fluid Dynamics Formula Explanation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Output Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Card>
              <span className="text-xs text-slate-500 font-medium block">Mean Wind Speed</span>
              <span className="text-lg font-extrabold text-sky-700 font-mono">
                {latestAssessment ? `${latestAssessment.average_wind_speed} m/s` : 'N/A'}
              </span>
            </Card>

            <Card>
              <span className="text-xs text-slate-500 font-medium block">Wind Power Density</span>
              <span className="text-lg font-extrabold text-slate-900 font-mono">
                {latestAssessment ? `${latestAssessment.wind_power_density} W/m²` : 'N/A'}
              </span>
            </Card>

            <Card>
              <span className="text-xs text-slate-500 font-medium block">Capacity Factor</span>
              <span className="text-lg font-extrabold text-sky-600 font-mono">
                {latestAssessment ? `${latestAssessment.capacity_factor}%` : 'N/A'}
              </span>
            </Card>

            <Card>
              <span className="text-xs text-slate-500 font-medium block">Annual Gen (AEP)</span>
              <span className="text-lg font-extrabold text-emerald-600 font-mono">
                {latestAssessment ? `${latestAssessment.expected_annual_energy_production.toLocaleString()} MWh` : 'N/A'}
              </span>
            </Card>

            <Card>
              <span className="text-xs text-slate-500 font-medium block">IEC Turbine Class</span>
              <span className="text-xs font-bold text-orange-600 font-mono">
                {latestAssessment ? latestAssessment.turbine_suitability : 'N/A'}
              </span>
            </Card>
          </div>

          {/* Formula Transparency Box */}
          <Card title="Transparent Fluid Dynamics Formula Structure" subtitle="100% Reproducible Wind Energy Equation">
            <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200 space-y-2 text-xs font-mono text-slate-800">
              <p className="text-orange-700 font-bold">
                Wind Power Density (W/m²) = 0.5 × Air Density (ρ) × Wind Speed³
              </p>
              <p className="text-[11px] text-slate-600 font-sans">
                P_effective = min(P_aerodynamic, P_nameplate) | Capacity Factor (%) = (P_effective / P_nameplate) × 100
              </p>
              <p className="text-[11px] text-slate-600 font-sans">
                Annual Energy Production (MWh) = P_effective × Operating Hours / 1,000,000
              </p>
              <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-orange-200 font-sans">
                <span>Data Provenance: Open-Meteo Weather Grid 100m Wind Telemetry</span>
                <span>Timestamp: {latestAssessment ? new Date(latestAssessment.created_at).toLocaleString() : 'N/A'}</span>
              </div>
            </div>
          </Card>

          {/* Assessment History Table */}
          <Card title="Stored Assessment History" subtitle="Audit records of stored inputs and calculations">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-orange-50/80 text-orange-950 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 font-mono">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Wind Speed</th>
                    <th className="p-3">WPD (W/m²)</th>
                    <th className="p-3">Capacity Factor</th>
                    <th className="p-3">Expected AEP</th>
                    <th className="p-3">Suitability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {assessments.map((a) => (
                    <tr key={a.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="p-3 text-slate-500 font-sans">{new Date(a.created_at).toLocaleTimeString()}</td>
                      <td className="p-3 text-sky-700 font-bold">{a.average_wind_speed} m/s</td>
                      <td className="p-3 font-bold">{a.wind_power_density} W/m²</td>
                      <td className="p-3 text-sky-600 font-bold">{a.capacity_factor}%</td>
                      <td className="p-3 text-emerald-600 font-bold">{fmtNum(a.expected_annual_energy_production)} MWh</td>
                      <td className="p-3 text-orange-600 text-[11px] font-bold">{a.turbine_suitability}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

