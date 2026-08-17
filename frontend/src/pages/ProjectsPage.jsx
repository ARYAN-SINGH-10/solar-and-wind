import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getProjectsApi,
  getProjectStatsApi,
  updateProjectApi,
  deleteProjectApi
} from '../services/projectService';
import { getSitesApi, deleteSiteApi } from '../services/siteService';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import Modal from '../components/common/Modal';
import {
  FolderKanban,
  MapPin,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('projects');

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Edit Project Modal State
  const [editingProject, setEditingProject] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editLandArea, setEditLandArea] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const pData = await getProjectsApi({ search, status: statusFilter });
      setProjects(pData.items || []);
      const sData = await getSitesApi({ search, status: statusFilter });
      setSites(sData.items || []);
      const stData = await getProjectStatsApi();
      setStats(stData);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load project & site records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter]);

  const handleEditClick = (p) => {
    setEditingProject(p);
    setEditName(p.project_name);
    setEditRegion(p.region);
    setEditStatus(p.status);
    setEditLandArea(p.land_area || '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await updateProjectApi(editingProject.id, {
        project_name: editName,
        region: editRegion,
        status: editStatus,
        land_area: Number(editLandArea),
      });
      setEditingProject(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update project.');
    }
  };

  const handleDeleteProject = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete project "${name}"? This action will record an audit log.`)) {
      try {
        await deleteProjectApi(id);
        loadData();
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to delete project.');
      }
    }
  };

  const handleDeleteSite = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete candidate site "${name}"?`)) {
      try {
        await deleteSiteApi(id);
        loadData();
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to delete site.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-orange-500" />
            <span>Project & Candidate Site Management</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Create, evaluate, edit, and filter deployment projects and PostGIS spatial candidate sites.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/projects/new"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </Link>
          <Link
            to="/sites/new"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Candidate Site</span>
          </Link>
        </div>
      </div>

      {/* Project Statistics Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Total Projects</span>
            <span className="text-2xl font-bold text-slate-900 font-mono">{stats.total_projects}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Draft Status</span>
            <span className="text-2xl font-bold text-orange-600 font-mono">{stats.draft_count}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-500 font-semibold block uppercase">In Review</span>
            <span className="text-2xl font-bold text-sky-600 font-mono">{stats.in_review_count}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Approved</span>
            <span className="text-2xl font-bold text-emerald-600 font-mono">{stats.approved_count}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Total Area</span>
            <span className="text-xl font-bold text-slate-900 font-mono">{stats.total_land_area_sq_km} km²</span>
          </div>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project name, code, region..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="IN_REVIEW">IN_REVIEW</option>
            <option value="APPROVED">APPROVED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'projects' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Projects ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab('sites')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'sites' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sites ({sites.length})
            </button>
          </div>
        </div>
      </div>

      <ErrorMessage message={error} />

      {loading ? (
        <Loading message="Loading database project records..." />
      ) : activeTab === 'projects' ? (
        /* Projects Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-orange-50/80 text-orange-950 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Project Code & Name</th>
                  <th className="p-4">Region</th>
                  <th className="p-4">Land Area</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-sans text-xs">
                      No projects matching criteria. Click 'Create Project' above to add one.
                    </td>
                  </tr>
                ) : (
                  projects.map((p) => (
                    <tr key={p.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="p-4 font-sans">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 font-mono">
                          {p.project_code}
                        </span>
                        <p className="font-bold text-slate-900 mt-1 text-sm">{p.project_name}</p>
                      </td>
                      <td className="p-4 font-sans">{p.region}</td>
                      <td className="p-4">{p.land_area ? `${p.land_area} km²` : 'N/A'}</td>
                      <td className="p-4">
                        <Badge
                          type={
                            p.status === 'APPROVED'
                              ? 'success'
                              : p.status === 'IN_REVIEW'
                              ? 'info'
                              : 'warning'
                          }
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-right space-x-2 font-sans">
                        <Link
                          to={`/projects/${p.id}`}
                          className="inline-flex items-center space-x-1 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleEditClick(p)}
                          className="p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200"
                          title="Edit Project"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(p.id, p.project_name)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Sites Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-orange-50/80 text-orange-950 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Site Name</th>
                  <th className="p-4">PostGIS Coordinates</th>
                  <th className="p-4">Region</th>
                  <th className="p-4">Land Area</th>
                  <th className="p-4">Elevation</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {sites.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-sans text-xs">
                      No candidate sites matching criteria. Click 'Add Candidate Site' above.
                    </td>
                  </tr>
                ) : (
                  sites.map((s) => (
                    <tr key={s.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="p-4 font-sans font-bold text-slate-900 flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-sky-600 flex-shrink-0" />
                        <span>{s.site_name}</span>
                      </td>
                      <td className="p-4 text-orange-600 text-[11px]">
                        {s.latitude}, {s.longitude}
                      </td>
                      <td className="p-4 font-sans">{s.region || 'N/A'}</td>
                      <td className="p-4">{s.land_area ? `${s.land_area} km²` : 'N/A'}</td>
                      <td className="p-4">{s.elevation ? `${s.elevation} m` : 'N/A'}</td>
                      <td className="p-4">
                        <Badge type="success">{s.status}</Badge>
                      </td>
                      <td className="p-4 text-right space-x-2 font-sans">
                        <Link
                          to={`/sites/${s.id}`}
                          className="inline-flex items-center space-x-1 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                          title="View Site"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteSite(s.id, s.site_name)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                          title="Delete Site"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      <Modal
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        title={`Edit Project: ${editingProject?.project_name}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Project Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Region</label>
            <input
              type="text"
              value={editRegion}
              onChange={(e) => setEditRegion(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="IN_REVIEW">IN_REVIEW</option>
                <option value="APPROVED">APPROVED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Land Area (sq km)</label>
              <input
                type="number"
                step="0.5"
                value={editLandArea}
                onChange={(e) => setEditLandArea(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingProject(null)}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 shadow-sm"
            >
              Save Project Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
