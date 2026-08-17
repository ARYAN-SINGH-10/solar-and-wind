import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading({ message = "Loading data from backend..." }) {
  return (
    <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      <span className="text-xs text-slate-500 font-mono font-medium">{message}</span>
    </div>
  );
}

