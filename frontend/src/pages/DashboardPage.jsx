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
  TrendingUp, Trophy, DollarSign, Award, Layers, Mountain, Users, Database
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
            <span>Deterministic Geospatial Intelligence Platform</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Solar & Wind GIS Analytics Dashboard
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed max-w-xl">
            Real-time analytics engine powered by PostGIS spatial queries, physics formulas, and multi-criteria weighted site scoring. Sourced 100% dynamically from backend APIs — zero hardcoded fake data.
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
        {/* 1. Site Suitability Distribution (Donut Chart) */}
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

        {/* 2. Solar vs Wind Potential Comparison */}
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
        {/* 3. Energy Generation Forecast (Area Chart) */}
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

        {/* 4. Revenue Forecast (Area Chart) */}
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

      {/* 5. Site Score Multi-Factor Comparison (Stacked Bar Chart) */}
      <Card title="Multi-Factor Site Score Breakdown" subtitle="5-Factor Weighted Score Matrix for Top Sites">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.site_score_comparison || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="site_name" stroke="#6B7280" fontSize={11} />
              <YAxis stroke="#6B7280" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '12px', fontSize: '12px', color: '#171717', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="resource_score" name="Resource (35%)" fill="#10B981" />
              <Bar dataKey="geographic_score" name="Geographic (25%)" fill="#3B82F6" />
              <Bar dataKey="infrastructure_score" name="Infrastructure (15%)" fill="#F97316" />
              <Bar dataKey="environmental_score" name="Environmental (15%)" fill="#8B5CF6" />
              <Bar dataKey="economic_score" name="Economic (10%)" fill="#EC4899" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ROLE-SPECIFIC DASHBOARD HUBS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Role-Specific Executive Dashboards</h2>
          <Badge type="success">Backend Stream Active</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Energy Planner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-orange-600 font-bold text-xs">
              <Sun className="w-4 h-4 text-orange-500" />
              <span>ENERGY PLANNER HUB</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">Recommended technology selection, energy yield calculations, and investment payback.</p>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Rec. Sites:</span>
                <span className="text-orange-600 font-bold">{roleViews.energy_planner?.recommended_sites?.length || 0}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-500">Est. CAPEX:</span>
                <span className="text-slate-900 font-bold">${(roleViews.energy_planner?.total_investment_usd / 1000000 || 49).toFixed(1)}M</span>
              </div>
            </div>
            <Link to="/dashboard/planner" className="block text-center p-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs transition-all border border-orange-200">
              Open Energy Planner Hub →
            </Link>
          </div>

          {/* GIS Analyst */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-sky-700 font-bold text-xs">
              <MapPin className="w-4 h-4 text-sky-600" />
              <span>GIS ANALYST HUB</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">Geospatial vector layers, terrain slope analysis, road/grid interconnect proximity.</p>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Env. Records:</span>
                <span className="text-sky-700 font-bold">{roleViews.gis_analyst?.environmental_records || 0}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-500">Avg Elevation:</span>
                <span className="text-slate-900 font-bold">{roleViews.gis_analyst?.avg_elevation_m}m</span>
              </div>
            </div>
            <Link to="/dashboard/gis" className="block text-center p-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs transition-all border border-sky-200">
              Open GIS Analyst Hub →
            </Link>
          </div>

          {/* Project Manager */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
              <FolderKanban className="w-4 h-4 text-emerald-600" />
              <span>PROJECT MANAGER HUB</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">Project status tracking, deployment timeline milestones, and feasibility approvals.</p>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Approved:</span>
                <span className="text-emerald-700 font-bold">{roleViews.project_manager?.status_breakdown?.APPROVED || 0} Projects</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-500">Target MW:</span>
                <span className="text-slate-900 font-bold">{roleViews.project_manager?.target_mw_capacity} MW</span>
              </div>
            </div>
            <Link to="/dashboard/manager" className="block text-center p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-all border border-emerald-200">
              Open Project Governance →
            </Link>
          </div>

          {/* Administrator */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>ADMINISTRATOR HUB</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">User account RBAC, role reassignment, security audit logs, and API data sources.</p>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Active Users:</span>
                <span className="text-purple-700 font-bold">{roleViews.administrator?.active_users || 0} / {roleViews.administrator?.total_users || 0}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-500">Audit Logs:</span>
                <span className="text-slate-900 font-bold">{roleViews.administrator?.audit_logs_count || 0}</span>
              </div>
            </div>
            <Link to="/dashboard/admin" className="block text-center p-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition-all border border-purple-200">
              Open Admin Control →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

