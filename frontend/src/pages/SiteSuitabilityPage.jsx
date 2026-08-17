import React, { useState, useEffect, useCallback } from 'react';
import { getSitesApi } from '../services/siteService';
import { calculateSiteSuitabilityApi, getSiteSuitabilityApi } from '../services/analysisService';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import ScoreGauge from '../components/common/ScoreGauge';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { CheckCircle2, Calculator, ShieldCheck, Sun, Mountain, Navigation, Sprout, DollarSign, RefreshCw, Info } from 'lucide-react';

// ─── Safe formatters ────────────────────────────────────────────────────────
function fmtNum(value, digits = 2) {
  if (value === null || value === undefined || value === '') return 'N/A';
  const n = Number(value);
  if (Number.isNaN(n)) return 'N/A';
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function fmtStr(value) {
  if (value === null || value === undefined || value === '') return 'N/A';
  return String(value);
}

function fmtUpper(value) {
  const s = fmtStr(value);
  return s === 'N/A' ? 'N/A' : s.toUpperCase();
}
// ────────────────────────────────────────────────────────────────────────────

export default function SiteSuitabilityPage() {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  // Each record from GET /sites/{id}/suitability has ORM column names:
  //   overall_score, category, renewable_resource_score, geographic_score,
  //   infrastructure_score, environmental_score, economic_score
  const [suitabilityHistory, setSuitabilityHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = useCallback(async (siteId) => {
    setLoading(true);
    setError('');
    try {
      const sitesRes = await getSitesApi();
      const sItems = sitesRes.items || sitesRes || [];
      setSites(sItems);

      const targetId = siteId || (sItems.length > 0 ? sItems[0].id : null);
      if (targetId && targetId !== selectedSiteId) {
        setSelectedSiteId(targetId);
      }

      if (targetId) {
        const history = await getSiteSuitabilityApi(targetId);
        setSuitabilityHistory(Array.isArray(history) ? history : []);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load suitability records.');
      setSuitabilityHistory([]);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData(selectedSiteId || null);
  }, [selectedSiteId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSiteChange = (e) => {
    setSelectedSiteId(e.target.value);
    setSuitabilityHistory([]);
  };

  const handleCalculateSuitability = async () => {
    if (!selectedSiteId) return;
    setCalculating(true);
    setError('');
    setSuccessMsg('');

    try {
      await calculateSiteSuitabilityApi(selectedSiteId);
      setSuccessMsg('Successfully computed Multi-Criteria Site Suitability Index.');
      // Reload history — GET returns ORM objects with column names
      const history = await getSiteSuitabilityApi(selectedSiteId);
      setSuitabilityHistory(Array.isArray(history) ? history : []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to calculate site suitability.');
    } finally {
      setCalculating(false);
    }
  };

  // ── Derive display values from the latest DB record ──────────────────────
  // GET /sites/{id}/suitability returns raw ORM → column names:
  //   overall_score   (NOT suitability_score)
  //   category        (NOT suitability_category)
  //   renewable_resource_score, geographic_score, infrastructure_score,
  //   environmental_score, economic_score
  const latestRec = suitabilityHistory.length > 0 ? suitabilityHistory[0] : null;

  const currentScore   = latestRec ? Number(latestRec.overall_score)   : null;
  const currentCategory = latestRec ? fmtStr(latestRec.category) : null;

  const factorCards = [
    {
      name: 'Renewable Resource Availability',
      score: latestRec ? fmtNum(latestRec.renewable_resource_score) : null,
      weight: '35%',
      desc: 'Derived from NASA POWER GHI solar irradiance & Open-Meteo 100m wind speed',
      icon: Sun,
      color: 'text-amber-400',
    },
    {
      name: 'Geographic Suitability',
      score: latestRec ? fmtNum(latestRec.geographic_score) : null,
      weight: '25%',
      desc: 'Evaluated from DEM slope angle (< 3 degrees optimal flat terrain)',
      icon: Mountain,
      color: 'text-emerald-400',
    },
    {
      name: 'Infrastructure Accessibility',
      score: latestRec ? fmtNum(latestRec.infrastructure_score) : null,
      weight: '15%',
      desc: 'Evaluated from PostGIS distance to nearest 230kV grid substation',
      icon: Navigation,
      color: 'text-sky-400',
    },
    {
      name: 'Environmental Impact',
      score: latestRec ? fmtNum(latestRec.environmental_score) : null,
      weight: '15%',
      desc: 'Penalized by proximity to protected wildlife reserves & water bodies',
      icon: Sprout,
      color: 'text-purple-400',
    },
    {
      name: 'Economic Feasibility',
      score: latestRec ? fmtNum(latestRec.economic_score) : null,
      weight: '10%',
      desc: 'Derived from CAPEX infrastructure costs, PPA tariff, and payback horizon',
      icon: DollarSign,
      color: 'text-blue-400',
    },
  ];

  const selectedSiteName = sites.find(s => s.id === selectedSiteId)?.site_name || 'N/A';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-orange-500" />
            <span>Site Suitability Index (SSI) Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Multi-Criteria Decision Analysis (MCDA) evaluating physical terrain, environmental constraints, and grid connectivity.
          </p>
        </div>

        <button
          onClick={handleCalculateSuitability}
          disabled={calculating || !selectedSiteId}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />
          <span>{calculating ? 'Calculating Suitability...' : 'Recalculate Suitability'}</span>
        </button>
      </div>

      {/* Target Site Selector */}
      <Card title="Select Target Deployment Site" subtitle="Candidate site coordinates for Multi-Criteria Evaluation">
        <select
          value={selectedSiteId}
          onChange={handleSiteChange}
          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-mono font-bold"
        >
          {sites.length === 0 && (
            <option value="">No sites available</option>
          )}
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.site_name} ({fmtStr(s.latitude)}°N, {fmtStr(s.longitude)}°W)
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

      {loading ? (
        <Loading message="Loading site suitability records from database..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Composite Score Radial Gauge Card */}
          <Card title="Overall Site Suitability Index" subtitle="Composite Multi-Criteria Weight Score">
            {latestRec ? (
              <div className="py-6 flex flex-col items-center justify-center space-y-4">
                <ScoreGauge score={currentScore} size={160} label="Composite Score" />

                <div className="text-center space-y-1">
                  <span className="text-xs text-slate-500 font-medium block">Suitability Category:</span>
                  <Badge type="success font-bold text-sm">{fmtUpper(currentCategory)}</Badge>
                </div>

                <div className="text-center text-xs text-slate-600 font-mono">
                  Score: <span className="text-slate-900 font-bold">{fmtNum(currentScore)} / 100</span>
                </div>
              </div>
            ) : (
              <div className="py-10 flex flex-col items-center justify-center space-y-3 text-center">
                <Info className="w-8 h-8 text-slate-400" />
                <p className="text-sm font-bold text-slate-700">No Suitability Calculated Yet</p>
                <p className="text-xs text-slate-500">
                  Click <span className="text-orange-600 font-bold">Recalculate Suitability</span> above to compute the 5-factor composite score.
                </p>
              </div>
            )}
          </Card>

          {/* Factor Breakdown List */}
          <div className="lg:col-span-2 space-y-4">
            <Card title="Factor Score Breakdown (Normalized 0 to 100)" subtitle="Exact weighted combination breakdown">
              <div className="space-y-3 text-xs">
                {factorCards.map((f, idx) => {
                  const Icon = f.icon;
                  return (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between font-bold">
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4 text-orange-500" />
                          <span className="text-slate-900">{f.name}</span>
                        </div>
                        <div className="space-x-2 font-mono">
                          <span className="text-slate-500 font-normal">Weight: {f.weight}</span>
                          <span className="font-bold text-orange-600">
                            {f.score !== null ? `${f.score} / 100` : 'Not calculated'}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 pl-6 font-medium">{f.desc}</p>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Formula Explanation Card */}
            <Card title="Transparent Mathematical Explanation" subtitle="Zero-AI Multi-Criteria Decision Model">
              <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200 space-y-2 text-xs font-mono text-slate-800">
                <p className="text-orange-700 font-bold">
                  Score = (Resource × 0.35) + (Geographic × 0.25) + (Infrastructure × 0.15) + (Environmental × 0.15) + (Economic × 0.10)
                </p>
                {latestRec ? (
                  <p className="text-[11px] text-slate-600 font-sans">
                    Site '{selectedSiteName}' achieved a composite score of{' '}
                    <span className="text-slate-900 font-bold">{fmtNum(currentScore)}</span> / 100, placing it in the{' '}
                    '<span className="text-orange-700 font-bold">{fmtStr(currentCategory)}</span>' classification category.
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 font-sans">
                    No calculation available for site '{selectedSiteName}' yet. Run suitability calculation to see results.
                  </p>
                )}

                {/* Category legend */}
                <div className="pt-2 border-t border-orange-200 space-y-1 text-[10px] font-sans">
                  <div className="flex justify-between"><span className="text-emerald-700 font-bold">Excellent</span><span>90 – 100</span></div>
                  <div className="flex justify-between"><span className="text-sky-700 font-bold">Highly Suitable</span><span>80 – 89.99</span></div>
                  <div className="flex justify-between"><span className="text-orange-600 font-bold">Moderately Suitable</span><span>65 – 79.99</span></div>
                  <div className="flex justify-between"><span className="text-amber-600 font-bold">Low Suitability</span><span>50 – 64.99</span></div>
                  <div className="flex justify-between"><span className="text-red-600 font-bold">Unsuitable</span><span>0 – 49.99</span></div>
                </div>
              </div>
            </Card>

            {/* History Table */}
            {suitabilityHistory.length > 0 && (
              <Card title="Suitability Calculation History" subtitle="Stored audit records">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-orange-50/80 text-orange-950 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 font-mono">
                      <tr>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Score</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Resource</th>
                        <th className="p-3">Geographic</th>
                        <th className="p-3">Economic</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {suitabilityHistory.map((r) => (
                        <tr key={r.id} className="hover:bg-orange-50/30 transition-colors">
                          <td className="p-3 text-slate-500 font-sans">
                            {r.created_at ? new Date(r.created_at).toLocaleTimeString() : 'N/A'}
                          </td>
                          <td className="p-3 text-slate-900 font-bold">{fmtNum(r.overall_score)}</td>
                          <td className="p-3 text-orange-600 text-[11px] font-bold">{fmtStr(r.category)}</td>
                          <td className="p-3 text-orange-600 font-bold">{fmtNum(r.renewable_resource_score)}</td>
                          <td className="p-3 text-emerald-600 font-bold">{fmtNum(r.geographic_score)}</td>
                          <td className="p-3 text-sky-700 font-bold">{fmtNum(r.economic_score)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

