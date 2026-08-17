import React from 'react';
import { ShieldCheck, Database, Code, Cpu } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-slate-700 font-semibold">Solar & Wind Deployment Intelligence Platform v1.0.0</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">Zero-AI Policy Enforced</span>
        </div>

        <div className="flex items-center space-x-6 text-slate-600 font-mono text-[11px]">
          <div className="flex items-center space-x-1.5">
            <Code className="w-3.5 h-3.5 text-orange-500" />
            <span>FastAPI REST</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Database className="w-3.5 h-3.5 text-sky-600" />
            <span>PostgreSQL / PostGIS</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
            <span>Deterministic Math</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

