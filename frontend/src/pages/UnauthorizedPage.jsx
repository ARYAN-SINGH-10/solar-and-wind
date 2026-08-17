import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function UnauthorizedPage() {
  const { user, getDashboardRoute } = useAuth();
  const dashboardLink = user ? getDashboardRoute(user.role_name) : '/login';

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-6 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 uppercase tracking-widest font-mono">
            HTTP 403 Forbidden
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Access Restricted</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your active role <span className="text-orange-600 font-mono font-bold">"{user?.role_name || 'GUEST'}"</span> does not have authorization to view this page or perform this operation.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-700 font-medium">
            <span>Enforcement Mode:</span>
            <span className="text-emerald-700 font-mono font-bold">Backend Verified</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Authorization permissions are validated on both React client router and FastAPI REST endpoints.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to={dashboardLink}
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all text-xs shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Allowed Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

