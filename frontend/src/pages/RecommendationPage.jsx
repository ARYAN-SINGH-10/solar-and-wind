import React, { useState, useEffect, useCallback } from 'react';
import { getSitesApi } from '../services/siteService';
import { generateRecommendationApi, getRecommendationApi } from '../services/analysisService';
import { predictInvestmentML, recommendTechnologyML } from '../services/mlService';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { Award, CheckCircle2, RefreshCw, Info, Cpu, AlertTriangle } from 'lucide-react';

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

export default function RecommendationPage() {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [recRecords, setRecRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // AI / ML State
  const [invMlResult, setInvMlResult] = useState(null);
  const [invMlLoading, setInvMlLoading] = useState(false);
  const [invMlError, setInvMlError] = useState('');

  const [techMlResult, setTechMlResult] = useState(null);
  const [techMlLoading, setTechMlLoading] = useState(false);
  const [techMlError, setTechMlError] = useState('');

  const fetchMLIntelligence = async (rec) => {
    // Investment ML
    setInvMlLoading(true);
    setInvMlError('');
    try {
      const invRes = await predictInvestmentML({
        installed_capacity_mw: 10.0,
        expected_annual_generation_mwh: rec ? Number(rec.expected_energy_output || 22000.0) : 22000.0,
        capex_usd: rec ? Number(rec.investment_estimate || 9500000.0) : 9500000.0,
        annual_revenue_usd: rec ? Number(rec.expected_revenue || 1430000.0) : 1430000.0,
        om_cost_usd: 200000.0,
        electricity_tariff_usd_mwh: 65.0,
        technology: rec ? String(rec.technology || 'HYBRID') : 'HYBRID',
        capacity_factor_pct: 28.5,
        site_suitability_score: 82.0,
      });
      setInvMlResult(invRes);
    } catch (err) {
      setInvMlError('AI/ML investment service unavailable. Showing deterministic financial analysis.');
    } finally {
      setInvMlLoading(false);
    }

    // Technology Recommendation ML
    setTechMlLoading(true);
    setTechMlError('');
    try {
      const techRes = await recommendTechnologyML({
        ghi: 2150.0,
        wind_speed: 7.5,
        wind_power_density: 250.0,
        suitability_score: 82.0,
        solar_generation_mwh: 18000.0,
        wind_generation_mwh: 14000.0,
        revenue_usd: rec ? Number(rec.expected_revenue || 2080000.0) : 2080000.0,
        capacity_factor_pct: 30.0,
        infrastructure_score: 75.0,
        environmental_score: 85.0,
      });
      setTechMlResult(techRes);
    } catch (err) {
      setTechMlError('AI/ML technology service unavailable. Showing deterministic recommendation.');
    } finally {
      setTechMlLoading(false);
    }
  };

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
      const recArr = Array.isArray(records) ? records : [];
      setRecRecords(recArr);
      fetchMLIntelligence(recArr.length > 0 ? recArr[0] : null);
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
  }, [selectedSiteId]);

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

  const latestRec = recRecords.length > 0 ? recRecords[0] : null;
  const detPayback = latestRec ? Number(latestRec.investment_payback) : null;
  const mlPayback = invMlResult ? Number(invMlResult.predicted_payback_years) : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-orange-500" />
            <span>Investment Recommendation & AI Intelligence</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Deterministic CAPEX payback rules integrated with Machine Learning risk classification and technology recommendation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateRecommendation}
            disabled={generating || !selectedSiteId}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'Evaluating Rules...' : 'Generate Recommendation'}</span>
          </button>
        </div>
      </div>

      {/* Target Site Selector */}
      <Card title="Select Target Deployment Site" subtitle="Candidate site coordinates for rule-based technology evaluation">
        <select
          value={selectedSiteId}
          onChange={handleSiteChange}
          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-mono font-bold"
        >
          {sites.length === 0 && <option value="">No sites available</option>}
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
        <Card>
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
            <Info className="w-10 h-10 text-slate-400" />
            <p className="text-sm font-bold text-slate-700">No Recommendation Generated Yet</p>
            <p className="text-xs text-slate-500 max-w-md">
              Click <span className="text-orange-600 font-bold">Generate Recommendation</span> above to evaluate site feasibility.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Key Output Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <span className="text-xs text-slate-500 font-medium block">Recommended Technology</span>
              <span className="text-xl font-bold text-orange-600 font-mono">
                {fmtStr(latestRec.technology)}
              </span>
            </Card>

            <Card>
              <span className="text-xs text-slate-500 font-medium block">CAPEX Investment Estimate</span>
              <span className="text-xl font-bold text-slate-900 font-mono">
                {fmtUSD(latestRec.investment_estimate)}
              </span>
            </Card>

            <Card>
              <span className="text-xs text-slate-500 font-medium block">Annual Revenue</span>
              <span className="text-xl font-bold text-emerald-600 font-mono">
                {latestRec.expected_revenue != null ? `${fmtUSD(latestRec.expected_revenue)} / yr` : 'N/A'}
              </span>
            </Card>

            <Card>
              <span className="text-xs text-slate-500 font-medium block">Deterministic Payback</span>
              <span className="text-xl font-bold text-sky-700 font-mono">
                {latestRec.investment_payback != null ? `${fmtNum(latestRec.investment_payback)} Years` : 'N/A'}
              </span>
            </Card>
          </div>

          {/* AI / ML Dual Intelligence Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Investment Intelligence Component */}
            <div className="bg-white border-2 border-orange-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-orange-100 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-orange-500" />
                  <h3 className="font-extrabold text-slate-900 text-sm">AI Investment Risk & Payback Prediction</h3>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-orange-100 text-orange-800 rounded-md">
                  ADDITIONAL ML INTELLIGENCE
                </span>
              </div>

              {invMlLoading ? (
                <div className="py-6 text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                  <span>Computing Financial Payback & Risk Category...</span>
                </div>
              ) : invMlError ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>{invMlError}</span>
                </div>
              ) : invMlResult ? (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-orange-50/80 border border-orange-200 rounded-xl">
                      <span className="text-[11px] text-orange-800 font-medium block">ML Payback Prediction</span>
                      <span className="text-base font-extrabold text-orange-600 font-mono">
                        {fmtNum(invMlResult.predicted_payback_years)} Years
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[11px] text-slate-500 font-medium block">ML Risk Category</span>
                      <span className="text-base font-extrabold text-slate-900 font-mono">
                        {invMlResult.predicted_risk_category}
                      </span>
                    </div>
                  </div>

                  {/* Risk Probabilities Distribution */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">Risk Category Probabilities:</span>
                    {Object.entries(invMlResult.risk_class_probabilities || {}).map(([clsName, prob]) => {
                      const pct = Math.round(prob * 100);
                      const isTop = clsName === invMlResult.predicted_risk_category;
                      return (
                        <div key={clsName} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className={isTop ? 'font-bold text-orange-700' : 'text-slate-600'}>{clsName} Risk</span>
                            <span className={isTop ? 'font-bold text-orange-700' : 'text-slate-600'}>{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full transition-all ${isTop ? 'bg-orange-500' : 'bg-slate-300'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-[10px] text-slate-400 font-sans italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                    Disclaimer: Machine learning models trained on synthetic development data. Does not replace deterministic CAPEX calculation.
                  </div>
                </div>
              ) : null}
            </div>

            {/* AI Technology Recommendation Component */}
            <div className="bg-white border-2 border-orange-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-orange-100 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-orange-500" />
                  <h3 className="font-extrabold text-slate-900 text-sm">AI Technology Recommendation</h3>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-orange-100 text-orange-800 rounded-md">
                  ADDITIONAL ML INTELLIGENCE
                </span>
              </div>

              {techMlLoading ? (
                <div className="py-6 text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                  <span>Recommending Optimal Technology...</span>
                </div>
              ) : techMlError ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>{techMlError}</span>
                </div>
              ) : techMlResult ? (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[11px] text-slate-500 font-medium block">Deterministic Tech</span>
                      <span className="text-base font-extrabold text-slate-900 font-mono">
                        {fmtStr(latestRec.technology)}
                      </span>
                    </div>

                    <div className="p-3 bg-orange-50/80 border border-orange-200 rounded-xl">
                      <span className="text-[11px] text-orange-800 font-medium block">AI Recommended Tech</span>
                      <span className="text-base font-extrabold text-orange-600 font-mono">
                        {techMlResult.recommended_technology}
                      </span>
                    </div>
                  </div>

                  {/* Tech Probabilities Distribution */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">Technology Match Probabilities:</span>
                    {Object.entries(techMlResult.class_probabilities || {}).map(([techName, prob]) => {
                      const pct = Math.round(prob * 100);
                      const isTop = techName === techMlResult.recommended_technology;
                      return (
                        <div key={techName} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className={isTop ? 'font-bold text-orange-700' : 'text-slate-600'}>{techName}</span>
                            <span className={isTop ? 'font-bold text-orange-700' : 'text-slate-600'}>{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full transition-all ${isTop ? 'bg-orange-500' : 'bg-slate-300'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-[10px] text-slate-400 font-sans italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                    Disclaimer: Random Forest Classifier trained on synthetic development data. Does not replace deterministic technology decision rules.
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Detailed Recommendation Rationale Card */}
          <Card title="Deterministic Recommendation Rationale" subtitle="Rule-based financial & technical validation">
            <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200 space-y-4 text-xs text-slate-800">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">Selection Decision Rationale:</h4>
                <p className="leading-relaxed bg-white p-3 rounded-xl border border-slate-200 font-sans text-slate-700">
                  {fmtStr(latestRec.explanation)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
