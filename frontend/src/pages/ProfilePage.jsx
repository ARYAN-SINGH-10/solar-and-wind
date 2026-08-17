import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import ErrorMessage from '../components/common/ErrorMessage';
import {
  User, Mail, ShieldCheck, Building, Phone, Key, Save,
  CheckCircle2, Eye, EyeOff, Calendar, Activity
} from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  // Password change state
  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation do not match.');
      return;
    }

    setPwLoading(true);
    try {
      await apiClient.patch('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPwSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPwForm(false);
    } catch (err) {
      setPwError(err.response?.data?.detail || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  const ROLE_COLORS = {
    ADMINISTRATOR: 'error',
    ENERGY_PLANNER: 'success',
    GIS_ANALYST: 'info',
    PROJECT_MANAGER: 'warning',
  };

  const ROLE_DESCRIPTIONS = {
    ADMINISTRATOR: 'Full system access — user management, role assignment, and platform configuration.',
    ENERGY_PLANNER: 'Can run solar/wind calculations, create projects, manage sites, and generate reports.',
    GIS_ANALYST: 'Focused on geographic data layers, terrain analysis, and map visualization.',
    PROJECT_MANAGER: 'Can monitor projects, view feasibility reports, and track site progress.',
  };

  const roleKey = user?.role_name?.toUpperCase().replace(' ', '_');

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Profile Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-black text-2xl flex-shrink-0 shadow-inner">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{user?.name || 'Authenticated User'}</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.email}</p>
          <p className="text-xs text-slate-500 mt-1">{user?.organization || 'Organization not specified'}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge type={ROLE_COLORS[roleKey] || 'info'} className="font-bold text-sm px-3 py-1.5">
            {user?.role_name || 'GUEST'}
          </Badge>
          <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-mono font-bold">
            <Activity className="w-3 h-3" />
            Account Active
          </span>
        </div>
      </div>

      {/* Account Details */}
      <Card title="Account Information" subtitle="Profile metadata and system role assignment">
        <div className="space-y-0 divide-y divide-slate-100">
          {[
            { icon: User, label: 'Full Name', value: user?.name, color: 'text-slate-800' },
            { icon: Mail, label: 'Email Address', value: user?.email, color: 'text-slate-800' },
            { icon: Phone, label: 'Phone Number', value: user?.phone || 'Not specified', color: user?.phone ? 'text-slate-800' : 'text-slate-400' },
            { icon: Building, label: 'Organization', value: user?.organization || 'Not specified', color: user?.organization ? 'text-slate-800' : 'text-slate-400' },
            { icon: ShieldCheck, label: 'System Role', value: user?.role_name, color: ROLE_COLORS[roleKey] === 'error' ? 'text-red-600' : 'text-orange-600' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex items-center justify-between py-3.5">
              <span className="text-slate-500 text-xs flex items-center gap-2">
                <Icon className="w-4 h-4 text-slate-400" />
                {label}
              </span>
              <span className={`text-xs font-semibold font-mono ${color}`}>{value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Role Description */}
      <Card title="Role Permissions" subtitle="What your current role allows you to do">
        <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-200 text-xs text-slate-700 leading-relaxed font-medium">
          {ROLE_DESCRIPTIONS[roleKey] || 'Contact your administrator for role information.'}
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          {roleKey === 'ENERGY_PLANNER' && [
            'Create & manage projects',
            'Add & configure sites',
            'Run solar calculations',
            'Run wind calculations',
            'Calculate site scores',
            'Generate forecasts',
            'Generate reports',
            'Compare sites',
          ].map(perm => (
            <div key={perm} className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
              {perm}
            </div>
          ))}
          {roleKey === 'GIS_ANALYST' && [
            'View all projects',
            'Add/update GIS layers',
            'Analyze terrain & slope',
            'View infrastructure data',
            'Compare sites',
            'Generate GIS reports',
          ].map(perm => (
            <div key={perm} className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
              {perm}
            </div>
          ))}
          {roleKey === 'PROJECT_MANAGER' && [
            'Manage project lifecycle',
            'View feasibility reports',
            'View energy forecasts',
            'View site scores',
            'Monitor project progress',
          ].map(perm => (
            <div key={perm} className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
              {perm}
            </div>
          ))}
          {roleKey === 'ADMINISTRATOR' && [
            'Full system access',
            'Manage all users',
            'Assign roles',
            'Configure data sources',
            'View audit logs',
            'Send notifications',
            'Delete reports',
          ].map(perm => (
            <div key={perm} className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
              {perm}
            </div>
          ))}
        </div>
      </Card>

      {/* Change Password */}
      <Card title="Security Settings" subtitle="Change your login credentials">
        {pwSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {pwSuccess}
          </div>
        )}

        {!showPwForm ? (
          <button
            onClick={() => setShowPwForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 transition-all"
          >
            <Key className="w-4 h-4 text-orange-500" />
            Change Password
          </button>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <ErrorMessage message={pwError} />

            {[
              { label: 'Current Password', value: currentPassword, setter: setCurrentPassword, show: showCurrent, toggleShow: () => setShowCurrent(!showCurrent) },
              { label: 'New Password (min. 8 chars)', value: newPassword, setter: setNewPassword, show: showNew, toggleShow: () => setShowNew(!showNew) },
              { label: 'Confirm New Password', value: confirmPassword, setter: setConfirmPassword, show: showNew, toggleShow: () => setShowNew(!showNew) },
            ].map(({ label, value, setter, show, toggleShow }) => (
              <div key={label}>
                <label className="text-xs text-slate-600 font-medium block mb-1">{label}</label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={e => setter(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 pr-10 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                  <button
                    type="button"
                    onClick={toggleShow}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={pwLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {pwLoading ? 'Changing...' : 'Change Password'}
              </button>
              <button
                type="button"
                onClick={() => { setShowPwForm(false); setPwError(''); }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
