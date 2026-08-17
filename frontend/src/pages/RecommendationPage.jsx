import React, { useState, useEffect, useCallback } from 'react';
import { getSitesApi } from '../services/siteService';
import { generateRecommendationApi, getRecommendationApi } from '../services/analysisService';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { Award, CheckCircle2, RefreshCw, Info } from 'lucide-react';

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

function fmtUSD(value) {
  if (value === null || value === undefined || value === '') return 'N/A';
  const n = Number(value);
  if (Number.isNaN(n)) return 'N/A';
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
// ────────────────────────────────────────────────────────────────────────────

export default function RecommendationPage() {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  // Each record from GET /sites/{id}/recommendation has ORM column names:
  //   technology, expected_energy_output, investment_estimate,
  //   expected_revenue, investment_payback, recommendation_status, explanation
  const [recRecords, setRecRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadSites = useCallback(async () => {
    try {
      const sitesRes = await getSitesApi();
      const sItems = sitesRes.items || sitesRes || [];
      setSites(sItems);
      return sItems;
    } catch {
      return [];
    }
  }, []);

  const loadRecommendations = useCallback(async (siteId) => {
    if (!siteId) return;
    try {
      const records = await getRecommendationApi(siteId);
      setRecRecords(Array.isArray(records) ? records : []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load recommendation records.');
      setRecRecords([]);
    }
  }, []);

  const loadData = useCallback(async (siteId) => {
    setLoading(true);
    setError('');
    try {
      const sItems = await loadSites();
      const targetId = siteId || (sItems.length > 0 ? sItems[0].id : null);
      if (targetId && !selectedSiteId) {
        setSelectedSiteId(targetId);
      }
      await loadRecommendations(targetId || selectedSiteId);
    } finally {
      setLoading(false);
    }
  }, [loadSites, loadRecommendations, selectedSiteId]);

  useEffect(() => {
    loadData(selectedSiteId || null);
  }, [selectedSiteId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSiteChange = (e) => {
    setSelectedSiteId(e.target.value);
    setRecRecords([]);
    setError('');
    setSuccessMsg('');
  };

  const handleGenerateRecommendation = async () => {
    if (!selectedSiteId) return;
    setGenerating(true);
    setError('');
    setSuccessMsg('');

    try {
      await generateRecommendationApi(selectedSiteId);
      setSuccessMsg('Successfully executed rule-based technology selection and CAPEX feasibility model.');
      await loadRecommendations(selectedSiteId);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate recommendation.');
    } finally {
      setGenerating(false);
    }
  };

  // ── Derive display values from the latest DB record ──────────────────────
  // GET /sites/{id}/recommendation returns raw ORM → column names:
  //   technology              (NOT recommended_technology)
  //   investment_estimate     (NOT estimated_investment)
  //   expected_revenue        (NOT estimated_revenue)
  //   investment_payback      (NOT payback_years)
  //   expected_energy_output  (NOT expected_energy)
  //   recommendation_status   ✓
  //   explanation             ✓
  const latestRec = recRecords.length > 0 ? recRecords[0] : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-orange-500" />
            <span>Deterministic Investment Recommendation Engine</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Feasibility advice derived from physical solar/wind calculations, 5-factor SSI score, and financial payback analysis.
          </p>
        </div>

        <button
          onClick={handleGenerateRecommendation}
          disabled={generating || !selectedSiteId}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          <span>{generating ? 'Evaluating Rules...' : 'Generate Recommendation'}</span>
        </button>
      </div>

      {/* Target Site Selector */}
      <Card title="Select Target Deployment Site" subtitle="Candidate site coordinates for rule-based technology evaluation">
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
        <Loading message="Loading recommendation records from database..." />
      ) : !latestRec ? (
        /* ── Empty state — no recommendation yet ── */
        <Card>
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
            <Info className="w-10 h-10 text-slate-400" />
            <p className="text-sm font-bold text-slate-700">No Recommendation Generated Yet</p>
            <p className="text-xs text-slate-500 max-w-md">
              Prerequisites: Environmental data fetch → Solar analysis → Wind analysis →
              Suitability calculation → Energy forecast → Optimization must all be completed first.
            </p>
            <p className="text-xs text-slate-500">
              Then click <span className="text-orange-600 font-bold">Generate Recommendation</span> above.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Key Output Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <span className="text-xs text-slate-500 font-medium block">Recommended Technology</span>
              {/* ORM field: technology */}
              <span className="text-xl font-bold text-orange-600 font-mono">
                {fmtStr(latestRec.technology)}
              </span>
            </Card>

            <Card>
              <span className="text-xs text-slate-500 font-medium block">CAPEX Investment Estimate</span>
              {/* ORM field: investment_estimate (NOT estimated_investment) */}
              <span className="text-xl font-bold text-slate-900 font-mono">
                {fmtUSD(latestRec.investment_estimate)}
              </span>
            </Card>

            <Card>
              <span className="text-xs text-slate-500 font-medium block">Annual Revenue</span>
              {/* ORM field: expected_revenue (NOT estimated_revenue) */}
              <span className="text-xl font-bold text-emerald-600 font-mono">
                {latestRec.expected_revenue != null
                  ? `${fmtUSD(latestRec.expected_revenue)} / yr`
                  : 'N/A'}
              </span>
            </Card>

            <Card>
              <span className="text-xs text-slate-500 font-medium block">Payback Horizon</span>
              {/* ORM field: investment_payback (NOT payback_years) */}
              <span className="text-xl font-bold text-sky-700 font-mono">
                {latestRec.investment_payback != null
                  ? `${fmtNum(latestRec.investment_payback)} Years`
                  : 'N/A'}
              </span>
            </Card>
          </div>

          {/* Expected Energy row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <span className="text-xs text-slate-500 font-medium block">Expected Annual Energy Output</span>
              {/* ORM field: expected_energy_output */}
              <span className="text-xl font-bold text-sky-700 font-mono">
                {latestRec.expected_energy_output != null
                  ? `${fmtNum(latestRec.expected_energy_output, 0)} MWh/yr`
                  : 'N/A'}
              </span>
            </Card>

            <Card>
              <span className="text-xs text-slate-500 font-medium block">Recommendation Status</span>
              {/* ORM field: recommendation_status */}
              <div className="mt-1">
                <Badge type="success font-bold">
                  {fmtStr(latestRec.recommendation_status)}
                </Badge>
              </div>
            </Card>

            <Card>
              <span className="text-xs text-slate-500 font-medium block">Assessment Timestamp</span>
              <span className="text-sm font-bold text-slate-700 font-mono">
                {latestRec.created_at
                  ? new Date(latestRec.created_at).toLocaleString()
                  : 'N/A'}
              </span>
            </Card>
          </div>

          {/* Detailed Recommendation Rationale Card */}
          <Card title="Deterministic Recommendation Rationale" subtitle="Rule-based financial & technical validation">
            <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200 space-y-4 text-xs text-slate-800">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">Selection Decision Rationale:</h4>
                {/* ORM field: explanation */}
                <p className="leading-relaxed bg-white p-3 rounded-xl border border-slate-200 font-sans text-slate-700">
                  {fmtStr(latestRec.explanation)}
                </p>
              </div>

              {/* Environmental Constraints */}
              <div className="space-y-2 pt-2 border-t border-orange-200">
                <h4 className="font-bold text-slate-700">Enforced Technical & Environmental Constraints:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block">Max Slope Limit:</span>
                    <span className="text-emerald-700 font-bold">&lt;= 15.0 Degrees</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block">Wildlife Reserve Setback:</span>
                    <span className="text-sky-700 font-bold">&gt;= 500 Meters</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block">Substation Proximity:</span>
                    <span className="text-orange-600 font-bold">&lt;= 20.0 Kilometers</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* History Table */}
          {recRecords.length > 1 && (
            <Card title="Recommendation History" subtitle="All stored rule-based evaluations for this site">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-orange-50/80 text-orange-950 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 font-mono">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Technology</th>
                      <th className="p-3">Investment</th>
                      <th className="p-3">Revenue/yr</th>
                      <th className="p-3">Payback</th>
                      <th className="p-3">Energy MWh/yr</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {recRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="p-3 text-slate-500 font-sans">
                          {r.created_at ? new Date(r.created_at).toLocaleTimeString() : 'N/A'}
                        </td>
                        <td className="p-3 text-orange-600 font-bold">{fmtStr(r.technology)}</td>
                        <td className="p-3 text-slate-900 font-bold">{fmtUSD(r.investment_estimate)}</td>
                        <td className="p-3 text-emerald-600 font-bold">{fmtUSD(r.expected_revenue)}</td>
                        <td className="p-3 text-sky-700 font-bold">{fmtNum(r.investment_payback)} yrs</td>
                        <td className="p-3 text-sky-700">{fmtNum(r.expected_energy_output, 0)}</td>
                        <td className="p-3 text-[11px] font-bold text-slate-700">{fmtStr(r.recommendation_status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
