import React, { useState, useEffect } from 'react';
import {
  fetchAdminUsers,
  updateUserRoleApi,
  toggleUserStatusApi,
  deleteUserAccountApi,
  fetchAuditLogsApi,
  fetchSystemStatsApi,
  fetchAdminDataSourcesApi,
  toggleDataSourceStatusApi,
  fetchAdminSystemHealthApi
} from '../../services/api';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import {
  Users, Shield, Activity, UserCheck, UserX, CheckCircle2, RefreshCw,
  Database, Server, Search, Filter, Trash2, Eye, ShieldAlert, Cpu, Check, X
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ROLES = [
  { id: 1, name: 'Energy Planner', code: 'ENERGY_PLANNER', color: 'text-orange-600' },
  { id: 2, name: 'GIS Analyst', code: 'GIS_ANALYST', color: 'text-sky-600' },
  { id: 3, name: 'Project Manager', code: 'PROJECT_MANAGER', color: 'text-emerald-600' },
  { id: 4, name: 'Administrator', code: 'ADMINISTRATOR', color: 'text-purple-700' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');

  // User management state
  const [users, setUsers] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);

  // Platform stats state
  const [stats, setStats] = useState(null);

  // Data sources state
  const [dataSources, setDataSources] = useState([]);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditActionFilter, setAuditActionFilter] = useState('');

  // System health state
  const [healthInfo, setHealthInfo] = useState(null);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadAllAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [uList, st, ds, logs, hlth] = await Promise.all([
        fetchAdminUsers(searchUser, roleFilter ? Number(roleFilter) : null),
        fetchSystemStatsApi(),
        fetchAdminDataSourcesApi(),
        fetchAuditLogsApi(auditActionFilter),
        fetchAdminSystemHealthApi(),
      ]);
      setUsers(uList);
      setStats(st);
      setDataSources(ds);
      setAuditLogs(logs);
      setHealthInfo(hlth);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch administrator data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, [searchUser, roleFilter, auditActionFilter]);

  const handleRoleChange = async (userId, newRoleId) => {
    try {
      const res = await updateUserRoleApi(userId, Number(newRoleId));
      setMessage(res.message);
      loadAllAdminData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update user role.');
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      const res = await toggleUserStatusApi(userId, !currentStatus);
      setMessage(res.message);
      loadAllAdminData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update user status.');
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Permanently delete account for '${userEmail}'?`)) return;
    try {
      await deleteUserAccountApi(userId);
      setMessage(`Successfully deleted user account '${userEmail}'.`);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete user.');
    }
  };

  const handleToggleDataSource = async (sourceId, currentActive) => {
    try {
      await toggleDataSourceStatusApi(sourceId, !currentActive);
      setDataSources(prev => prev.map(ds => ds.id === sourceId ? { ...ds, is_active: !currentActive, api_status: !currentActive ? 'CONNECTED' : 'INACTIVE' } : ds));
      setMessage(`Updated data source status.`);
    } catch {
      setError('Failed to update data source state.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold font-mono">
            <Shield className="w-3.5 h-3.5" />
            <span>ROLE: SYSTEM ADMINISTRATOR</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1.5 tracking-tight">Platform Executive Administration Console</h1>
          <p className="text-xs text-slate-500 font-medium">
            User RBAC management, data source feeds, audit logging, platform metrics, and system health status. Protected by Admin Authorization.
          </p>
        </div>

        <button
          onClick={loadAllAdminData}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-sm text-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Admin Panel</span>
        </button>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-emerald-700 text-xs font-mono font-bold">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      <ErrorMessage message={error} />

      {/* PLATFORM STATISTICS CARDS */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Total Users', value: stats.total_users, color: 'text-purple-700' },
            { label: 'Total Projects', value: stats.total_projects, color: 'text-orange-600' },
            { label: 'Active Projects', value: stats.active_projects, color: 'text-emerald-600' },
            { label: 'Total Sites', value: stats.total_sites, color: 'text-sky-600' },
            { label: 'Total Reports', value: stats.total_reports, color: 'text-purple-700' },
            { label: 'Successful Requests', value: stats.successful_api_requests, color: 'text-emerald-600' },
            { label: 'Failed Requests', value: stats.failed_api_requests, color: 'text-red-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] text-slate-500 font-medium block truncate">{label}</span>
              <p className={`text-xl font-black font-mono ${color}`}>{value ?? '—'}</p>
            </div>
          ))}
        </div>
      )}

      {/* ADMIN SECTION NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        {[
          { id: 'users', label: `User Management (${users.length})`, icon: Users },
          { id: 'dataSources', label: `Data Sources (${dataSources.length})`, icon: Database },
          { id: 'audit', label: `Audit Trail Logs (${auditLogs.length})`, icon: Shield },
          { id: 'systemHealth', label: `System Health`, icon: Activity },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition-all ${
              activeTab === id
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading message="Fetching administrative data from PostgreSQL backend..." />
      ) : activeTab === 'users' ? (
        /* 1. USER MANAGEMENT TAB */
        <div className="space-y-4">
          <Card title="User Accounts & RBAC Authorization" subtitle="Filter by role, search users, change roles, activate/deactivate, or delete accounts">
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                  placeholder="Search users by name, email, or organization..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="w-full sm:w-56 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">Filter by Role (All Roles)</option>
                {ROLES.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-orange-50/80 text-orange-950 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">User Name & Email</th>
                    <th className="p-3">Organization</th>
                    <th className="p-3">Role Assignment</th>
                    <th className="p-3">Account Status</th>
                    <th className="p-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="p-3 font-sans">
                        <p className="font-bold text-slate-900">{u.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                      </td>
                      <td className="p-3 text-slate-700 font-sans">{u.organization || 'N/A'}</td>
                      <td className="p-3">
                        <select
                          value={u.role_id}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-orange-600 font-bold text-xs focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
                        >
                          {ROLES.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        {u.is_active ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            DEACTIVATED
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-sans space-x-2">
                        <button
                          onClick={() => handleStatusToggle(u.id, u.is_active)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                            u.is_active
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="p-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all"
                          title="Delete User Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : activeTab === 'dataSources' ? (
        /* 2. DATA SOURCES MANAGEMENT TAB */
        <Card title="External Environmental & GIS Data Sources" subtitle="API status, synchronization timestamps, and ingestion configuration">
          <div className="space-y-3 text-xs">
            {dataSources.map(ds => (
              <div key={ds.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{ds.name}</h4>
                    <Badge type={ds.is_active ? 'success' : 'danger'}>{ds.api_status}</Badge>
                  </div>
                  <p className="text-slate-600 font-mono text-[11px]">
                    Type: <span className="text-sky-700 font-bold">{ds.type}</span> | Endpoint: {ds.endpoint}
                  </p>
                  <p className="text-slate-400 font-mono text-[10px]">
                    Last Sync: {new Date(ds.last_sync).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleDataSource(ds.id, ds.is_active)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                    ds.is_active
                      ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {ds.is_active ? 'Disable Data Feed' : 'Enable Data Feed'}
                </button>
              </div>
            ))}
          </div>
        </Card>
      ) : activeTab === 'audit' ? (
        /* 3. AUDIT TRAIL LOGS TAB */
        <Card title="PostgreSQL Live Audit Trail Stream" subtitle="Filter by action type or search administrative events">
          <div className="flex items-center gap-3 mb-3 text-xs">
            <select
              value={auditActionFilter}
              onChange={e => setAuditActionFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="">All Audit Actions</option>
              <option value="LOGIN">LOGIN</option>
              <option value="PROJECT_CREATION">PROJECT_CREATION</option>
              <option value="SITE_CREATION">SITE_CREATION</option>
              <option value="ANALYSIS_EXECUTION">ANALYSIS_EXECUTION</option>
              <option value="REPORT_GENERATED">REPORT_GENERATED</option>
              <option value="ROLE_CHANGE">ROLE_CHANGE</option>
              <option value="USER_ACTIVATION">USER_ACTIVATION</option>
              <option value="USER_DEACTIVATION">USER_DEACTIVATION</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700 font-mono">
              <thead className="bg-orange-50/80 text-orange-950 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action Type</th>
                  <th className="p-3">Entity Target</th>
                  <th className="p-3">User ID</th>
                  <th className="p-3">Client IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="p-3 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-900 font-bold">{log.entity} ({log.entity_id || 'N/A'})</td>
                    <td className="p-3 text-slate-500 text-[11px]">{log.user_id || 'SYSTEM'}</td>
                    <td className="p-3 text-slate-500">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* 4. SYSTEM HEALTH TAB */
        <Card title="System Health & Diagnostic Status" subtitle="Real-time check of database, backend, and external satellite APIs">
          {healthInfo && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">FastAPI REST Server</span>
                  <Badge type="success">{healthInfo.backend_status}</Badge>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">Port 8000 | Active</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">PostgreSQL Database</span>
                  <Badge type="success">{healthInfo.database_status}</Badge>
                </div>
                <p className="text-[11px] text-emerald-700 font-mono font-bold">{healthInfo.postgis_status}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">NASA POWER Satellite API</span>
                  <Badge type="success">ONLINE</Badge>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">GHI & Climate Feed</p>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
