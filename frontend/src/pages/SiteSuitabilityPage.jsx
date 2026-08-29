import React, { useState, useEffect, useCallback } from 'react';
import { getSitesApi } from '../services/siteService';
import { calculateSiteSuitabilityApi, getSiteSuitabilityApi } from '../services/analysisService';
import { predictSuitabilityML } from '../services/mlService';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import ScoreGauge from '../components/common/ScoreGauge';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { CheckCircle2, Calculator, Sun, Mountain, Navigation, Sprout, DollarSign, RefreshCw, Info, Cpu, AlertTriangle } from 'lucide-react';

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

export default function SiteSuitabilityPage() {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [suitabilityHistory, setSuitabilityHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // AI / ML State
  const [mlResult, setMlResult] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState('');

  const fetchMLSuitability = async (rec) => {
    setMlLoading(true);
    setMlError('');
    try {
      const res = await predictSuitabilityML({
        renewable_resource_score: rec ? Number(rec.renewable_resource_score || 85.0) : 85.0,
        geographic_score: rec ? Number(rec.geographic_score || 80.0) : 80.0,
        infrastructure_score: rec ? Number(rec.infrastructure_score || 75.0) : 75.0,
        environmental_score: rec ? Number(rec.environmental_score || 88.0) : 88.0,
        economic_score: rec ? Number(rec.economic_score || 70.0) : 70.0,
        slope: 3.0,
        elevation: 650.0,
        grid_distance_km: 5.2,
        road_distance_km: 2.1,
      });
      setMlResult(res);
    } catch (err) {
      setMlError('AI/ML service unavailable. Showing deterministic analysis.');
    } finally {
      setMlLoading(false);
    }
  };

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
        const historyArr = Array.isArray(history) ? history : [];
        setSuitabilityHistory(historyArr);
        fetchMLSuitability(historyArr.length > 0 ? historyArr[0] : null);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load suitability records.');
      setSuitabilityHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(selectedSiteId || null);
  }, [selectedSiteId]);

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
      const history = await getSiteSuitabilityApi(selectedSiteId);
      const historyArr = Array.isArray(history) ? history : [];
      setSuitabilityHistory(historyArr);
      fetchMLSuitability(historyArr.length > 0 ? historyArr[0] : null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to calculate site suitability.');
    } finally {
      setCalculating(false);
    }
  };

  const latestRec = suitabilityHistory.length > 0 ? suitabilityHistory[0] : null;
  const currentScore = latestRec ? Number(latestRec.overall_score) : null;
  const currentCategory = latestRec ? fmtStr(latestRec.category) : null;

  const factorCards = [
    { name: 'Renewable Resource Availability', score: latestRec ? fmtNum(latestRec.renewable_resource_score) : null, weight: '35%', desc: 'NASA POWER & Open-Meteo 100m wind speed telemetry', icon: Sun },
    { name: 'Geographic Suitability', score: latestRec ? fmtNum(latestRec.geographic_score) : null, weight: '25%', desc: 'DEM slope angle (< 3 degrees optimal terrain)', icon: Mountain },
    { name: 'Infrastructure Accessibility', score: latestRec ? fmtNum(latestRec.infrastructure_score) : null, weight: '15%', desc: 'PostGIS distance to grid substation', icon: Navigation },
    { name: 'Environmental Impact', score: latestRec ? fmtNum(latestRec.environmental_score) : null, weight: '15%', desc: 'Proximity to protected wildlife reserves & water bodies', icon: Sprout },
    { name: 'Economic Feasibility', score: latestRec ? fmtNum(latestRec.economic_score) : null, weight: '10%', desc: 'CAPEX infrastructure costs & payback horizon', icon: DollarSign },
  ];

  const selectedSiteName = sites.find(s => s.id === selectedSiteId)?.site_name || 'N/A';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-orange-500" />
            <span>Site Suitability Index & AI Classification</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Deterministic Multi-Criteria Decision Analysis (MCDA) coupled with Random Forest Classification probabilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCalculateSuitability}
            disabled={calculating || !selectedSiteId}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />
            <span>{calculating ? 'Calculating...' : 'Recalculate Suitability'}</span>
          </button>
        </div>
      </div>

      {/* Target Site Selector */}
      <Card title="Select Target Deployment Site" subtitle="Candidate site coordinates for Multi-Criteria Evaluation">
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
        <Loading message="Loading site suitability records from database..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Composite Score Radial Gauge Card */}
          <div className="space-y-6">
            <Card title="Deterministic Suitability Index" subtitle="Composite Multi-Criteria Weight Score">
              {latestRec ? (
                <div className="py-6 flex flex-col items-center justify-center space-y-4">
                  <ScoreGauge score={currentScore} size={160} label="MCDA Score" />

                  <div className="text-center space-y-1">
                    <span className="text-xs text-slate-500 font-medium block">Deterministic Category:</span>
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
                </div>
              )}
            </Card>

            {/* AI / ML Suitability Classification Component */}
            <div className="bg-white border-2 border-orange-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-orange-100 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-orange-500" />
                  <h3 className="font-extrabold text-slate-900 text-sm">AI / ML Suitability Classifier</h3>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-orange-100 text-orange-800 rounded-md">
                  ADDITIONAL ML INTELLIGENCE
                </span>
              </div>

              {mlLoading ? (
                <div className="py-6 text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                  <span>Classifying with Random Forest Model...</span>
                </div>
              ) : mlError ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>{mlError}</span>
                </div>
              ) : mlResult ? (
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-orange-50/80 border border-orange-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-orange-800 font-medium block">ML Predicted Category</span>
                      <span className="text-base font-extrabold text-orange-600 font-mono">
                        {mlResult.prediction_category}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Accuracy: {(mlResult.model_metrics?.accuracy * 100).toFixed(1)}%
                    </span>
                  </div>

                  {/* Class Probabilities Distribution */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">Class Probability Distribution:</span>
                    {Object.entries(mlResult.class_probabilities || {}).map(([clsName, prob]) => {
                      const pct = Math.round(prob * 100);
                      const isTop = clsName === mlResult.prediction_category;
                      return (
                        <div key={clsName} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className={isTop ? 'font-bold text-orange-700' : 'text-slate-600'}>{clsName}</span>
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

                  <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-sans italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                    Disclaimer: Random Forest Classifier trained on synthetic development data. Does not replace deterministic MCDA score.
                  </div>
                </div>
              ) : null}
            </div>
          </div>

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
            <Card title="Transparent Mathematical Explanation" subtitle="Deterministic Multi-Criteria Decision Model">
              <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200 space-y-2 text-xs font-mono text-slate-800">
                <p className="text-orange-700 font-bold">
                  Score = (Resource × 0.35) + (Geographic × 0.25) + (Infrastructure × 0.15) + (Environmental × 0.15) + (Economic × 0.10)
                </p>
                {latestRec && (
                  <p className="text-[11px] text-slate-600 font-sans">
                    Site '{selectedSiteName}' achieved a composite score of{' '}
                    <span className="text-slate-900 font-bold">{fmtNum(currentScore)}</span> / 100.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
