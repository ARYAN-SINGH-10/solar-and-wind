import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProjectByIdApi } from '../services/projectService';
import { getSitesApi } from '../services/siteService';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { FolderKanban, MapPin, Calendar, Layers, ArrowLeft, Plus } from 'lucide-react';

export default function ProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDetails() {
      try {
        const pData = await getProjectByIdApi(id);
        setProject(pData);
        const sData = await getSitesApi(id);
        setSites(sData);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load project details.');
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [id]);

  if (loading) return <Loading message="Retrieving project & spatial site details..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!project) return <ErrorMessage message="Project not found." />;

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center space-x-2 text-xs text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Projects</span>
      </Link>

      <Card
        title={project.project_name}
        subtitle={`Code: ${project.project_code} | Region: ${project.region}`}
        action={<Badge type="success">{project.status}</Badge>}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed font-normal">{project.description || 'No description provided.'}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono">
            <div>
              <span className="text-slate-500 block text-[10px] font-medium">Land Area:</span>
              <span className="text-slate-900 font-bold">{project.land_area} sq km</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-medium">Candidate Sites:</span>
              <span className="text-orange-600 font-bold">{sites.length} Sites</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-medium">Created Date:</span>
              <span className="text-slate-700">{new Date(project.created_at).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-medium">CRS System:</span>
              <span className="text-sky-700 font-bold">EPSG:4326</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Associated Candidate Sites Table */}
      <Card
        title="Associated Candidate Sites"
        subtitle="PostGIS POINT geometry locations and environmental status"
        action={
          <Link
            to="/sites/new"
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500 text-white font-bold text-xs hover:bg-sky-600 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Candidate Site</span>
          </Link>
        }
      >
        {sites.length === 0 ? (
          <p className="text-slate-500 text-xs py-4 text-center">No candidate sites associated with this project yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 font-mono">
              <thead className="bg-orange-50/80 text-orange-950 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Site Name</th>
                  <th className="p-3">Lat / Lon Coordinates</th>
                  <th className="p-3">Area</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sites.map((s) => (
                  <tr key={s.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="p-3 font-sans font-bold text-slate-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-sky-600" />
                      <span>{s.site_name}</span>
                    </td>
                    <td className="p-3 text-orange-600 font-bold">{s.latitude}, {s.longitude}</td>
                    <td className="p-3">{s.land_area ? `${s.land_area} km²` : 'N/A'}</td>
                    <td className="p-3"><Badge type="info">{s.status}</Badge></td>
                    <td className="p-3 font-sans">
                      <Link to={`/sites/${s.id}`} className="text-orange-600 font-bold hover:underline">View Site</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

