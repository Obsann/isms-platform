'use client';

import React, { useState } from 'react';
import { AlertTriangle, Plus, Trash2, Shield } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { RiskItem } from '@/types/isms';
import StatusBadge from '@/components/badges/StatusBadge';
import DataTable, { Column } from '@/components/tables/DataTable';
import FormFieldGroup from '@/components/forms/FormFieldGroup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function RiskRegistryView() {
  const { risks, addRisk, deleteRisk, showToast, setAddRiskModalOpen } = useApp();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState<Partial<RiskItem>>({ category: 'Infrastructure', impact: 'Medium', likelihood: 'Medium', status: 'Open' });

  const impactColor = (impact: string) => ({ 'Low': 'text-emerald-600 bg-emerald-50', 'Medium': 'text-amber-600 bg-amber-50', 'High': 'text-orange-600 bg-orange-50', 'Critical': 'text-rose-600 bg-rose-50' }[impact] ?? 'text-slate-600 bg-slate-50');
  const scoreColor = (score: number) => score >= 80 ? 'bg-rose-500' : score >= 60 ? 'bg-amber-500' : 'bg-emerald-500';

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim() || !form.owner?.trim()) { showToast('Validation Error', 'Title and owner are required.', 'error'); return; }
    const score = ({ Critical: 95, High: 80, Medium: 55, Low: 25 }[form.impact ?? 'Medium'] ?? 55);
    const newRisk: RiskItem = { id: `RSK-${Math.floor(100 + Math.random() * 900)}`, title: form.title!, category: form.category as RiskItem['category'], impact: form.impact as RiskItem['impact'], likelihood: form.likelihood as RiskItem['likelihood'], status: form.status as RiskItem['status'], owner: form.owner!, score };
    addRisk(newRisk);
    showToast('Risk Registered', `Risk "${newRisk.title}" added to registry.`, 'success');
    setIsAddOpen(false);
    setForm({ category: 'Infrastructure', impact: 'Medium', likelihood: 'Medium', status: 'Open' });
  };

  const statusMap: Record<string, string> = { 'Open': 'open', 'In Review': 'in_review', 'Mitigated': 'mitigated', 'Accepted': 'accepted' };

  const columns: Column<RiskItem>[] = [
    { key: 'id', header: 'Risk ID', render: (r) => <span className="font-mono text-xs font-bold text-amber-700">{r.id}</span> },
    { key: 'title', header: 'Risk Title', render: (r) => <span className="font-semibold text-slate-900 text-sm">{r.title}</span> },
    { key: 'category', header: 'Category', render: (r) => <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{r.category}</span> },
    { key: 'impact', header: 'Impact', sortable: true, render: (r) => <span className={`text-xs font-bold px-2 py-0.5 rounded ${impactColor(r.impact)}`}>{r.impact}</span> },
    { key: 'likelihood', header: 'Likelihood', sortable: true, render: (r) => <span className="text-xs font-medium text-slate-600">{r.likelihood}</span> },
    { key: 'score', header: 'Score', sortable: true, align: 'center', render: (r) => (
      <div className="flex items-center gap-2">
        <div className="w-16 bg-slate-200 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${scoreColor(r.score)}`} style={{ width: `${r.score}%` }} /></div>
        <span className="font-mono text-xs font-bold text-slate-700">{r.score}</span>
      </div>
    )},
    { key: 'status', header: 'Status', sortable: true, render: (r) => <StatusBadge status={statusMap[r.status] ?? r.status.toLowerCase()} size="sm" label={r.status} /> },
    { key: 'owner', header: 'Owner', render: (r) => <span className="text-xs text-slate-600">{r.owner}</span> },
    { key: 'actions', header: 'Actions', align: 'center', render: (r) => (
      <button onClick={() => { if (window.confirm(`Resolve risk: ${r.title}?`)) { deleteRisk(r.id); showToast('Risk Resolved', `Risk ${r.id} removed.`, 'info'); } }} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
    )},
  ];

  const highCritical = risks.filter((r) => r.impact === 'High' || r.impact === 'Critical');
  const open = risks.filter((r) => r.status === 'Open');
  const avgScore = risks.length ? Math.round(risks.reduce((a, r) => a + r.score, 0) / risks.length) : 0;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Risk Management</span>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 font-serif">Risk Registry</h1>
          <p className="text-sm text-slate-500 mt-0.5">ISMS risk catalog with severity, likelihood, and mitigation tracking.</p>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-amber-400 text-sm font-bold hover:bg-slate-800 transition-colors shadow-md">
          <Plus className="w-4 h-4" /> Add Risk
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-0"><CardContent className="p-4">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">High / Critical Risks</p>
          <p className="text-3xl font-black text-rose-400 mt-1 font-mono">{highCritical.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Open Risks</p>
          <p className="text-3xl font-black text-amber-600 mt-1 font-mono">{open.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Average Risk Score</p>
          <p className="text-3xl font-black text-slate-900 mt-1 font-mono">{avgScore}</p>
        </CardContent></Card>
      </div>

      {/* Risk Table */}
      <DataTable data={risks} columns={columns} keyExtractor={(r) => r.id} title="Risk Catalog" searchPlaceholder="Search risks..." defaultPageSize={8} />

      {/* Add Risk Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsAddOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-xl text-slate-900">Register New Risk</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <FormFieldGroup label="Risk Title" required>
                <input type="text" value={form.title ?? ''} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Unpatched dependency in auth service" />
              </FormFieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <FormFieldGroup label="Category">
                  <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as RiskItem['category'] }))}>
                    {['Infrastructure','Data Privacy','Access Control','Third-Party','Operational'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormFieldGroup>
                <FormFieldGroup label="Impact">
                  <select value={form.impact} onChange={(e) => setForm((p) => ({ ...p, impact: e.target.value as RiskItem['impact'] }))}>
                    {['Low','Medium','High','Critical'].map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </FormFieldGroup>
                <FormFieldGroup label="Likelihood">
                  <select value={form.likelihood} onChange={(e) => setForm((p) => ({ ...p, likelihood: e.target.value as RiskItem['likelihood'] }))}>
                    {['Low','Medium','High'].map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </FormFieldGroup>
                <FormFieldGroup label="Status">
                  <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as RiskItem['status'] }))}>
                    {['Open','In Review','Mitigated','Accepted'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormFieldGroup>
              </div>
              <FormFieldGroup label="Risk Owner" required>
                <input type="text" value={form.owner ?? ''} onChange={(e) => setForm((p) => ({ ...p, owner: e.target.value }))} placeholder="e.g. DevOps Team" />
              </FormFieldGroup>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-slate-900 text-amber-400 text-sm font-bold hover:bg-slate-800">Register Risk</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
