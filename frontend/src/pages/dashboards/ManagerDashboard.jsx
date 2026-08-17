import React, { useState, useEffect } from 'react';
import { getDashboardAnalyticsApi } from '../../services/analyticsService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import { FolderKanban, CheckCircle2, TrendingUp, DollarSign, FileText, ShieldCheck, Clock, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ManagerDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadManagerData = async () => {
      setLoading(true);
      try {
        const data = await getDashboardAnalyticsApi();
        setAnalytics(data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load manager dashboard.');
      } finally {
        setLoading(false);
      }
    };
    loadManagerData();
  }, []);

  if (loading) return <Loading message="Loading Project Governance metrics from backend..." />;
  if (error) return <ErrorMessage message={error} />;

  const pmInfo = analytics?.role_views?.project_manager || {};
  const statusCounts = pmInfo.status_breakdown || {};
  const milestones = pmInfo.deployment_milestones || [];

  return (
    <div className="space-y-6">
      {/* Role Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold font-mono">
            <span>ROLE: PROJECT MANAGER</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1.5 tracking-tight">Project Lifecycle, Progress & Feasibility Governance</h1>
          <p className="text-xs text-slate-500 font-medium">
            Monitor project stage approvals, candidate site feasibility sign-offs, target MW capacity goals, and deployment timelines.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link to="/projects" className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm transition-all">
            Manage All Projects →
          </Link>
        </div>
      </div>

      {/* Status Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 text-xs font-medium">Approved Projects</span>
          <p className="text-2xl font-bold text-emerald-600 font-mono">{statusCounts.APPROVED || 0}</p>
          <span className="text-[10px] text-emerald-600 font-mono font-medium">Feasibility Signed Off</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 text-xs font-medium">In Review</span>
          <p className="text-2xl font-bold text-orange-600 font-mono">{statusCounts.IN_REVIEW || 0}</p>
          <span className="text-[10px] text-orange-600 font-mono font-medium">Pending Evaluation</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 text-xs font-medium">Draft Projects</span>
          <p className="text-2xl font-bold text-sky-600 font-mono">{statusCounts.DRAFT || 0}</p>
          <span className="text-[10px] text-sky-600 font-mono font-medium">Initial Phase</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 text-xs font-medium">Approved Capacity</span>
          <p className="text-2xl font-bold text-purple-700 font-mono">{pmInfo.approved_mw_capacity} MW</p>
          <span className="text-[10px] text-slate-400 font-mono">Target: {pmInfo.target_mw_capacity} MW</span>
        </div>
      </div>

      {/* Deployment Timeline & Milestones Progress */}
      <Card title="Deployment Timeline & Stage Milestones" subtitle="Track progress across site selection, environmental, feasibility, and grid interconnect">
        <div className="space-y-4">
          {milestones.map(m => {
            const pct = Math.min(100, Math.round((m.completed / m.target) * 100));
            return (
              <div key={m.stage} className="space-y-1.5 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-900 font-bold">{m.stage}</span>
                  <span className="font-mono text-emerald-700 font-bold">{m.completed} / {m.target} ({pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full transition-all duration-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

