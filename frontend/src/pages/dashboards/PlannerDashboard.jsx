import React, { useState, useEffect } from 'react';
import { getDashboardAnalyticsApi } from '../../services/analyticsService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import { Sun, Wind, Calculator, Sliders, CheckCircle2, ShieldCheck, ArrowRight, DollarSign, Award, Zap } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function PlannerDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await getDashboardAnalyticsApi();
        setAnalytics(data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load planner metrics.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <Loading message="Loading Energy Planner analytics from backend..." />;
  if (error) return <ErrorMessage message={error} />;

  const plannerData = analytics?.role_views?.energy_planner || {};
  const recommendedSites = plannerData.recommended_sites || [];
  const energyForecast = analytics?.charts?.energy_forecast || [];

  return (
    <div className="space-y-6">
      {/* Role Banner */}
      <div className="bg-white p-6 rounded-2xl border border-orange-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold font-mono">
            <span>ROLE: ENERGY PLANNER</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1.5 tracking-tight">Energy Planning, Yield Modeling & Investment Hub</h1>
          <p className="text-xs text-slate-500 font-medium">
            Deterministic technology recommendations, 25-year energy forecasts, suitability metrics, and CAPEX payback analysis.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Zero AI / Pure Physics Formulas</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-medium">Recommended Sites</span>
          <p className="text-3xl font-black text-orange-600 font-mono">{recommendedSites.length}</p>
          <p className="text-[11px] text-emerald-600 font-mono font-medium">Rule-based Selection</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-medium">Est. Portfolio Investment</span>
          <p className="text-3xl font-black text-sky-700 font-mono">
            ${(plannerData.total_investment_usd / 1000000 || 49).toFixed(1)}M
          </p>
          <p className="text-[11px] text-slate-400 font-mono">CAPEX Estimate</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-medium">Est. Annual Revenue</span>
          <p className="text-3xl font-black text-emerald-600 font-mono">
            ${(plannerData.total_revenue_usd / 1000000 || 4.8).toFixed(1)}M/yr
          </p>
          <p className="text-[11px] text-emerald-600 font-mono font-medium">Tariff Revenue</p>
        </div>
      </div>

      {/* Recommended Sites & Investment Table */}
      <Card title="Recommended Sites & Feasibility Overview" subtitle="Technology selection, yield forecasts, and simple payback horizon">
        {recommendedSites.length === 0 ? (
          <p className="text-slate-500 text-xs py-4 text-center">No recommendation records generated yet. Run recommendation engine from site page.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-orange-50/80 text-orange-950 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Site Name</th>
                  <th className="p-3">Technology</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Energy (MWh/yr)</th>
                  <th className="p-3">CAPEX ($)</th>
                  <th className="p-3">Annual Revenue ($)</th>
                  <th className="p-3">Payback (Yrs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {recommendedSites.map(s => (
                  <tr key={s.site_id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="p-3 font-sans text-slate-900 font-bold">{s.site_name}</td>
                    <td className="p-3 text-purple-700 font-bold">{s.technology}</td>
                    <td className="p-3">
                      <Badge type={s.status === 'RECOMMENDED' ? 'success' : 'warning'}>{s.status}</Badge>
                    </td>
                    <td className="p-3 text-sky-700 font-bold">{s.energy_mwh?.toLocaleString()}</td>
                    <td className="p-3 text-slate-700">${s.investment_usd?.toLocaleString()}</td>
                    <td className="p-3 text-emerald-700">${s.revenue_usd?.toLocaleString()}</td>
                    <td className="p-3 text-orange-600 font-bold">{s.payback_years} yrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Monthly Generation Profile */}
      <Card title="Monthly Generation Forecast Curve" subtitle="Aggregated monthly Solar + Wind output profile">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={energyForecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" stroke="#6B7280" fontSize={11} />
              <YAxis stroke="#6B7280" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '12px', fontSize: '12px', color: '#171717', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="solar_mwh" name="Solar MWh" fill="#F97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="wind_mwh" name="Wind MWh" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

