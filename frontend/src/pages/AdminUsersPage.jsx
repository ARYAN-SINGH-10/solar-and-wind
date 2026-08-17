import React, { useState, useEffect } from 'react';
import { getUsersApi, updateUserRoleApi, toggleUserStatusApi } from '../services/adminService';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { Users, Shield, CheckCircle2 } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsersApi();
      setUsers(data);
    } catch (err) {
      setError('Failed to fetch platform users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId, roleId) => {
    try {
      const res = await updateUserRoleApi(userId, Number(roleId));
      setMessage(res.message);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update user role');
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      const res = await toggleUserStatusApi(userId, !currentStatus);
      setMessage(res.message);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to toggle account status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-500" />
            <span>Admin User & Role Administration</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage system access, assign user roles (RBAC), and toggle user active/deactivated status.
          </p>
        </div>
        <Badge type="purple">ADMIN ONLY</Badge>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-emerald-800 text-xs font-mono font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      <ErrorMessage message={error} />

      {loading ? (
        <Loading message="Loading platform users list..." />
      ) : (
        <Card title="Registered User Accounts" subtitle="Modify user roles and activate/deactivate accounts">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-orange-50/80 text-orange-950 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">User Name & Email</th>
                  <th className="p-4">Organization</th>
                  <th className="p-4">Active Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="p-4 font-sans">
                      <p className="font-semibold text-slate-800">{u.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                    </td>
                    <td className="p-4 text-slate-600">{u.organization || 'N/A'}</td>
                    <td className="p-4">
                      <select
                        value={u.role_id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-orange-600 font-bold text-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-400"
                      >
                        <option value={1}>ENERGY_PLANNER</option>
                        <option value={2}>GIS_ANALYST</option>
                        <option value={3}>PROJECT_MANAGER</option>
                        <option value={4}>ADMINISTRATOR</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <Badge type={u.is_active ? 'success' : 'danger'}>
                        {u.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                      </Badge>
                    </td>
                    <td className="p-4 text-right font-sans">
                      <button
                        onClick={() => handleStatusToggle(u.id, u.is_active)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          u.is_active
                            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
