import React, { useState, useEffect } from 'react';

// Safe number formatter — never throws on null/undefined
function fmtNum(value, digits = 2) {
  if (value === null || value === undefined || value === '') return 'N/A';
  const n = Number(value);
  if (Number.isNaN(n)) return 'N/A';
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}
import { getSitesApi } from '../services/siteService';
import { calculateEnergyForecastApi, getEnergyForecastApi } from '../services/analysisService';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { TrendingUp, Calendar, DollarSign, Zap, RefreshCw, Calculator, Sun, Wind, GitCompare, CheckCircle2 } from 'lucide-react';

export default function EnergyForecastPage() {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [forecastResult, setForecastResult] = useState(null);

  // Inputs State
  const [technology, setTechnology] = useState('HYBRID');
  const [capacityMw, setCapacityMw] = useState(15.0);
  const [tariffUsdMwh, setTariffUsdMwh] = useState(65.0);
  const [capacityFactor, setCapacityFactor] = useState(28.5);

  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
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
        const fc = await getEnergyForecastApi(targetSiteId, {
          technology,
          tariff: tariffUsdMwh,
          capacity: capacityMw
        });
        setForecastResult(fc);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load energy forecast.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSiteId, technology]);

  const handleRunForecast = async () => {
    if (!selectedSiteId) return;
    setCalculating(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await calculateEnergyForecastApi(selectedSiteId, {
        installed_capacity_mw: Number(capacityMw),
        technology,
        electricity_tariff_usd_mwh: Number(tariffUsdMwh),
        capacity_factor_pct: Number(capacityFactor),
        performance_ratio: 0.82,
      });
      setForecastResult(res);
      setSuccessMsg('Successfully computed 12-month and 25-year deterministic energy forecast.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to calculate energy forecast.');
    } finally {
      setCalculating(false);
    }
  };

  const monthlyList = forecastResult?.monthly_breakdown || [];
  const annualList = forecastResult?.annual_projections || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            <span>Deterministic Energy Generation & Revenue Forecast</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Calculated engineering estimates derived from GHI irradiance, 100m wind speed, PPA tariffs, and 25-year degradation profiles.
          </p>
        </div>

        <Badge type="success">ZERO AI / CALCULATED ESTIMATES ONLY</Badge>
      </div>

      {/* Target Site Selector */}
      <Card title="Select Target Deployment Site" subtitle="Candidate site coordinates for energy & tariff revenue modeling">
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
        {/* Controls Panel */}
        <Card title="Forecast Configurable Inputs" subtitle="Adjust technology, capacity, and PPA tariff">
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Technology</label>
              <div className="grid grid-cols-3 gap-2">
                {['SOLAR', 'WIND', 'HYBRID'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTechnology(t)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      technology === t
                        ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 font-bold mb-1">
                <span>Installed Capacity (MW):</span>
                <span className="text-orange-600 font-mono font-bold">{capacityMw} MW</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="200.0"
                step="1.0"
                value={capacityMw}
                onChange={(e) => setCapacityMw(Number(e.target.value))}
                className="w-full accent-orange-500 bg-slate-100 rounded-lg h-2"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-700 font-bold mb-1">
                <span>PPA Tariff Rate ($/MWh):</span>
                <span className="text-orange-600 font-mono font-bold">${tariffUsdMwh} / MWh</span>
              </div>
              <input
                type="range"
                min="20.0"
                max="200.0"
                step="1.0"
                value={tariffUsdMwh}
                onChange={(e) => setTariffUsdMwh(Number(e.target.value))}
                className="w-full accent-orange-500 bg-slate-100 rounded-lg h-2"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-700 font-bold mb-1">
                <span>Target Capacity Factor (%):</span>
                <span className="text-sky-700 font-mono font-bold">{capacityFactor}%</span>
              </div>
              <input
                type="range"
                min="10.0"
                max="60.0"
                step="0.5"
                value={capacityFactor}
                onChange={(e) => setCapacityFactor(Number(e.target.value))}
                className="w-full accent-orange-500 bg-slate-100 rounded-lg h-2"
              />
            </div>

            <button
              onClick={handleRunForecast}
              disabled={calculating || !selectedSiteId}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 text-xs flex items-center justify-center space-x-2 mt-2"
            >
              <Calculator className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />
              <span>{calculating ? 'Calculating Forecast...' : 'Run Deterministic Forecast'}</span>
            </button>
          </div>
        </Card>

        {/* Results & Monthly Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <span className="text-xs text-slate-500 font-medium block">Annual Output</span>
              <span className="text-xl font-extrabold text-orange-600 font-mono">
                {forecastResult ? `${fmtNum(forecastResult.annual_generation_mwh)} MWh` : 'N/A'}
              </span>
            </Card>

            <Card>
              <span className="text-xs text-slate-500 font-medium block">Annual Revenue</span>
              <span className="text-xl font-extrabold text-emerald-600 font-mono">
                {forecastResult ? `$${fmtNum(forecastResult.annual_revenue_usd, 0)}` : 'N/A'}
              </span>
            </Card>

            <Card>
              <span className="text-xs text-slate-500 font-medium block">25-Yr Total Output</span>
              <span className="text-xl font-extrabold text-sky-700 font-mono">
                {forecastResult ? `${fmtNum(forecastResult['25_year_total_energy_mwh'])} MWh` : 'N/A'}
              </span>
            </Card>

            <Card>
              <span className="text-xs text-slate-500 font-medium block">25-Yr Total Revenue</span>
              <span className="text-xl font-extrabold text-purple-700 font-mono">
                {forecastResult ? `$${fmtNum(forecastResult['25_year_total_revenue_usd'], 0)}` : 'N/A'}
              </span>
            </Card>
          </div>

          {/* Monthly Generation & Revenue Table */}
          <Card title="Monthly Generation & Revenue Breakdown" subtitle="12-Month seasonal simulation">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-orange-50/80 text-orange-950 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 font-mono">
                  <tr>
                    <th className="p-3">Month</th>
                    <th className="p-3">Generation (MWh)</th>
                    <th className="p-3">Tariff Rate</th>
                    <th className="p-3">Estimated Revenue ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {monthlyList.map((m) => (
                    <tr key={m.month_index} className="hover:bg-orange-50/30 transition-colors">
                      <td className="p-3 font-sans font-bold text-slate-900">{m.month_name}</td>
                      <td className="p-3 text-orange-600 font-bold">{fmtNum(m.generation_mwh)} MWh</td>
                      <td className="p-3 text-slate-500">${m.tariff_usd_mwh} / MWh</td>
                      <td className="p-3 text-emerald-600 font-bold">${fmtNum(m.revenue_usd, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* 25-Year Annual Degradation Horizon Table */}
          <Card title="25-Year Long-Term Horizon Projections" subtitle="0.5%/yr solar/wind degradation decay model">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-orange-50/80 text-orange-950 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 font-mono">
                  <tr>
                    <th className="p-3">Operating Year</th>
                    <th className="p-3">Annual Generation</th>
                    <th className="p-3">Annual Revenue</th>
                    <th className="p-3">Cumulative Energy</th>
                    <th className="p-3">Cumulative Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {annualList.map((a) => (
                    <tr key={a.year} className="hover:bg-orange-50/30 transition-colors">
                      <td className="p-3 font-sans font-bold text-sky-700">Year {a.year}</td>
                      <td className="p-3 font-bold">{fmtNum(a.generation_mwh)} MWh</td>
                      <td className="p-3 text-emerald-600 font-bold">${fmtNum(a.revenue_usd, 0)}</td>
                      <td className="p-3 text-slate-600">{fmtNum(a.cumulative_energy_mwh)} MWh</td>
                      <td className="p-3 text-purple-700 font-bold">${fmtNum(a.cumulative_revenue_usd, 0)}</td>
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
