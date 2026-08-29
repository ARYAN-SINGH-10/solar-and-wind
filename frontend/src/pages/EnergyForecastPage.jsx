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
import { predictEnergyForecastML } from '../services/mlService';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import ErrorMessage from '../components/common/ErrorMessage';
import { TrendingUp, Calculator, CheckCircle2, Cpu, AlertTriangle, RefreshCw } from 'lucide-react';

export default function EnergyForecastPage() {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [forecastResult, setForecastResult] = useState(null);

  // Inputs State
  const [technology, setTechnology] = useState('HYBRID');
  const [capacityMw, setCapacityMw] = useState(15.0);
  const [tariffUsdMwh, setTariffUsdMwh] = useState(65.0);
  const [capacityFactor, setCapacityFactor] = useState(28.5);
  const [targetMonth, setTargetMonth] = useState(6);

  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // AI / ML State
  const [mlResult, setMlResult] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState('');

  const fetchMLForecast = async (capMw, monthVal) => {
    setMlLoading(true);
    setMlError('');
    try {
      const res = await predictEnergyForecastML({
        month: Number(monthVal),
        historical_generation_mwh: 3500.0,
        solar_generation_mwh: 2000.0,
        wind_generation_mwh: 1500.0,
        irradiance: 2150.0,
        wind_speed: 7.5,
        temperature: 25.0,
        degradation_year: 1,
        installed_capacity_mw: Number(capMw),
      });
      setMlResult(res);
    } catch (err) {
      setMlError('AI/ML service unavailable. Showing deterministic forecast.');
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

      fetchMLForecast(capacityMw, targetMonth);
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
      fetchMLForecast(capacityMw, targetMonth);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to calculate energy forecast.');
    } finally {
      setCalculating(false);
    }
  };

  const monthlyList = forecastResult?.monthly_breakdown || [];
  const annualList = forecastResult?.annual_projections || [];

  const targetDetMonthlyGen = monthlyList.length >= targetMonth ? Number(monthlyList[targetMonth - 1].generation_mwh) : null;
  const mlMonthlyGen = mlResult ? Number(mlResult.prediction_monthly_mwh) : null;
  const forecastDiff = targetDetMonthlyGen && mlMonthlyGen ? (mlMonthlyGen - targetDetMonthlyGen) : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            <span>Energy Forecast & AI Intelligence</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            25-Year engineering degradation horizon model coupled with Gradient Boosting ML monthly forecasting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge type="success">DETERMINISTIC FORECAST</Badge>
          <Badge type="orange">AI/ML FORECAST LAYER</Badge>
        </div>
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
                <span>Target Forecast Month:</span>
                <span className="text-orange-600 font-mono font-bold">Month {targetMonth}</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={targetMonth}
                onChange={(e) => {
                  const m = Number(e.target.value);
                  setTargetMonth(m);
                  fetchMLForecast(capacityMw, m);
                }}
                className="w-full accent-orange-500 bg-slate-100 rounded-lg h-2"
              />
            </div>

            <button
              onClick={handleRunForecast}
              disabled={calculating || !selectedSiteId}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 text-xs flex items-center justify-center space-x-2 mt-2"
            >
              <Calculator className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />
              <span>{calculating ? 'Calculating Forecast...' : 'Run Forecast Engine'}</span>
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

          {/* AI / ML Forecast Component */}
          <div className="bg-white border-2 border-orange-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-orange-100 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-orange-500" />
                <h3 className="font-extrabold text-slate-900 text-sm">AI / ML Monthly Energy Generation Forecast</h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-orange-100 text-orange-800 rounded-md">
                ADDITIONAL ML INTELLIGENCE
              </span>
            </div>

            {mlLoading ? (
              <div className="py-6 text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                <span>Forecasting Month {targetMonth} Generation...</span>
              </div>
            ) : mlError ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{mlError}</span>
              </div>
            ) : mlResult ? (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500 font-medium block">Deterministic Month {targetMonth}</span>
                    <span className="text-base font-extrabold text-slate-900 font-mono">
                      {targetDetMonthlyGen ? `${fmtNum(targetDetMonthlyGen)} MWh` : 'N/A'}
                    </span>
                  </div>

                  <div className="p-3 bg-orange-50/80 border border-orange-200 rounded-xl">
                    <span className="text-[11px] text-orange-800 font-medium block">AI/ML Forecast Month {targetMonth}</span>
                    <span className="text-base font-extrabold text-orange-600 font-mono">
                      {fmtNum(mlResult.prediction_monthly_mwh)} MWh
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                    <span className="text-[11px] text-emerald-800 font-medium block">Variance (ML vs Det)</span>
                    <span className="text-base font-extrabold text-emerald-700 font-mono">
                      {forecastDiff !== null ? `${forecastDiff > 0 ? '+' : ''}${fmtNum(forecastDiff)} MWh` : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-orange-50/40 border border-orange-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-orange-950 block">Residual-based 95% Forecast Interval:</span>
                  <p className="font-mono text-xs font-bold text-slate-800">
                    [{fmtNum(mlResult.prediction_interval?.lower_bound_mwh)} MWh — {fmtNum(mlResult.prediction_interval?.upper_bound_mwh)} MWh]
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] text-slate-500 font-mono gap-1">
                  <span>Model: {mlResult.model} | R²: {mlResult.model_metrics?.r2}</span>
                  <span>Dataset: {mlResult.dataset_source}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                  Disclaimer: Calibrated development training model. Does not replace 25-year deterministic degradation forecast engine.
                </div>
              </div>
            ) : null}
          </div>

          {/* Monthly Generation Breakdown Table */}
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
        </div>
      </div>
    </div>
  );
}
