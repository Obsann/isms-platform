'use client';

import StatusBadge from '@/components/badges/StatusBadge';

export default function MemberDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <StatusBadge status="active" label="Shell Ready" />
          <span className="text-xs text-slate-400 font-mono font-semibold uppercase tracking-wider">Member Portal</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 font-serif">Member Overview</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Clean portal shell workspace for member self-service account and loan management.
        </p>

        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Shared UI Kit Components Active</span>
          <span className="text-amber-600 font-semibold bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Ready for features
          </span>
        </div>
      </div>
    </div>
  );
}
