import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-6 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center mx-auto">
          <HelpCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 uppercase tracking-widest font-mono">
            HTTP 404 NOT FOUND
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Page Not Found</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            The requested page route or spatial layer resource does not exist or has been moved.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all text-xs shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Platform Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

