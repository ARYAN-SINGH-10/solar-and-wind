import React, { useState, useEffect } from 'react';
import { getSitesApi } from '../services/siteService';
import { calculateSiteScoreApi, getSiteScoreApi, calculateDeterministicScore } from '../services/analysisService';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import ScoreGauge from '../components/common/ScoreGauge';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { Calculator, Sliders, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';

export default function SiteScorePage() {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [scoreHistory, setScoreHistory] = useState([]);

  // Factor Sliders State (0 - 100)
  const [resScore, setResScore] = useState(90);
  const [geoScore, setGeoScore] = useState(85);
  const [infraScore, setInfraScore] = useState(80);
  const [envScore, setEnvScore] = useState(90);
  const [econScore, setEconScore] = useState(85);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        const history = await getSiteScoreApi(targetSiteId);
        setScoreHistory(history);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load score records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSiteId]);

  // Live client-side preview score computation
  const previewRes = calculateDeterministicScore(resScore, geoScore, infraScore, envScore, econScore);

  const handleSaveScore = async () => {
    if (!selectedSiteId) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      await calculateSiteScoreApi(selectedSiteId, {
        resource_score: Number(resScore),
        geographic_score: Number(geoScore),
        infrastructure_score: Number(infraScore),
        environmental_score: Number(envScore),
        economic_score: Number(econScore),
      });
      setSuccessMsg('Successfully computed and saved site score to database.');
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save site score.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Calculator className="w-6 h-6 text-orange-500" />
            <span>Deterministic 5-Factor Site Scoring Engine</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Exact formula: (Resource * 0.35) + (Geographic * 0.25) + (Infrastructure * 0.15) + (Environmental * 0.15) + (Economic * 0.10)
          </p>
        </div>

        <Badge type="info font-bold">{previewRes.category.toUpperCase()}</Badge>
      </div>

      {/* Target Site Selector */}
      <Card title="Select Target Deployment Site" subtitle="Candidate site coordinates for custom factor scoring">
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
        {/* Interactive Sliders Panel */}
        <Card title="Factor Score Tuning Controls" subtitle="Adjust individual factor scores (0 to 100)">
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-700 font-bold mb-1">
                <span>Renewable Resource (35% Weight):</span>
                <span className="text-orange-600 font-mono font-bold">{resScore} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={resScore}
                onChange={(e) => setResScore(Number(e.target.value))}
                className="w-full accent-orange-500 bg-slate-100 rounded-lg h-2"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-700 font-bold mb-1">
                <span>Geographic Suitability (25% Weight):</span>
                <span className="text-emerald-600 font-mono font-bold">{geoScore} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={geoScore}
                onChange={(e) => setGeoScore(Number(e.target.value))}
                className="w-full accent-orange-500 bg-slate-100 rounded-lg h-2"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-700 font-bold mb-1">
                <span>Infrastructure Accessibility (15% Weight):</span>
                <span className="text-sky-700 font-mono font-bold">{infraScore} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={infraScore}
                onChange={(e) => setInfraScore(Number(e.target.value))}
                className="w-full accent-orange-500 bg-slate-100 rounded-lg h-2"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-700 font-bold mb-1">
                <span>Environmental Impact (15% Weight):</span>
                <span className="text-purple-700 font-mono font-bold">{envScore} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={envScore}
                onChange={(e) => setEnvScore(Number(e.target.value))}
                className="w-full accent-orange-500 bg-slate-100 rounded-lg h-2"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-700 font-bold mb-1">
                <span>Economic Feasibility (10% Weight):</span>
                <span className="text-sky-600 font-mono font-bold">{econScore} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={econScore}
                onChange={(e) => setEconScore(Number(e.target.value))}
                className="w-full accent-orange-500 bg-slate-100 rounded-lg h-2"
              />
            </div>

            <button
              onClick={handleSaveScore}
              disabled={saving || !selectedSiteId}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 text-xs flex items-center justify-center space-x-2 mt-2"
            >
              <Calculator className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              <span>{saving ? 'Saving Score to Database...' : 'Save & Store Custom Site Score'}</span>
            </button>
          </div>
        </Card>

        {/* Live Score Preview & Category Boundaries */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Live Composite Score Preview" subtitle="Weighted linear combination output">
            <div className="py-6 flex flex-col items-center justify-center space-y-4">
              <ScoreGauge score={previewRes.overallScore} size={160} label="Final Composite Score" />
              
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1 w-full max-w-md">
                <span className="text-xs text-slate-500 font-medium block">Classified Suitability Category:</span>
                <span className="text-xl font-bold font-mono text-orange-600">{previewRes.category}</span>
              </div>
            </div>
          </Card>

          {/* Category Reference Guide */}
          <Card title="Category Threshold Reference" subtitle="Standard MCDA classification boundaries">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex justify-between py-2 px-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span>90.00 - 100.00</span>
                <span className="font-bold">Excellent</span>
              </div>
              <div className="flex justify-between py-2 px-3 rounded-xl bg-sky-50 text-sky-800 border border-sky-200">
                <span>80.00 - 89.99</span>
                <span className="font-bold">Highly Suitable</span>
              </div>
              <div className="flex justify-between py-2 px-3 rounded-xl bg-orange-50 text-orange-800 border border-orange-200">
                <span>65.00 - 79.99</span>
                <span className="font-bold">Moderately Suitable</span>
              </div>
              <div className="flex justify-between py-2 px-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                <span>50.00 - 64.99</span>
                <span className="font-bold">Low Suitability</span>
              </div>
              <div className="flex justify-between py-2 px-3 rounded-xl bg-red-50 text-red-800 border border-red-200 col-span-1 sm:col-span-2">
                <span>0.00 - 49.99</span>
                <span className="font-bold">Unsuitable</span>
              </div>
            </div>
          </Card>

          {/* Score History Table */}
          <Card title="Stored Site Score History" subtitle="Audit log of calculated composite scores">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-orange-50/80 text-orange-950 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 font-mono">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Resource</th>
                    <th className="p-3">Geographic</th>
                    <th className="p-3">Infra</th>
                    <th className="p-3">Overall Score</th>
                    <th className="p-3">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {scoreHistory.map((s) => (
                    <tr key={s.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="p-3 text-slate-500 font-sans">{new Date(s.created_at).toLocaleTimeString()}</td>
                      <td className="p-3 text-orange-600 font-bold">{s.resource_score}</td>
                      <td className="p-3 text-emerald-600 font-bold">{s.geographic_score}</td>
                      <td className="p-3 text-sky-700 font-bold">{s.infrastructure_score}</td>
                      <td className="p-3 text-slate-900 font-bold">{s.overall_score}</td>
                      <td className="p-3 text-orange-600 text-[11px] font-bold">{s.category}</td>
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

