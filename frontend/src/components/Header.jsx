import React from 'react';
import { Sun, Wind, ShieldCheck, Cpu, UserCheck, LogOut, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header({ systemHealth }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const isHealthy = systemHealth?.status === 'ok';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-emerald-500 to-sky-500 p-0.5 shadow-lg shadow-amber-500/10">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sun className="w-4 h-4 text-amber-400" />
                <Wind className="w-4 h-4 text-sky-400 -ml-1" />
              </div>
            </div>
            <div>
              <span className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                SOLAR & WIND <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">DETERMINISTIC GIS</span>
              </span>
              <p className="text-xs text-slate-400 hidden sm:block">Deployment Intelligence Platform</p>
            </div>
          </Link>

          {/* Quick Health & Zero AI Badge */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-300 font-medium">Zero-AI Policy:</span>
              <span className="text-emerald-400 font-mono">100% Deterministic</span>
            </div>

            <Link
              to="/health"
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isHealthy
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20 animate-pulse'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isHealthy ? 'Health: OK' : 'Check Connections'}</span>
            </Link>

            {/* Authenticated User Profile & Logout */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="hidden lg:block text-left text-xs">
                  <p className="text-slate-200 font-semibold leading-none">{user.name}</p>
                  <p className="text-amber-400 font-mono text-[10px] leading-none mt-1">{user.role_name}</p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/10"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
