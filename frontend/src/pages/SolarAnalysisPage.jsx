import React, { useState, useEffect } from 'react';

// Safe number formatter — never throws on null/undefined
function fmtNum(value, digits = 2) {
  if (value === null || value === undefined || value === '') return 'N/A';
  const n = Number(value);
  if (Number.isNaN(n)) return 'N/A';
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

import { getSitesApi } from '../services/siteService';
import { runSolarAnalysisApi, getSolarAssessmentsApi } from '../services/analysisService';
import { predictSolarML } from '../services/mlService';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import ErrorMessage from '../components/common/ErrorMessage';
import { Sun, Calculator, CheckCircle2, Cpu, AlertTriangle, RefreshCw, Zap } from 'lucide-react';

export default function SolarAnalysisPage() {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [assessments, setAssessments] = useState([]);

  // Configurable Solar Assumptions
  const [capacityMw, setCapacityMw] = useState(10.0);
  const [panelEff, setPanelEff] = useState(21.5);
  const [baselinePr, setBaselinePr] = useState(0.82);
  const [systemLoss, setSystemLoss] = useState(14.0);
  const [shadingLoss, setShadingLoss] = useState(3.0);

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // AI / ML State
  const [mlResult, setMlResult] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState('');

  const fetchMLPrediction = async (site, capMw) => {
    setMlLoading(true);
    setMlError('');
    try {
      const res = await predictSolarML({
        ghi: 2150.0,
        dni: 2300.0,
        temperature: 22.5,
        elevation: site ? Number(site.elevation || 650.0) : 650.0,
        slope: site ? Number(site.slope || 2.5) : 2.5,
        latitude: site ? Number(site.latitude || 23.25) : 23.25,
        longitude: site ? Number(site.longitude || 77.41) : 77.41,
        installed_capacity_mw: Number(capMw),
      });
      setMlResult(res);
    } catch (err) {
      setMlError('AI/ML service unavailable. Showing deterministic analysis.');
    } finally {
      setMlLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const sitesRes = await getSitesApi();
      const sItems = sitesRes.items || sitesRes;
      setSites(sItems);

      let targetSiteId = selectedSiteId;
      let currentSite = null;

      if (!targetSiteId && sItems.length > 0) {
        targetSiteId = sItems[0].id;
        setSelectedSiteId(targetSiteId);
        currentSite = sItems[0];
      } else {
        currentSite = sItems.find((s) => String(s.id) === String(targetSiteId));
      }

      if (targetSiteId) {
        const history = await getSolarAssessmentsApi(targetSiteId);
        setAssessments(history);
      }

      fetchMLPrediction(currentSite, capacityMw);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load solar assessments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSiteId]);

  const handleRunAnalysis = async () => {
    if (!selectedSiteId) return;
    setAnalyzing(true);
    setError('');
    setSuccessMsg('');

    try {
      const result = await runSolarAnalysisApi(selectedSiteId, {
        installed_capacity_mw: Number(capacityMw),
        panel_efficiency_pct: Number(panelEff),
        performance_ratio: Number(baselinePr),
        system_loss_pct: Number(systemLoss),
        shading_loss_pct: Number(shadingLoss),
      });
      setSuccessMsg('Successfully executed deterministic solar analysis and stored assessment.');
      const currentSite = sites.find((s) => String(s.id) === String(selectedSiteId));
      fetchMLPrediction(currentSite, capacityMw);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to run solar calculation engine.');
    } finally {
      setAnalyzing(false);
    }
  };

  const latestAssessment = assessments.length > 0 ? assessments[0] : null;
  const detAnnualGen = latestAssessment ? Number(latestAssessment.expected_energy_output) : null;
  const mlAnnualGen = mlResult ? Number(mlResult.prediction_annual_mwh) : null;
  const genDiff = detAnnualGen && mlAnnualGen ? (mlAnnualGen - detAnnualGen) : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Sun className="w-6 h-6 text-orange-500" />
            <span>Solar Energy Analysis & AI Intelligence</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Physical photovoltaic performance modeling integrated with Gradient Boosting Machine Learning predictions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge type="warning">DETERMINISTIC PHYSICS</Badge>
          <Badge type="orange">AI/ML PREDICTION LAYER</Badge>
        </div>
      </div>

      {/* Target Site Selector */}
      <Card title="Select Target Deployment Site" subtitle="Candidate site coordinates for solar yield modeling">
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

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-emerald-800 text-xs font-mono font-bold">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <ErrorMessage message={error} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Assumptions Controls Panel */}
        <Card title="Configurable Solar Assumptions" subtitle="Adjust array capacity & system losses">
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-700 font-bold mb-1">
                <span>Installed PV Capacity (MW):</span>
                <span className="text-orange-600 font-mono font-bold">{capacityMw} MW</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="200.0"
                step="0.5"
                value={capacityMw}
                onChange={(e) => setCapacityMw(Number(e.target.value))}
                className="w-full accent-orange-500 bg-slate-100 rounded-lg h-2"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-700 font-bold mb-1">
                <span>Panel Efficiency (%):</span>
                <span className="text-slate-900 font-mono font-bold">{panelEff}%</span>
              </div>
              <input
                type="range"
                min="12.0"
                max="30.0"
                step="0.5"
                value={panelEff}
                onChange={(e) => setPanelEff(Number(e.target.value))}
                className="w-full accent-orange-500 bg-slate-100 rounded-lg h-2"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-700 font-bold mb-1">
                <span>Baseline Performance Ratio (PR):</span>
                <span className="text-slate-900 font-mono font-bold">{baselinePr}</span>
              </div>
              <input
                type="range"
                min="0.60"
                max="0.95"
                step="0.01"
                value={baselinePr}
                onChange={(e) => setBaselinePr(Number(e.target.value))}
                className="w-full accent-orange-500 bg-slate-100 rounded-lg h-2"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-700 font-bold mb-1">
                <span>System & Cable Loss (%):</span>
                <span className="text-slate-900 font-mono font-bold">{systemLoss}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="30.0"
                step="0.5"
                value={systemLoss}
                onChange={(e) => setSystemLoss(Number(e.target.value))}
                className="w-full accent-orange-500 bg-slate-100 rounded-lg h-2"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-700 font-bold mb-1">
                <span>Shading & Soiling Loss (%):</span>
                <span className="text-slate-900 font-mono font-bold">{shadingLoss}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="20.0"
                step="0.5"
                value={shadingLoss}
                onChange={(e) => setShadingLoss(Number(e.target.value))}
                className="w-full accent-orange-500 bg-slate-100 rounded-lg h-2"
              />
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={analyzing || !selectedSiteId}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 text-xs flex items-center justify-center space-x-2 mt-2"
            >
              <Calculator className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
              <span>{analyzing ? 'Executing Calculation...' : 'Run Solar Analysis Engine'}</span>
            </button>
          </div>
        </Card>

        {/* Calculated Results & AI Intelligence Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Output Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <span className="text-xs text-slate-500 font-medium block">Annual Irradiance</span>
              <span className="text-xl font-extrabold text-orange-600 font-mono">
                {latestAssessment ? `${latestAssessment.annual_irradiance} kWh/m²` : 'N/A'}
              </span>
            </Card>

            <Card>
              <span className="text-xs text-slate-500 font-medium block">Peak Sun Hours</span>
              <span className="text-xl font-extrabold text-slate-900 font-mono">
                {latestAssessment ? `${latestAssessment.peak_sun_hours} hrs/day` : 'N/A'}
              </span>
            </Card>

            <Card>
              <span className="text-xs text-slate-500 font-medium block">Deterministic Gen</span>
              <span className="text-xl font-extrabold text-emerald-600 font-mono">
                {latestAssessment ? `${fmtNum(latestAssessment.expected_energy_output)} MWh` : 'N/A'}
              </span>
            </Card>

            <Card>
              <span className="text-xs text-slate-500 font-medium block">Capacity Factor</span>
              <span className="text-xl font-extrabold text-sky-600 font-mono">
                {latestAssessment ? `${latestAssessment.capacity_factor}%` : 'N/A'}
              </span>
            </Card>
          </div>

          {/* AI / ML Solar Prediction Component */}
          <div className="bg-white border-2 border-orange-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-orange-100 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-orange-500" />
                <h3 className="font-extrabold text-slate-900 text-sm">AI / ML Solar Generation Prediction</h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-orange-100 text-orange-800 rounded-md">
                ADDITIONAL ML INTELLIGENCE
              </span>
            </div>

            {mlLoading ? (
              <div className="py-6 text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                <span>Computing Gradient Boosting Regressor Prediction...</span>
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
                    <span className="text-[11px] text-slate-500 font-medium block">Deterministic Physics</span>
                    <span className="text-base font-extrabold text-slate-900 font-mono">
                      {detAnnualGen ? `${fmtNum(detAnnualGen)} MWh` : 'N/A'}
                    </span>
                  </div>

                  <div className="p-3 bg-orange-50/80 border border-orange-200 rounded-xl">
                    <span className="text-[11px] text-orange-800 font-medium block">AI/ML Prediction</span>
                    <span className="text-base font-extrabold text-orange-600 font-mono">
                      {fmtNum(mlResult.prediction_annual_mwh)} MWh
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                    <span className="text-[11px] text-emerald-800 font-medium block">Variance (ML vs Det)</span>
                    <span className="text-base font-extrabold text-emerald-700 font-mono">
                      {genDiff !== null ? `${genDiff > 0 ? '+' : ''}${fmtNum(genDiff)} MWh` : 'N/A'}
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
                  Disclaimer: Calibrated development training model. Does not replace physical physics engine calculations.
                </div>
              </div>
            ) : null}
          </div>

          {/* Formula Transparency Box */}
          <Card title="Transparent Engineering Formula Structure" subtitle="100% Reproducible Physical Physics Equation">
            <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200 space-y-2 text-xs font-mono text-slate-800">
              <p className="text-orange-700 font-bold">
                Annual Energy Output (MWh) = Capacity (MW) × Peak Sun Hours × 365 × Net PR
              </p>
              <p className="text-[11px] text-slate-600 font-sans">
                Where: Peak Sun Hours = GHI / 365.0 | Net PR = Baseline PR × (1 - System Loss) × (1 - Shading Loss)
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
