import React from 'react';

export default function Card({ title, subtitle, action, children, className = '' }) {
  return (
    <div className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-200/80 transition-all space-y-4 ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            {title && <h3 className="font-bold text-slate-900 text-base tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

