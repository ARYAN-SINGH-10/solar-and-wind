import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sun, Wind, Lock, Mail, ShieldCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('planner@solarwind.local');
  const [password, setPassword] = useState('adminpassword');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      navigate(res.targetRoute);
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 p-2 shadow-xs">
            <Sun className="w-7 h-7 text-orange-500" />
            <Wind className="w-5 h-5 text-sky-500 -ml-2" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Platform Authentication
          </h2>
          <p className="text-xs text-slate-500">
            Sign in to access role-restricted GIS deployment tools
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center space-x-2 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleLogin}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address <span className="text-orange-600">*</span></label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="user@solarwind.local"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password <span className="text-orange-600">*</span></label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-sm text-xs transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating & Verifying JWT...' : 'Authenticate & Access Dashboard'}
          </button>
        </form>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-slate-600">
          <p className="font-semibold text-slate-800">Quick Test Credentials:</p>
          <div className="flex justify-between text-[11px] font-mono">
            <span>Admin: admin@solarwind.local</span>
            <span className="text-slate-500">pass: adminpassword</span>
          </div>
          <div className="flex justify-between text-[11px] font-mono">
            <span>Planner: planner@solarwind.local</span>
            <span className="text-slate-500">pass: adminpassword</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 text-center space-y-2">
          <p className="text-xs text-slate-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-orange-600 font-bold hover:underline">
              Create an Account
            </Link>
          </p>
          <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>JWT Bearer Authorization & Backend Protection</span>
          </div>
        </div>
      </div>
    </div>
  );

}
