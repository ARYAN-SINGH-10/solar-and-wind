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
import { predictWindML } from '../services/mlService';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import Badge from '../components/common/Badge';
import { Wind, MapPin, Calculator, CheckCircle2, Cpu, AlertTriangle, RefreshCw } from 'lucide-react';

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

  // AI / ML State
  const [mlResult, setMlResult] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState('');

  const fetchMLWindPrediction = async (site, numTurb, ratingMw, rDiam) => {
    setMlLoading(true);
    setMlError('');
    try {
      const rArea = Math.PI * Math.pow(Number(rDiam) / 2.0, 2);
      const res = await predictWindML({
        mean_wind_speed: 7.5,
        wind_power_density: 250.0,
        air_density: Number(airDensity),
        elevation: site ? Number(site.elevation || 650.0) : 650.0,
        latitude: site ? Number(site.latitude || 23.25) : 23.25,
        longitude: site ? Number(site.longitude || 77.41) : 77.41,
        rotor_area: rArea,
        turbine_rating_mw: Number(ratingMw),
        num_turbines: Number(numTurb),
        capacity_factor_pct: 32.5,
      });
      setMlResult(res);
    } catch (err) {
      setMlError('AI/ML service unavailable. Showing deterministic analysis.');
    } finally {
      setMlLoading(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const sRes = await getSitesApi({ limit: 100 });
        const siteList = sRes.items || sRes;
        setSites(siteList);
        if (siteList.length > 0) {
          const firstSite = siteList[0];
          setSelectedSiteId(firstSite.id);
          fetchMLWindPrediction(firstSite, numTurbines, turbineRating, rotorDiameter);
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
        const currentSite = sites.find((s) => String(s.id) === String(selectedSiteId));
        fetchMLWindPrediction(currentSite, numTurbines, turbineRating, rotorDiameter);
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
      const currentSite = sites.find((s) => String(s.id) === String(selectedSiteId));
      fetchMLWindPrediction(currentSite, numTurbines, turbineRating, rotorDiameter);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to run wind calculation engine.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <Loading message="Loading wind potential site parameters..." />;

  const latestAssessment = assessments.length > 0 ? assessments[0] : null;
  const detWindGen = latestAssessment ? Number(latestAssessment.expected_annual_energy_production) : null;
  const mlWindGen = mlResult ? Number(mlResult.prediction_annual_mwh) : null;
  const windDiff = detWindGen && mlWindGen ? (mlWindGen - detWindGen) : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center flex-shrink-0">
            <Wind className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Wind Resource Analysis & AI Intelligence</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Fluid mechanics aerodynamic wind power modeling coupled with Random Forest Machine Learning resource prediction.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge type="warning">DETERMINISTIC FLUID DYNAMICS</Badge>
          <Badge type="orange">AI/ML PREDICTION LAYER</Badge>
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

        {/* Calculated Results & AI Intelligence */}
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
              <span className="text-xs text-slate-500 font-medium block">Deterministic AEP</span>
              <span className="text-lg font-extrabold text-emerald-600 font-mono">
                {latestAssessment ? `${fmtNum(latestAssessment.expected_annual_energy_production)} MWh` : 'N/A'}
              </span>
            </Card>

            <Card>
              <span className="text-xs text-slate-500 font-medium block">IEC Turbine Class</span>
              <span className="text-xs font-bold text-orange-600 font-mono">
                {latestAssessment ? latestAssessment.turbine_suitability : 'N/A'}
              </span>
            </Card>
          </div>

          {/* AI / ML Wind Prediction Component */}
          <div className="bg-white border-2 border-orange-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-orange-100 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-orange-500" />
                <h3 className="font-extrabold text-slate-900 text-sm">AI / ML Wind Generation Prediction</h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-orange-100 text-orange-800 rounded-md">
                ADDITIONAL ML INTELLIGENCE
              </span>
            </div>

            {mlLoading ? (
              <div className="py-6 text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                <span>Computing Random Forest Regressor Prediction...</span>
              </div>
            ) : mlError ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{mlError}</span>
              </div>
            ) : mlResult ? (
              <div className="space-y-4 text-xs">
                {/* Comparison Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500 font-medium block">Deterministic Physics AEP</span>
                    <span className="text-base font-extrabold text-slate-900 font-mono">
                      {detWindGen ? `${fmtNum(detWindGen)} MWh` : 'N/A'}
                    </span>
                  </div>

                  <div className="p-3 bg-orange-50/80 border border-orange-200 rounded-xl">
                    <span className="text-[11px] text-orange-800 font-medium block">AI/ML Predicted AEP</span>
                    <span className="text-base font-extrabold text-orange-600 font-mono">
                      {fmtNum(mlResult.prediction_annual_mwh)} MWh
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                    <span className="text-[11px] text-emerald-800 font-medium block">Variance (ML vs Det)</span>
                    <span className="text-base font-extrabold text-emerald-700 font-mono">
                      {windDiff !== null ? `${windDiff > 0 ? '+' : ''}${fmtNum(windDiff)} MWh` : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Prediction Interval Box */}
                <div className="p-3 bg-orange-50/40 border border-orange-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-orange-950 block">Residual-based 95% Prediction Interval:</span>
                  <p className="font-mono text-xs font-bold text-slate-800">
                    [{fmtNum(mlResult.prediction_interval?.lower_bound_mwh)} MWh — {fmtNum(mlResult.prediction_interval?.upper_bound_mwh)} MWh]
                  </p>
                  <p className="text-[10px] text-slate-500 font-sans">
                    Statistical bounds based on ±1.96 × Model Test RMSE ({mlResult.model_metrics?.rmse} MWh/yr).
                  </p>
                </div>

                {/* Metadata & Disclaimers */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] text-slate-500 font-mono gap-1">
                  <span>Model: {mlResult.model} | R²: {mlResult.model_metrics?.r2}</span>
                  <span>Dataset: {mlResult.dataset_source}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                  Disclaimer: Calibrated development training model. Does not replace physical fluid dynamics calculation engine.
                </div>
              </div>
            ) : null}
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
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
