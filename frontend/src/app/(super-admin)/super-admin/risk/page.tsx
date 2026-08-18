'use client';

import StatusBadge from '@/components/badges/StatusBadge';

export default function RiskPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <StatusBadge status="active" label="Shell Ready" />
          <span className="text-xs text-slate-400 font-mono font-semibold uppercase tracking-wider">Super Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 font-serif">Risk Registry</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Clean portal shell workspace for platform risk assessment and management.
        </p>
      </div>
    </div>
  );
}
