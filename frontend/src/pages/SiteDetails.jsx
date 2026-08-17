import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getSiteByIdApi } from '../services/siteService';
import { generateSiteReportApi } from '../services/platformService';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import {
  MapPin, ArrowLeft, Sun, Wind, CheckCircle2, BarChart3,
  Cpu, Map, FileText, Zap, Award, GitCompare, RefreshCw, Check
} from 'lucide-react';

const WORKFLOW_STAGES = [
  { code: 'CREATED', label: '1. Created', desc: 'Site defined' },
  { code: 'DATA_PENDING', label: '2. Pending Data', desc: 'Awaiting APIs' },
  { code: 'DATA_COLLECTED', label: '3. Data Collected', desc: 'NASA & OSM' },
  { code: 'ANALYZED', label: '4. Analyzed', desc: 'Solar & Wind' },
  { code: 'SUITABILITY_CALCULATED', label: '5. Suitability', desc: '5-Factor SSI' },
  { code: 'SCORED', label: '6. Scored', desc: 'Index score' },
  { code: 'FORECASTED', label: '7. Forecasted', desc: '25-yr yield' },
  { code: 'OPTIMIZED', label: '8. Optimized', desc: 'Layout & MW' },
  { code: 'RECOMMENDATION_READY', label: '9. Recomm. Ready', desc: 'Tech choice' },
  { code: 'REPORT_GENERATED', label: '10. Report Ready', desc: 'PDF / Excel' },
];

