import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProjectApi } from '../services/projectService';
import Card from '../components/common/Card';
import ErrorMessage from '../components/common/ErrorMessage';
import { FolderPlus, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function CreateProject() {
  const [projectName, setProjectName] = useState('');
  const [projectCode, setProjectCode] = useState(`PROJ-${Date.now().toString().slice(-4)}`);
  const [region, setRegion] = useState('');
  const [description, setDescription] = useState('');
  const [landArea, setLandArea] = useState(25.0);
  const [status, setStatus] = useState('DRAFT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createProjectApi({
        project_name: projectName,
        project_code: projectCode,
        region,
        description,
        land_area: Number(landArea),
        status,
      });
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center space-x-2 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects List</span>
        </button>
      </div>

      <Card title="Create Renewable Energy Project" subtitle="Define target project region, code, land area, and initial status">
        <ErrorMessage message={error} />

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Mojave Desert Hybrid Facility"
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Project Code</label>
              <input
                type="text"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Region / Location Zone</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Southern California"
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Land Area (sq km)</label>
              <input
                type="number"
                step="0.5"
                value={landArea}
                onChange={(e) => setLandArea(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter detailed project scope, target MW goals, or site allocation notes..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Initial Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none font-medium"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="IN_REVIEW">IN REVIEW</option>
              <option value="APPROVED">APPROVED</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 text-xs mt-2"
          >
            {loading ? 'Creating Project & Recording Audit Log...' : 'Save & Create Project'}
          </button>
        </form>
      </Card>
    </div>
  );
}

