'use client';

import { useApp } from '@/contexts/AppContext';
import CurrencyDisplay from '@/components/currency/CurrencyDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import StatusBadge from '@/components/badges/StatusBadge';
import { Globe, Users, ShieldCheck, TrendingUp, AlertTriangle, Database } from 'lucide-react';

export default function SuperAdminDashboardPage() {
  const { vendors, members, risks, complianceFrameworks, auditLogs, assets } = useApp();

  const compliantCount = vendors.filter((v) => v.status === 'Compliant').length;
  const totalSavings = members.reduce((a, m) => a + m.savingsBalance, 0);
  const openRisks = risks.filter((r) => r.status === 'Open').length;
  const avgCompliance = Math.round(complianceFrameworks.reduce((a, f) => a + f.score, 0) / complianceFrameworks.length);
  const recentLogs = auditLogs.slice(0, 5);

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 px-8 py-8 shadow-xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400/60 mb-2">Platform Administrator</p>
          <h1 className="text-3xl font-black text-white">Super Admin Overview</h1>
          <p className="text-slate-400 mt-2 text-sm">Platform-wide security posture, compliance health, and operational metrics across all tenants.</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Registered Tenants</span>
              <Globe className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">1</div>
            <p className="text-xs text-amber-400 mt-1">Active platform instance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Members</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono">{members.length}</div>
            <p className="text-xs text-emerald-600 mt-1">{members.filter((m) => m.verifiedByFayda).length} Fayda verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Platform Compliance</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono">{avgCompliance}%</div>
            <p className="text-xs text-slate-500 mt-1">Avg. across {complianceFrameworks.length} frameworks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Open Risks</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className={`text-3xl font-black font-mono ${openRisks > 2 ? 'text-rose-600' : 'text-emerald-600'}`}>{openRisks}</div>
            <p className="text-xs text-slate-500 mt-1">Requiring immediate action</p>
          </CardContent>
        </Card>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor Summary */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Database className="w-4 h-4" />Vendor Compliance Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-emerald-50 rounded-xl text-center">
                <div className="text-2xl font-black text-emerald-600 font-mono">{compliantCount}</div>
                <div className="text-xs text-emerald-700 font-semibold mt-0.5">Compliant</div>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl text-center">
                <div className="text-2xl font-black text-rose-600 font-mono">{vendors.filter((v) => v.status === 'High Risk').length}</div>
                <div className="text-xs text-rose-700 font-semibold mt-0.5">High Risk</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl text-center">
                <div className="text-2xl font-black text-amber-600 font-mono">{vendors.filter((v) => v.status === 'Non-Compliant').length}</div>
                <div className="text-xs text-amber-700 font-semibold mt-0.5">Non-Compliant</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-center">
                <div className="text-2xl font-black text-blue-600 font-mono">{vendors.filter((v) => v.status === 'Pending').length}</div>
                <div className="text-xs text-blue-700 font-semibold mt-0.5">Pending</div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Overall Compliance Rate</span>
                <span className="font-bold">{Math.round((compliantCount / vendors.length) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(compliantCount / vendors.length) * 100}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader><CardTitle>Recent Audit Events</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${ log.status === 'Success' ? 'bg-emerald-500' : log.status === 'Warning' ? 'bg-amber-500' : 'bg-rose-500' }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{log.action}</p>
                    <p className="text-xs text-slate-500">{log.user} · {log.timestamp}</p>
                  </div>
                  <StatusBadge status={log.status.toLowerCase()} size="sm" label={log.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Asset Overview */}
        <Card>
          <CardHeader><CardTitle>IT Asset Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assets.map((asset) => (
                <div key={asset.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-amber-300 transition-colors">
                  <div className={`px-2 py-0.5 rounded text-xs font-bold ${ asset.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : asset.status === 'Under Maintenance' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600' }`}>{asset.status}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{asset.name}</p>
                    <p className="text-xs text-slate-500">{asset.type} · {asset.classification}</p>
                  </div>
                  {asset.vulnerabilityCount > 0 && <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">{asset.vulnerabilityCount} vuln</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Total Sacco Savings */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-0">
          <CardHeader><CardTitle className="text-white">Platform Financial Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Member Savings</p>
              <CurrencyDisplay value={totalSavings} currency="ETB" size="xl" variant="gold" />
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Share Capital</p>
              <CurrencyDisplay value={members.reduce((a, m) => a + m.shareCapital, 0)} currency="ETB" size="lg" />
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Active Loan Portfolio</p>
              <CurrencyDisplay value={members.reduce((a, m) => a + m.loanBalance, 0)} currency="ETB" size="lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
