import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center space-x-3 text-red-700 text-xs font-mono">
      <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
      <span className="font-medium">{message}</span>
    </div>
  );
}

