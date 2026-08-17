import React from 'react';

export default function ScoreGauge({ score = 0, size = 120, label = "Suitability Index" }) {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  let colorClass = "text-red-500";
  if (normalizedScore >= 90) colorClass = "text-emerald-600";
  else if (normalizedScore >= 80) colorClass = "text-orange-500";
  else if (normalizedScore >= 65) colorClass = "text-amber-500";
  else if (normalizedScore >= 50) colorClass = "text-amber-600";

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 fill-none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${colorClass} fill-none transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`text-2xl font-extrabold font-mono tracking-tight ${colorClass}`}>
            {normalizedScore}
          </span>
          <span className="text-[10px] text-slate-400 font-mono font-medium">/ 100</span>
        </div>
      </div>
      {label && <span className="text-xs text-slate-600 font-semibold">{label}</span>}
    </div>
  );
}

