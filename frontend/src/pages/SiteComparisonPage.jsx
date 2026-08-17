import React, { useState, useEffect } from 'react';
import { fetchSites } from '../services/api';
import { compareSitesDirectApi, createComparisonApi, listComparisonsApi } from '../services/platformService';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import {
  GitCompare, Trophy, CheckCircle2, RefreshCw, Award, MapPin,
  TrendingUp, DollarSign, Sun, Wind, Layers, Plus, Star
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function SiteComparisonPage() {
  const [sitesList, setSitesList] = useState([]);
  const [selectedSiteIds, setSelectedSiteIds] = useState([]);
  const [comparisonResult, setComparisonResult] = useState(null);

  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSites = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchSites();
        const items = Array.isArray(res) ? res : (res.items || []);
        setSitesList(items);
        // Pre-select first 3 sites by default
        if (items.length >= 2) {
          const initial = items.slice(0, Math.min(3, items.length)).map(s => s.id);
          setSelectedSiteIds(initial);
          runComparison(initial);
        }
      } catch (err) {
        setError('Failed to load candidate sites list.');
      } finally {
        setLoading(false);
      }
    };
    loadSites();
  }, []);

  const toggleSiteSelect = (siteId) => {
    setSelectedSiteIds(prev => {
      if (prev.includes(siteId)) {
        if (prev.length <= 2) {
          setError('At least 2 sites are required for comparison.');
          return prev;
        }
        setError('');
        return prev.filter(id => id !== siteId);
      } else {
        if (prev.length >= 5) {
          setError('Maximum 5 sites allowed per comparison.');
          return prev;
        }
        setError('');
        return [...prev, siteId];
      }
    });
  };

  const runComparison = async (idsToCompare = selectedSiteIds) => {
    if (idsToCompare.length < 2 || idsToCompare.length > 5) {
      setError('Please select between 2 and 5 candidate sites.');
      return;
    }
    setComparing(true);
    setError('');
    try {
      const res = await compareSitesDirectApi(idsToCompare);
      setComparisonResult(res);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to compare candidate sites.');
    } finally {
      setComparing(false);
    }
  };

  const comparedSites = comparisonResult?.sites || [];
  const bestSite = comparisonResult?.recommended_best_site || null;

  // Compute maximum values for table highlighting
  const maxValues = {
    overall_suitability: Math.max(...comparedSites.map(s => s.overall_suitability || 0)),
    expected_energy: Math.max(...comparedSites.map(s => s.expected_energy || 0)),
    estimated_revenue: Math.max(...comparedSites.map(s => s.estimated_revenue || 0)),
    solar_irradiance: Math.max(...comparedSites.map(s => s.solar_irradiance || 0)),
    wind_speed: Math.max(...comparedSites.map(s => s.wind_speed || 0)),
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-orange-500" />
            <span>Multi-Site Deterministic Benchmarking</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Compare 2 to 5 candidate sites side-by-side across 18 physical & financial metrics. Highest scoring site is deterministically identified. Zero AI!
          </p>
        </div>
        <Badge type="info">{selectedSiteIds.length} / 5 Sites Selected</Badge>
      </div>

      {/* Site Selector Checklist */}
      <Card title="Candidate Site Selector (Select 2 to 5 Sites)" subtitle="Check site boxes to include in benchmark matrix">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {sitesList.map(s => {
              const isChecked = selectedSiteIds.includes(s.id);
              return (
                <label
                  key={s.id}
                  onClick={() => toggleSiteSelect(s.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all text-xs flex items-center justify-between ${
                    isChecked
                      ? 'bg-orange-50 border-orange-400 text-slate-800 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300 hover:bg-orange-50/30'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="accent-orange-500 rounded"
                    />
                    <div className="truncate">
                      <span className="font-bold block truncate">{s.site_name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{s.region || 'N/A'}</span>
                    </div>
                  </div>
                  {isChecked && <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0" />}
                </label>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-600 font-medium">
              Selection: <strong className="text-orange-600 font-mono">{selectedSiteIds.length} sites</strong> (Min: 2, Max: 5)
            </span>
            <button
              onClick={() => runComparison()}
              disabled={comparing || selectedSiteIds.length < 2}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-sm transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${comparing ? 'animate-spin' : ''}`} />
              {comparing ? 'Benchmarking...' : 'Run Side-by-Side Benchmark'}
            </button>
          </div>
        </div>
      </Card>

      <ErrorMessage message={error} />

      {/* RECOMMENDED BEST SITE HIGHLIGHT BOX (WINNER) */}
      {bestSite && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-50 via-white to-white p-6 border border-orange-300 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 border border-orange-300 text-orange-700 text-xs font-bold font-mono">
              <Trophy className="w-4 h-4 text-orange-500" />
              <span>RECOMMENDED BEST CANDIDATE SITE (DETERMINISTIC WINNER)</span>
            </div>
            <Badge type="success">Score: {bestSite.overall_suitability} / 100</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
            <div>
              <span className="text-slate-500 text-xs block font-medium">Winning Site Name</span>
              <p className="text-xl font-black text-slate-900">{bestSite.site_name}</p>
            </div>
            <div>
              <span className="text-slate-500 text-xs block font-medium">Recommended Technology</span>
              <p className="text-xl font-black text-orange-600">{bestSite.recommended_technology}</p>
            </div>
            <div>
              <span className="text-slate-500 text-xs block font-medium">Expected Annual Energy</span>
              <p className="text-xl font-black text-sky-700 font-mono">{bestSite.expected_energy?.toLocaleString()} MWh/yr</p>
            </div>
            <div>
              <span className="text-slate-500 text-xs block font-medium">Est. Annual Revenue</span>
              <p className="text-xl font-black text-emerald-700 font-mono">${bestSite.estimated_revenue?.toLocaleString()}/yr</p>
            </div>
          </div>
        </div>
      )}

      {/* 18 METRICS SIDE-BY-SIDE COMPARISON TABLE */}
      {comparing ? (
        <Loading message="Evaluating 18 physical & economic comparison metrics across candidate sites..." />
      ) : comparedSites.length > 0 && (
        <Card title="Side-by-Side 18 Metrics Comparison Matrix" subtitle="Orange highlighted cells represent maximum performers">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-orange-50/80 text-orange-950 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3 text-slate-700">Metric Attribute</th>
                  {comparedSites.map(s => (
                    <th key={s.site_id} className="p-3 text-orange-600 font-bold text-center">
                      {s.site_name}
                      {bestSite?.site_id === s.site_id && (
                        <span className="block text-[9px] text-emerald-600 font-sans font-bold">★ WINNER</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { label: '1. Coordinates Location', key: 'location', fmt: v => v },
                  { label: '2. Land Area (sq km)', key: 'land_area', fmt: v => `${v} km²` },
                  { label: '3. Elevation (m ASL)', key: 'elevation', fmt: v => `${v} m` },
                  { label: '4. Solar Irradiance GHI', key: 'solar_irradiance', maxKey: 'solar_irradiance', fmt: v => `${v} kWh/m²/yr` },
                  { label: '5. 100m Wind Speed', key: 'wind_speed', maxKey: 'wind_speed', fmt: v => `${v} m/s` },
                  { label: '6. Solar Resource Score', key: 'solar_score', fmt: v => `${v} / 100` },
                  { label: '7. Wind Resource Score', key: 'wind_score', fmt: v => `${v} / 100` },
                  { label: '8. Renewable Resource (35%)', key: 'resource_score', fmt: v => `${v} / 100` },
                  { label: '9. Geographic Score (25%)', key: 'geographic_score', fmt: v => `${v} / 100` },
                  { label: '10. Infrastructure Score (15%)', key: 'infrastructure_score', fmt: v => `${v} / 100` },
                  { label: '11. Environmental Score (15%)', key: 'environmental_score', fmt: v => `${v} / 100` },
                  { label: '12. Economic Score (10%)', key: 'economic_score', fmt: v => `${v} / 100` },
                  { label: '13. OVERALL SUITABILITY', key: 'overall_suitability', maxKey: 'overall_suitability', bold: true, fmt: v => `${v} / 100` },
                  { label: '14. Suitability Category', key: 'category', fmt: v => v },
                  { label: '15. Expected Energy (MWh/yr)', key: 'expected_energy', maxKey: 'expected_energy', fmt: v => `${v?.toLocaleString()} MWh` },
                  { label: '16. Estimated Revenue ($/yr)', key: 'estimated_revenue', maxKey: 'estimated_revenue', fmt: v => `$${v?.toLocaleString()}` },
                  { label: '17. Recommended Technology', key: 'recommended_technology', fmt: v => v },
                  { label: '18. Estimated Investment CAPEX', key: 'estimated_investment', fmt: v => `$${v?.toLocaleString()}` },
                ].map(({ label, key, maxKey, fmt, bold }) => (
                  <tr key={key} className={`hover:bg-orange-50/30 transition-colors ${bold ? 'bg-slate-50 font-bold' : ''}`}>
                    <td className="p-3 text-slate-700 font-sans">{label}</td>
                    {comparedSites.map(s => {
                      const val = s[key];
                      const isMax = maxKey && val === maxValues[maxKey] && val > 0;
                      return (
                        <td
                          key={s.site_id}
                          className={`p-3 text-center ${isMax ? 'bg-orange-50 text-orange-700 font-bold border border-orange-200' : 'text-slate-700'}`}
                        >
                          {val != null ? fmt(val) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* COMPARISON CHARTS */}
      {comparedSites.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. Score Multi-Factor Comparison Chart */}
          <Card title="Overall & Resource Score Comparison" subtitle="Scores scaled 0 - 100">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparedSites}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="site_name" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', color: '#1e293b' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="overall_suitability" name="Overall Score" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resource_score" name="Resource Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 2. Expected Energy Comparison Chart */}
          <Card title="Expected Annual Energy (MWh/yr)" subtitle="Combined Solar + Wind yield output">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparedSites}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="site_name" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', color: '#1e293b' }} />
                  <Bar dataKey="expected_energy" name="Energy MWh" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 3. Estimated Revenue Comparison Chart */}
          <Card title="Estimated Annual Revenue ($ USD)" subtitle="Projected sales revenue from tariff">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparedSites}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="site_name" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', color: '#1e293b' }} />
                  <Bar dataKey="estimated_revenue" name="Revenue ($)" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