const ACTION_LINKS = [
  { label: 'Environmental Data', icon: RefreshCw, path: '/environmental-data', color: 'text-cyan-400 hover:bg-cyan-500/10 border-cyan-500/20' },
  { label: 'Solar Analysis', icon: Sun, path: '/solar-analysis', color: 'text-amber-400 hover:bg-amber-500/10 border-amber-500/20' },
  { label: 'Wind Analysis', icon: Wind, path: '/wind-analysis', color: 'text-sky-400 hover:bg-sky-500/10 border-sky-500/20' },
  { label: 'Site Suitability', icon: CheckCircle2, path: '/suitability', color: 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20' },
  { label: 'Site Score', icon: BarChart3, path: '/scoring', color: 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20' },
  { label: 'Energy Forecast', icon: Zap, path: '/forecast', color: 'text-purple-400 hover:bg-purple-500/10 border-purple-500/20' },
  { label: 'Optimization', icon: Cpu, path: '/optimization', color: 'text-sky-400 hover:bg-sky-500/10 border-sky-500/20' },
  { label: 'Recommendation', icon: Award, path: '/recommendations', color: 'text-amber-400 hover:bg-amber-500/10 border-amber-500/20' },
  { label: 'GIS Map', icon: Map, path: '/map', color: 'text-sky-400 hover:bg-sky-500/10 border-sky-500/20' },
  { label: 'Compare Sites', icon: GitCompare, path: '/comparison', color: 'text-purple-400 hover:bg-purple-500/10 border-purple-500/20' },
];

export default function SiteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportMsg, setReportMsg] = useState('');

  useEffect(() => {
    const loadSite = async () => {
      setLoading(true);
      try {
        const data = await getSiteByIdApi(id);
        setSite(data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load site details.');
      } finally {
        setLoading(false);
      }
    };
    loadSite();
  }, [id]);

  const handleQuickReport = async () => {
    setReportGenerating(true);
    setReportMsg('');
    try {
      await generateSiteReportApi(id, 'FULL_FEASIBILITY');
      setReportMsg('Full Feasibility Report generated. View in Reports page.');
      // Refresh site to update status to REPORT_GENERATED
      const updated = await getSiteByIdApi(id);
      setSite(updated);
    } catch (err) {
      setReportMsg(err.response?.data?.detail || 'Failed to generate report.');
    } finally {
      setReportGenerating(false);
    }
  };

  if (loading) return <Loading message="Loading site details from PostGIS database..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!site) return <ErrorMessage message="Site record not found." />;

  const currentStatus = site.status || 'CREATED';
  const currentStageIndex = WORKFLOW_STAGES.findIndex(s => s.code === currentStatus);
  const activeIndex = currentStageIndex >= 0 ? currentStageIndex : 0;

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link to="/projects" className="inline-flex items-center space-x-2 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Projects</span>
      </Link>

      {/* Site Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-sky-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{site.site_name}</h1>
            <p className="text-xs text-slate-500 font-mono font-medium mt-0.5">
              {site.latitude && site.longitude
                ? `${parseFloat(site.latitude).toFixed(6)}°N, ${parseFloat(site.longitude).toFixed(6)}°W`
                : 'Coordinates not specified'} | EPSG:4326 (WGS84)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge type="info">{currentStatus}</Badge>
          <button
            onClick={handleQuickReport}
            disabled={reportGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all disabled:opacity-50 shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            {reportGenerating ? 'Generating...' : 'Quick Report'}
          </button>
        </div>
      </div>

      {reportMsg && (
        <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-mono font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-sky-600" />
          {reportMsg}
        </div>
      )}

      {/* 10-STAGE WORKFLOW STEPPER PROGRESS BAR */}
      <Card title="End-to-End Candidate Site Workflow Status" subtitle="Tracks site lifecycle from creation to report generation">
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
            {WORKFLOW_STAGES.map((stg, idx) => {
              const isCompleted = idx < activeIndex;
              const isCurrent = idx === activeIndex;
              return (
                <div
                  key={stg.code}
                  className={`p-2.5 rounded-xl border flex flex-col justify-between text-left transition-all ${
                    isCurrent
                      ? 'bg-orange-50 border-orange-300 text-orange-800 font-bold shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold font-mono truncate">{stg.label}</span>
                    {isCompleted ? (
                      <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                    ) : isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping flex-shrink-0" />
                    ) : null}
                  </div>
                  <span className="text-[9px] text-slate-500 leading-tight block font-medium">{stg.desc}</span>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-600">
              Current Workflow State: <strong className="text-orange-600">{currentStatus}</strong>
            </span>
            <span className="text-slate-500 text-[11px]">
              Step {activeIndex + 1} of 10 ({Math.round(((activeIndex + 1) / 10) * 100)}% Complete)
            </span>
          </div>
        </div>
      </Card>

      {/* Core Site Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Land Area', value: site.land_area ? `${site.land_area} km²` : 'N/A', color: 'text-slate-900' },
          { label: 'Elevation', value: site.elevation ? `${site.elevation} m ASL` : 'N/A', color: 'text-sky-700' },
          { label: 'Region', value: site.region || 'N/A', color: 'text-orange-600' },
          { label: 'Land Ownership', value: site.land_ownership || 'Public', color: 'text-emerald-700' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <span className="text-[10px] text-slate-500 block font-medium">{label}</span>
            <span className={`text-base font-bold font-mono ${color}`}>{value}</span>
          </Card>
        ))}
      </div>

      {/* Full Site Data */}
      <Card title="Site Technical Record" subtitle="PostGIS spatial attributes and land information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs font-mono divide-y divide-slate-100 sm:divide-y-0">
          {[
            ['Site Name', site.site_name],
            ['Project ID', site.project_id || 'Standalone'],
            ['Latitude', site.latitude ? `${parseFloat(site.latitude).toFixed(8)}°` : 'N/A'],
            ['Longitude', site.longitude ? `${parseFloat(site.longitude).toFixed(8)}°` : 'N/A'],
            ['Region', site.region || 'N/A'],
            ['Land Area', site.land_area ? `${site.land_area} km²` : 'N/A'],
            ['Elevation', site.elevation ? `${site.elevation} m` : 'N/A'],
            ['Land Ownership', site.land_ownership || 'Public'],
            ['Workflow Status', site.status || 'CREATED'],
            ['Created Date', site.created_at ? new Date(site.created_at).toLocaleString() : 'N/A'],
          ].map(([key, val]) => (
            <div key={key} className="flex justify-between py-2.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">{key}:</span>
              <span className="text-slate-900 font-bold">{val}</span>
            </div>
          ))}
        </div>

        {site.existing_infrastructure && (
          <div className="mt-4">
            <span className="text-xs text-slate-700 font-bold block mb-1">Existing Infrastructure:</span>
            <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono">
              {site.existing_infrastructure}
            </p>
          </div>
        )}
      </Card>

      {/* Analysis Action Hub */}
      <Card title="Site Analysis Hub" subtitle="Execute calculations for this site in sequence">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {ACTION_LINKS.map(({ label, icon: Icon, path }) => (
            <Link
              key={label}
              to={path}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white border border-slate-200 hover:border-orange-300 hover:shadow-md text-xs font-bold text-center transition-all text-slate-700 hover:text-orange-600 shadow-xs"
            >
              <Icon className="w-5 h-5 text-orange-500" />
              {label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

