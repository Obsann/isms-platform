'use client';

import React, { useState } from 'react';
import { Shield, Download, Search } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import StatusBadge from '@/components/badges/StatusBadge';
import DataTable, { Column } from '@/components/tables/DataTable';
import { SaccoAuditLog } from '@/types/isms';
import { Card, CardContent } from '@/components/ui/Card';

export default function AuditLogsView() {
  const { auditLogs, showToast } = useApp();
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = auditLogs.filter((l) => {
    const matchesCat = categoryFilter === 'All' || l.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    return matchesCat && matchesStatus;
  });

  const statusMap: Record<string, string> = { 'Success': 'success', 'Warning': 'warning', 'Failed': 'failed' };

  const columns: Column<SaccoAuditLog>[] = [
    { key: 'id', header: 'Log ID', render: (l) => <span className="font-mono text-xs font-bold text-amber-700">{l.id}</span> },
    { key: 'timestamp', header: 'Timestamp', sortable: true, render: (l) => <span className="font-mono text-xs text-slate-600">{l.timestamp}</span> },
    { key: 'user', header: 'User', render: (l) => <span className="text-xs font-medium text-slate-800">{l.user}</span> },
    { key: 'action', header: 'Action', render: (l) => <span className="text-sm font-medium text-slate-900">{l.action}</span> },
    { key: 'category', header: 'Category', render: (l) => <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{l.category}</span> },
    { key: 'status', header: 'Status', sortable: true, render: (l) => <StatusBadge status={statusMap[l.status] ?? 'success'} size="sm" label={l.status} /> },
    { key: 'ipAddress', header: 'IP Address', render: (l) => <span className="font-mono text-xs text-slate-500">{l.ipAddress}</span> },
  ];

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Audit Trail</span>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 font-serif">Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-0.5">Immutable system event log with complete activity tracking.</p>
        </div>
        <button onClick={() => showToast('Export Started', 'Exporting audit logs to CSV...', 'info')} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">
          <Download className="w-4 h-4" /> Export Logs
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-0"><CardContent className="p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Log Entries</p>
          <p className="text-3xl font-black text-white mt-1 font-mono">{auditLogs.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Warnings</p>
          <p className="text-3xl font-black text-amber-600 mt-1 font-mono">{auditLogs.filter((l) => l.status === 'Warning').length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Failed Events</p>
          <p className="text-3xl font-black text-rose-600 mt-1 font-mono">{auditLogs.filter((l) => l.status === 'Failed').length}</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
          {['All','Authentication','Data Entry','Compliance','Risk Action','Settings'].map((c) => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
          {['All','Success','Warning','Failed'].map((s) => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
        </select>
      </div>

      <DataTable data={filtered} columns={columns} keyExtractor={(l) => l.id} title="Audit Log Entries" searchPlaceholder="Search logs..." defaultPageSize={10} />
    </div>
  );
}
