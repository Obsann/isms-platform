'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import StatusBadge from '@/components/badges/StatusBadge';

const tenants = [
  { id: 'T-001', name: 'Addis Ababa Savings & Credit Sacco', code: 'AA-SACCO-001', status: 'active', members: 8, createdAt: '2024-01-15' },
];

export default function TenantsPage() {
  return (
    <div className="space-y-6 pb-8">
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Platform Management</span>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 font-serif">Tenant Registry</h1>
        <p className="text-sm text-slate-500 mt-0.5">All registered Sacco organizations on the ISMS platform.</p>
      </div>
      <div className="space-y-4">
        {tenants.map((tenant) => (
          <Card key={tenant.id}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-amber-700 font-bold">{tenant.id}</span>
                  <StatusBadge status={tenant.status} size="sm" />
                </div>
                <h3 className="font-bold text-slate-900">{tenant.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Code: {tenant.code} · {tenant.members} registered members · Created: {tenant.createdAt}</p>
              </div>
              <button className="px-4 py-2 rounded-xl bg-slate-900 text-amber-400 text-sm font-bold hover:bg-slate-800 transition-colors">
                Manage
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
