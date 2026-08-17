import React, { useState, useEffect } from 'react';
import { fetchSites, fetchProjects } from '../services/api';
import {
  getAllReportsApi,
  generateReportApi,
  getReportDetailApi,
  deleteReportApi,
  downloadReportFileApi,
} from '../services/platformService';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import {
  FileText, Plus, Download, Eye, Trash2, CheckCircle2,
  RefreshCw, FileSpreadsheet, X, Layers, Building
} from 'lucide-react';

const REPORT_OPTIONS = [
  { code: 'site-assessment', label: '1. Site Assessment Report', desc: 'Comprehensive site parameters, terrain, coordinates, & infrastructure' },
  { code: 'solar', label: '2. Solar Potential Report', desc: 'GHI irradiance, peak sun hours, PV efficiency, & solar yield output' },
  { code: 'wind', label: '3. Wind Potential Report', desc: '100m wind speed, wind power density (WPD), & turbine suitability' },
  { code: 'feasibility', label: '4. Feasibility Report', desc: '5-Factor weighted suitability index, score breakdown, & 25-yr forecast' },
  { code: 'investment', label: '5. Investment Report', desc: 'Technology recommendation rationale, CAPEX estimate, & payback horizon' },
];

function ReportDetailModal({ report, onClose, onDownload }) {
  if (!report) return null;
  const data = report.report_data || {};
  const summary = data.summary || {};
  const siteInfo = data.site_info || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{report.title}</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Type: {report.report_type} | ID: {report.id}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Overall Site Score', value: summary.overall_score != null ? `${summary.overall_score} / 100` : null, color: 'text-emerald-700' },
              { label: 'Suitability Category', value: summary.suitability_category, color: 'text-sky-700' },
              { label: 'Recommended Tech', value: summary.recommended_technology, color: 'text-orange-600' },
              { label: 'Est. Investment', value: summary.estimated_investment_usd != null ? `$${Number(summary.estimated_investment_usd).toLocaleString()}` : null, color: 'text-slate-900' },
              { label: 'Est. Annual Revenue', value: summary.estimated_annual_revenue_usd != null ? `$${Number(summary.estimated_annual_revenue_usd).toLocaleString()}/yr` : null, color: 'text-emerald-700' },
              { label: 'Solar Output', value: summary.solar_annual_energy_kwh != null ? `${(summary.solar_annual_energy_kwh / 1000).toLocaleString()} MWh/yr` : null, color: 'text-orange-600' },
            ].filter(m => m.value != null).map(m => (
              <div key={m.label} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <p className="text-slate-500">{m.label}</p>
                <p className={`font-bold text-sm mt-0.5 ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Site Metadata */}
          <Card title="Site Information">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              {Object.entries(siteInfo).map(([k, v]) => v != null && (
                <div key={k} className="flex flex-col">
                  <span className="text-slate-500 capitalize">{k.replace(/_/g, ' ')}</span>
                  <span className="text-slate-800 font-bold">{String(v)}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Full Payload Preview */}
          <Card title="Structured Database Report Payload (JSON)">
            <pre className="text-[10px] text-slate-600 font-mono overflow-x-auto bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-64 overflow-y-auto whitespace-pre-wrap">
              {JSON.stringify(data, null, 2)}
            </pre>
          </Card>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={() => onDownload(report.id, 'pdf')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs transition-all"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={() => onDownload(report.id, 'excel')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Download Excel
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [sites, setSites] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedReportType, setSelectedReportType] = useState('site-assessment');
  const [detailReport, setDetailReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [allReps, sitesRes, projRes] = await Promise.all([
        getAllReportsApi(),
        fetchSites(),
        fetchProjects(),
      ]);
      setReports(allReps);
      const sItems = Array.isArray(sitesRes) ? sitesRes : (sitesRes.items || []);
      const pItems = Array.isArray(projRes) ? projRes : (projRes.items || []);
      setSites(sItems);
      setProjects(pItems);
      if (!selectedSiteId && sItems.length > 0) setSelectedSiteId(sItems[0].id);
    } catch (err) {
      setError('Failed to load reports history or sites.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleGenerate = async () => {
    if (!selectedSiteId) {
      setError('Please select a candidate site first.');
      return;
    }
    setGenerating(true);
    setError('');
    setSuccessMsg('');
    try {
      const result = await generateReportApi(selectedReportType, selectedSiteId, selectedProjectId || null);
      setSuccessMsg(`Successfully generated ${selectedReportType.toUpperCase()} report: "${result.title}"`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate report.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadFile = async (reportId, format) => {
    setDownloadingId(reportId);
    try {
      const response = await downloadReportFileApi(reportId, format);
      const blob = new Blob([response.data], {
        type: format === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${format.toUpperCase()}_Report_${reportId.slice(0, 8)}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download report binary.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleViewDetail = async (reportId) => {
    try {
      const rep = await getReportDetailApi(reportId);
      setDetailReport(rep);
    } catch {
      setError('Failed to view report detail.');
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Delete this report record?')) return;
    try {
      await deleteReportApi(reportId);
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch {
      setError('Failed to delete report.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-orange-500" />
            <span>Automated Technical Report Generation System</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Generate 5 official technical reports using actual database results. Includes styled PDF generation & Excel workbook exports. Zero fake data!
          </p>
        </div>
        <Badge type="info">{reports.length} Reports Archived</Badge>
      </div>

      {/* Report Generator Panel */}
      <Card title="Generate New Technical Report" subtitle="Select report type, target site, and optional project">
        <div className="space-y-4">
          {/* Report Type Selector Buttons */}
          <div>
            <label className="text-xs text-slate-700 font-bold block mb-2">1. Select Report Type *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {REPORT_OPTIONS.map(opt => (
                <button
                  key={opt.code}
                  onClick={() => setSelectedReportType(opt.code)}
                  className={`text-left p-3 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                    selectedReportType === opt.code
                      ? 'bg-orange-50 border-orange-400 text-orange-800 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-orange-300 hover:bg-orange-50/40'
                  }`}
                >
                  <span className="font-bold block mb-1">{opt.label}</span>
                  <span className="text-[10px] text-slate-500 leading-tight">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Site & Project Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-700 font-bold block mb-1">2. Select Candidate Site *</label>
              <select
                value={selectedSiteId}
                onChange={e => setSelectedSiteId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-mono"
              >
                {sites.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.site_name} ({s.region || 'Region N/A'}) — Lat: {s.latitude != null ? parseFloat(s.latitude).toFixed(3) : 'N/A'}°
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-700 font-bold block mb-1">3. Associate Project (Optional)</label>
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-mono"
              >
                <option value="">No Project (Standalone Candidate Site)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.project_name} ({p.project_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedSiteId}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Aggregating DB Results & Generating...' : 'Generate Official Technical Report'}
          </button>
        </div>
      </Card>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs font-mono font-bold">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <ErrorMessage message={error} />

      {/* Report History */}
      {loading ? (
        <Loading message="Loading reports history from database..." />
      ) : (
        <Card title="Generated Reports History" subtitle="Inspect JSON payloads or download actual PDF & Excel files">
          {reports.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No reports generated yet. Select a site and generate one above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map(rep => (
                <div
                  key={rep.id}
                  className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-orange-200 hover:bg-orange-50/20 transition-all shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{rep.title || rep.report_type}</h4>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Type: <span className="text-orange-600 font-bold">{rep.report_type}</span> | Date: {new Date(rep.generated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleViewDetail(rep.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-xs transition-all border border-sky-200"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View JSON
                    </button>
                    <button
                      onClick={() => handleDownloadFile(rep.id, 'pdf')}
                      disabled={downloadingId === rep.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs transition-all border border-red-200 disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </button>
                    <button
                      onClick={() => handleDownloadFile(rep.id, 'excel')}
                      disabled={downloadingId === rep.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs transition-all border border-emerald-200 disabled:opacity-50"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Excel
                    </button>
                    <button
                      onClick={() => handleDelete(rep.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                      title="Delete Report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {detailReport && (
        <ReportDetailModal
          report={detailReport}
          onClose={() => setDetailReport(null)}
          onDownload={handleDownloadFile}
        />
      )}
    </div>
  );
}
