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
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { Sun, Sliders, Cpu, Zap, CheckCircle2, RefreshCw, Calculator, History } from 'lucide-react';

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
        const history = await getSolarAssessmentsApi(targetSiteId);
        setAssessments(history);
      }
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
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to run solar calculation engine.');
    } finally {
      setAnalyzing(false);
    }
  };

  const latestAssessment = assessments.length > 0 ? assessments[0] : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Sun className="w-6 h-6 text-orange-500" />
            <span>Deterministic Solar PV Analysis Engine</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Physical photovoltaic performance modeling using GHI irradiance, system degradation, and tilt optimization.
          </p>
        </div>

        <Badge type="warning">ZERO AI / DETERMINISTIC ENGINE</Badge>
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

        {/* Calculated Results & Formula Explanation */}
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
              <span className="text-xs text-slate-500 font-medium block">Annual Generation</span>
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

          {/* Formula Transparency Box */}
          <Card title="Transparent Engineering Formula Structure" subtitle="100% Reproducible Physical Physics Equation">
            <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200 space-y-2 text-xs font-mono text-slate-800">
              <p className="text-orange-700 font-bold">
                Annual Energy Output (MWh) = Capacity (MW) × Peak Sun Hours × 365 × Net PR
              </p>
              <p className="text-[11px] text-slate-600 font-sans">
                Where: Peak Sun Hours = GHI / 365.0 | Net PR = Baseline PR × (1 - System Loss) × (1 - Shading Loss)
              </p>
              <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-orange-200 font-sans">
                <span>Data Provenance: NASA POWER Satellite Irradiance GHI</span>
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
                    <th className="p-3">GHI Irradiance</th>
                    <th className="p-3">Peak Sun Hours</th>
                    <th className="p-3">Expected Output</th>
                    <th className="p-3">Capacity Factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {assessments.map((a) => (
                    <tr key={a.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="p-3 text-slate-500 font-sans">{new Date(a.created_at).toLocaleTimeString()}</td>
                      <td className="p-3 text-orange-600 font-bold">{a.annual_irradiance} kWh/m²</td>
                      <td className="p-3">{a.peak_sun_hours} hrs/day</td>
                      <td className="p-3 text-emerald-600 font-bold">{fmtNum(a.expected_energy_output)} MWh</td>
                      <td className="p-3 text-sky-700 font-bold">{a.capacity_factor}%</td>
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

