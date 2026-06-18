import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function SystemDiagnosticAlert({ message }: { message: string }) {
  return (
    <div className="fixed top-4 right-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-bold shadow-lg z-50">
      <AlertTriangle size={16} />
      <span>System Diagnostic Alert: {message}</span>
    </div>
  );
}
