import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  MapPin,
  Map,
  CloudSun,
  Sun,
  Wind,
  CheckCircle2,
  Calculator,
  TrendingUp,
  Sliders,
  Award,
  FileText,
  GitCompare,
  Bell,
  User,
  Users,
  Database
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role_name || 'GUEST';

  // Navigation Items Specification with Permitted Roles
  const allNavItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ENERGY_PLANNER', 'GIS_ANALYST', 'PROJECT_MANAGER', 'ADMINISTRATOR'] },
    { to: '/projects', label: 'Projects', icon: FolderKanban, roles: ['ENERGY_PLANNER', 'GIS_ANALYST', 'PROJECT_MANAGER', 'ADMINISTRATOR'] },
    { to: '/sites', label: 'Sites', icon: MapPin, roles: ['ENERGY_PLANNER', 'GIS_ANALYST', 'PROJECT_MANAGER', 'ADMINISTRATOR'] },
    { to: '/map', label: 'GIS Map', icon: Map, roles: ['GIS_ANALYST', 'ENERGY_PLANNER', 'PROJECT_MANAGER', 'ADMINISTRATOR'] },
    { to: '/environmental-data', label: 'Environmental Data', icon: CloudSun, roles: ['ENERGY_PLANNER', 'GIS_ANALYST', 'PROJECT_MANAGER', 'ADMINISTRATOR'] },
    { to: '/solar-analysis', label: 'Solar Analysis', icon: Sun, roles: ['ENERGY_PLANNER', 'PROJECT_MANAGER', 'ADMINISTRATOR'] },
    { to: '/wind-analysis', label: 'Wind Analysis', icon: Wind, roles: ['ENERGY_PLANNER', 'PROJECT_MANAGER', 'ADMINISTRATOR'] },
    { to: '/suitability', label: 'Site Suitability', icon: CheckCircle2, roles: ['ENERGY_PLANNER', 'GIS_ANALYST', 'PROJECT_MANAGER', 'ADMINISTRATOR'] },
    { to: '/scoring', label: 'Site Scoring', icon: Calculator, roles: ['ENERGY_PLANNER', 'PROJECT_MANAGER', 'ADMINISTRATOR'] },
    { to: '/forecast', label: 'Energy Forecast', icon: TrendingUp, roles: ['ENERGY_PLANNER', 'PROJECT_MANAGER', 'ADMINISTRATOR'] },
    { to: '/optimization', label: 'Deployment Optimization', icon: Sliders, roles: ['ENERGY_PLANNER', 'PROJECT_MANAGER', 'ADMINISTRATOR'] },
    { to: '/recommendations', label: 'Recommendations', icon: Award, roles: ['ENERGY_PLANNER', 'PROJECT_MANAGER', 'ADMINISTRATOR'] },
    { to: '/reports', label: 'Reports', icon: FileText, roles: ['ENERGY_PLANNER', 'GIS_ANALYST', 'PROJECT_MANAGER', 'ADMINISTRATOR'] },
    { to: '/comparison', label: 'Site Comparison', icon: GitCompare, roles: ['ENERGY_PLANNER', 'GIS_ANALYST', 'PROJECT_MANAGER', 'ADMINISTRATOR'] },
    { to: '/notifications', label: 'Notifications', icon: Bell, roles: ['ENERGY_PLANNER', 'GIS_ANALYST', 'PROJECT_MANAGER', 'ADMINISTRATOR'] },
    { to: '/profile', label: 'Profile', icon: User, roles: ['ENERGY_PLANNER', 'GIS_ANALYST', 'PROJECT_MANAGER', 'ADMINISTRATOR'] },
    // Admin Only Items
    { to: '/admin/users', label: 'Admin Users', icon: Users, roles: ['ADMINISTRATOR'] },
    { to: '/admin/data-sources', label: 'Admin Data Sources', icon: Database, roles: ['ADMINISTRATOR'] },
  ];

  // Filter menu items by active logged-in role
  const visibleNavItems = allNavItems.filter((item) =>
    item.roles.includes(role) || role === 'ADMINISTRATOR'
  );

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 min-h-[calc(100vh-4rem)] shadow-xs">
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-200/60">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Role Perspective</span>
          <span className="text-xs font-mono font-bold text-orange-600 block mt-0.5">{role}</span>
        </div>

        <nav className="space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-orange-50 text-orange-600 font-bold border-l-4 border-orange-500 shadow-xs'
                      : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/60'
                  }`
                }
              >
                <Icon className={({ isActive }) => `w-4 h-4 flex-shrink-0 ${isActive ? 'text-orange-500' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-100 text-[11px] font-mono text-slate-400 text-center">
        FastAPI + PostGIS Platform
      </div>
    </aside>
  );
}

