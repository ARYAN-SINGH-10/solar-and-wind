import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardAnalyticsApi } from '../services/analyticsService';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import {
  Sun, Wind, MapPin, FolderKanban, Activity, ArrowRight,
  ShieldCheck, Zap, Sliders, CheckCircle2, FileText, GitCompare,
  TrendingUp, Trophy, DollarSign, Award, Layers, Mountain, Users, Database, Cpu
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getDashboardAnalyticsApi();
        setAnalytics(data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load dashboard analytics from backend.');
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  if (loading) return <Loading message="Computing deterministic GIS analytics from PostgreSQL database..." />;
  if (error) return <ErrorMessage message={error} />;

  const cards = analytics?.cards || {};
  const charts = analytics?.charts || {};
  const roleViews = analytics?.role_views || {};

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-8 border border-slate-200 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-50/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-orange-500" />
            <span>Geospatial & AI Intelligence Platform</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Solar & Wind GIS Analytics Dashboard
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed max-w-xl">
            Real-time analytics engine powered by PostGIS spatial queries, deterministic physics formulas, and 7 Machine Learning prediction models.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              to="/map"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all text-sm shadow-sm"
            >
              <MapPin className="w-4 h-4" />
              <span>Interactive GIS Map</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/health"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-white text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm border border-slate-200 shadow-xs"
            >
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>System & API Diagnostics</span>
            </Link>
          </div>
        </div>
      </div>

      {/* AI / ML Intelligence Summary Banner */}
      <div className="bg-white border-2 border-orange-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-orange-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">AI / ML Intelligence Layer</h3>
              <p className="text-xs text-slate-500 font-medium">7 Machine Learning Prediction Models Active (v2.0.0)</p>
            </div>
          </div>
          <Badge type="orange">OPERATIONAL & CALIBRATED</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">Solar Prediction</span>
            <span className="font-bold text-orange-600">GradBoost</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">Wind Prediction</span>
            <span className="font-bold text-sky-600">RandForest</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">Suitability Class</span>
            <span className="font-bold text-emerald-600">4-Classes</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">Candidate Ranker</span>
            <span className="font-bold text-purple-600">Heuristic</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">Monthly Forecast</span>
            <span className="font-bold text-orange-600">Monthly ML</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">Investment Risk</span>
            <span className="font-bold text-emerald-600">Risk Matrix</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">Tech Recommendation</span>
            <span className="font-bold text-sky-600">Matching</span>
          </div>
        </div>
      </div>

      {/* 8 DASHBOARD SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: cards.total_projects, unit: '', icon: FolderKanban, color: 'text-orange-600', link: '/projects' },
          { label: 'Total Sites', value: cards.total_sites, unit: '', icon: MapPin, color: 'text-sky-600', link: '/sites' },
          { label: 'Excellent Sites', value: cards.excellent_sites, unit: '', icon: Trophy, color: 'text-emerald-600', link: '/suitability' },
          { label: 'Highly Suitable Sites', value: cards.highly_suitable_sites, unit: '', icon: CheckCircle2, color: 'text-purple-600', link: '/suitability' },
          { label: 'Solar Potential', value: cards.total_solar_potential_mwh?.toLocaleString(), unit: ' MWh/yr', icon: Sun, color: 'text-orange-500', link: '/solar-analysis' },
          { label: 'Wind Potential', value: cards.total_wind_potential_mwh?.toLocaleString(), unit: ' MWh/yr', icon: Wind, color: 'text-sky-600', link: '/wind-analysis' },
          { label: 'Expected Energy', value: cards.expected_energy_mwh?.toLocaleString(), unit: ' MWh/yr', icon: Zap, color: 'text-emerald-600', link: '/forecast' },
          { label: 'Estimated Revenue', value: `$${cards.estimated_revenue_usd?.toLocaleString()}`, unit: '/yr', icon: DollarSign, color: 'text-emerald-600', link: '/recommendations' },
        ].map(({ label, value, unit, icon: Icon, color, link }) => (
          <Link
            key={label}
            to={link}
            className="group bg-white p-5 rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all space-y-2"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>{label}</span>
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className="text-2xl font-black tracking-tight font-mono text-slate-900">
              {value != null ? `${value}${unit}` : '—'}
            </p>
            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              PostGIS Computed
            </p>
          </Link>
        ))}
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Site Suitability Distribution" subtitle="Categorized candidate sites by weighted score index">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.suitability_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(charts.suitability_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '12px', fontSize: '12px', color: '#171717', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#6B7280' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Solar vs Wind Potential by Site" subtitle="Annual energy yield comparison (MWh/yr)">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.solar_vs_wind_potential || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="site_name" stroke="#6B7280" fontSize={10} />
                <YAxis stroke="#6B7280" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '12px', fontSize: '12px', color: '#171717', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="solar_mwh" name="Solar MWh" fill="#F97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="wind_mwh" name="Wind MWh" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="12-Month Energy Generation Forecast" subtitle="Aggregated monthly output profile (MWh)">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.energy_forecast || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={11} />
                <YAxis stroke="#6B7280" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '12px', fontSize: '12px', color: '#171717', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="solar_mwh" name="Solar MWh" stackId="1" stroke="#F97316" fill="#F97316" fillOpacity={0.3} />
                <Area type="monotone" dataKey="wind_mwh" name="Wind MWh" stackId="1" stroke="#0EA5E9" fill="#0EA5E9" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="12-Month Tariff Revenue Forecast" subtitle="Aggregated projected revenue ($ USD)">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.revenue_forecast || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={11} />
                <YAxis stroke="#6B7280" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '12px', fontSize: '12px', color: '#171717', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                <Area type="monotone" dataKey="revenue_usd" name="Revenue ($)" stroke="#10B981" fill="#10B981" fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
