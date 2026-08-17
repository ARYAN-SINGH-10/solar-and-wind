import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  Activity,
  Map,
  Calculator,
  Shield,
  Sliders,
  Users
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const roleName = user?.role_name || 'GUEST';

  const navItems = [
    { to: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects & Sites', icon: FolderKanban },
    { to: '/health', label: 'System Diagnostics', icon: Activity },
  ];

  // Role Specific Dashboard Links
  const roleDashboards = [
    { to: '/dashboard/planner', label: 'Energy Planner Hub', role: 'ENERGY_PLANNER', icon: Calculator },
    { to: '/dashboard/gis', label: 'GIS Terrain Analysis', role: 'GIS_ANALYST', icon: Map },
    { to: '/dashboard/manager', label: 'Project Governance', role: 'PROJECT_MANAGER', icon: FolderKanban },
    { to: '/dashboard/admin', label: 'Admin RBAC & Audit', role: 'ADMINISTRATOR', icon: Shield },
  ];

  const allowedDashboards = roleDashboards.filter(
    (item) => item.role === roleName || roleName === 'ADMINISTRATOR'
  );

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6 flex-1">
        {/* Primary Navigation */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 px-3">
            Main Navigation
          </h3>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Role-Specific Allowed Dashboards */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 px-3 flex items-center justify-between">
            <span>Role Dashboards</span>
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
          </h3>
          <nav className="space-y-1">
            {allowedDashboards.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Active Role Card */}
        <div className="pt-4 border-t border-slate-800">
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">
            Active Session Security
          </h3>
          <div className="mx-3 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
            <span className="text-[10px] text-slate-500 block">Authenticated Role:</span>
            <span className="font-mono font-bold text-amber-400 block">{roleName}</span>
            <span className="text-[10px] text-emerald-400 block pt-1 font-mono">Backend Verified</span>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        FastAPI JWT + PostGIS RBAC
      </div>
    </aside>
  );
}
