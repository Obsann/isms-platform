'use client';

import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import CurrencyDisplay from '@/components/currency/CurrencyDisplay';
import StatusBadge from '@/components/badges/StatusBadge';
import DataTable, { Column } from '@/components/tables/DataTable';
import { SaccoMember } from '@/types/isms';
import { Users, DollarSign, TrendingUp, Activity } from 'lucide-react';

export default function TellerDashboardPage() {
  const { members, auditLogs, showToast } = useApp();

  const activeMembers = members.filter((m) => m.status === 'active');
  const totalSavings = members.reduce((a, m) => a + m.savingsBalance, 0);
  const todayLogs = auditLogs.slice(0, 3);

  const columns: Column<SaccoMember>[] = [
    { key: 'id', header: 'ID', render: (m) => <span className="font-mono text-xs font-bold text-amber-700">{m.id}</span> },
    { key: 'fullName', header: 'Member Name', render: (m) => <span className="font-semibold text-slate-800">{m.fullName}</span> },
    { key: 'branch', header: 'Branch', render: (m) => <span className="text-sm text-slate-600">{m.branch}</span> },
    { key: 'savingsBalance', header: 'Savings Balance', align: 'right', sortable: true, render: (m) => <CurrencyDisplay value={m.savingsBalance} currency="ETB" size="sm" variant="gold" /> },
    { key: 'status', header: 'Status', sortable: true, render: (m) => <StatusBadge status={m.status} size="sm" /> },
    { key: 'actions', header: 'Action', align: 'center', render: (m) => (
      <button onClick={() => showToast('Transaction Initiated', `Processing transaction for ${m.fullName}`, 'info')} className="px-3 py-1 bg-slate-900 text-amber-400 text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors">Transact</button>
    )},
  ];

  return (
    <div className="space-y-6 pb-8">
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Teller Portal</span>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 font-serif">Teller Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Member transactions, account management, and activity log.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2"><span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Members</span><Users className="w-4 h-4 text-amber-400" /></div>
            <div className="text-3xl font-black text-white font-mono">{activeMembers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2"><span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Savings</span><DollarSign className="w-4 h-4 text-emerald-500" /></div>
            <CurrencyDisplay value={totalSavings} currency="ETB" size="lg" variant="gold" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2"><span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Today&apos;s Transactions</span><TrendingUp className="w-4 h-4 text-blue-500" /></div>
            <div className="text-3xl font-black text-slate-900 font-mono">0</div>
            <p className="text-xs text-slate-500 mt-1">No transactions today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2"><span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Pending Reviews</span><Activity className="w-4 h-4 text-amber-500" /></div>
            <div className="text-3xl font-black text-amber-600 font-mono">{members.filter((m) => m.status === 'pending').length}</div>
            <p className="text-xs text-slate-500 mt-1">Awaiting verification</p>
          </CardContent>
        </Card>
      </div>

      <DataTable data={members} columns={columns} keyExtractor={(m) => m.id} title="Member Account Registry" searchPlaceholder="Search members..." defaultPageSize={8} />

      <Card>
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {todayLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-amber-300 transition-colors">
                <div className={`w-2 h-2 rounded-full shrink-0 ${ log.status === 'Success' ? 'bg-emerald-500' : log.status === 'Warning' ? 'bg-amber-500' : 'bg-rose-500' }`} />
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
    </div>
  );
}
