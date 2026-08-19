'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Server } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { AssetItem } from '@/types/isms';
import StatusBadge from '@/components/badges/StatusBadge';
import DataTable, { Column } from '@/components/tables/DataTable';
import FormFieldGroup from '@/components/forms/FormFieldGroup';
import { Card, CardContent } from '@/components/ui/Card';

export default function AssetsView() {
  const { assets, addAsset, deleteAsset, showToast } = useApp();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState<Partial<AssetItem>>({ type: 'Server', classification: 'Internal', status: 'Active', vulnerabilityCount: 0 });

  const classificationColor = (c: string) => ({ 'Confidential': 'text-rose-700 bg-rose-50 border-rose-200', 'Restricted': 'text-amber-700 bg-amber-50 border-amber-200', 'Internal': 'text-blue-700 bg-blue-50 border-blue-200', 'Public': 'text-emerald-700 bg-emerald-50 border-emerald-200' }[c] ?? 'text-slate-700 bg-slate-50 border-slate-200');
  const statusMap: Record<string, string> = { 'Active': 'active', 'Under Maintenance': 'under_maintenance', 'Decommissioned': 'decommissioned' };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.owner?.trim() || !form.location?.trim()) { showToast('Validation Error', 'Name, owner, and location are required.', 'error'); return; }
    const newAsset: AssetItem = { id: `AST-${Math.floor(100 + Math.random() * 900)}`, name: form.name!, type: form.type as AssetItem['type'], classification: form.classification as AssetItem['classification'], owner: form.owner!, status: form.status as AssetItem['status'], lastScanDate: new Date().toISOString().split('T')[0], vulnerabilityCount: Number(form.vulnerabilityCount) || 0, location: form.location! };
    addAsset(newAsset);
    showToast('Asset Registered', `Asset "${newAsset.name}" added to inventory.`, 'success');
    setIsAddOpen(false);
    setForm({ type: 'Server', classification: 'Internal', status: 'Active', vulnerabilityCount: 0 });
  };

  const columns: Column<AssetItem>[] = [
    { key: 'id', header: 'Asset ID', render: (a) => <span className="font-mono text-xs font-bold text-amber-700">{a.id}</span> },
    { key: 'name', header: 'Asset Name', render: (a) => <span className="font-semibold text-slate-900 text-sm">{a.name}</span> },
    { key: 'type', header: 'Type', render: (a) => <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{a.type}</span> },
    { key: 'classification', header: 'Classification', render: (a) => <span className={`text-xs font-bold px-2 py-0.5 rounded border ${classificationColor(a.classification)}`}>{a.classification}</span> },
    { key: 'owner', header: 'Owner', render: (a) => <span className="text-xs text-slate-600">{a.owner}</span> },
    { key: 'status', header: 'Status', sortable: true, render: (a) => <StatusBadge status={statusMap[a.status] ?? 'active'} size="sm" label={a.status} /> },
    { key: 'vulnerabilityCount', header: 'Vulns', sortable: true, align: 'center', render: (a) => (
      <span className={`font-mono text-sm font-bold ${ a.vulnerabilityCount === 0 ? 'text-emerald-600' : a.vulnerabilityCount <= 2 ? 'text-amber-600' : 'text-rose-600' }`}>{a.vulnerabilityCount}</span>
    )},
    { key: 'lastScanDate', header: 'Last Scan', render: (a) => <span className="text-xs text-slate-500">{a.lastScanDate}</span> },
    { key: 'location', header: 'Location', render: (a) => <span className="text-xs text-slate-500">{a.location}</span> },
    { key: 'actions', header: 'Actions', align: 'center', render: (a) => (
      <button onClick={() => { if (window.confirm(`Decommission asset: ${a.name}?`)) { deleteAsset(a.id); showToast('Asset Decommissioned', `Asset ${a.id} removed.`, 'info'); } }} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
    )},
  ];

  const active = assets.filter((a) => a.status === 'Active').length;
  const totalVulns = assets.reduce((acc, a) => acc + a.vulnerabilityCount, 0);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Asset Management</span>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 font-serif">IT Asset Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Classified IT infrastructure assets with vulnerability tracking.</p>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-amber-400 text-sm font-bold hover:bg-slate-800 transition-colors shadow-md">
          <Plus className="w-4 h-4" /> Register Asset
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-0"><CardContent className="p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Assets</p>
          <p className="text-3xl font-black text-white mt-1 font-mono">{assets.length}</p>
          <p className="text-xs text-amber-400 mt-1">{active} Active</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Vulnerabilities</p>
          <p className={`text-3xl font-black mt-1 font-mono ${totalVulns === 0 ? 'text-emerald-600' : totalVulns <= 3 ? 'text-amber-600' : 'text-rose-600'}`}>{totalVulns}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Confidential Assets</p>
          <p className="text-3xl font-black text-slate-900 mt-1 font-mono">{assets.filter((a) => a.classification === 'Confidential').length}</p>
        </CardContent></Card>
      </div>

      <DataTable data={assets} columns={columns} keyExtractor={(a) => a.id} title="Asset Inventory" searchPlaceholder="Search assets..." defaultPageSize={8} />

      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsAddOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-xl text-slate-900">Register New Asset</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <FormFieldGroup label="Asset Name" required><input type="text" value={form.name ?? ''} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Production Kubernetes Cluster" /></FormFieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <FormFieldGroup label="Asset Type"><select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as AssetItem['type'] }))}>{['Server','Database','Cloud Resource','Workstation','API Gateway'].map((t) => <option key={t} value={t}>{t}</option>)}</select></FormFieldGroup>
                <FormFieldGroup label="Classification"><select value={form.classification} onChange={(e) => setForm((p) => ({ ...p, classification: e.target.value as AssetItem['classification'] }))}>{['Confidential','Restricted','Internal','Public'].map((c) => <option key={c} value={c}>{c}</option>)}</select></FormFieldGroup>
                <FormFieldGroup label="Status"><select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as AssetItem['status'] }))}>{['Active','Under Maintenance','Decommissioned'].map((s) => <option key={s} value={s}>{s}</option>)}</select></FormFieldGroup>
                <FormFieldGroup label="Vulnerability Count"><input type="number" value={form.vulnerabilityCount} onChange={(e) => setForm((p) => ({ ...p, vulnerabilityCount: Number(e.target.value) }))} min="0" /></FormFieldGroup>
              </div>
              <FormFieldGroup label="Owner" required><input type="text" value={form.owner ?? ''} onChange={(e) => setForm((p) => ({ ...p, owner: e.target.value }))} placeholder="e.g. Cloud Infrastructure Team" /></FormFieldGroup>
              <FormFieldGroup label="Location" required><input type="text" value={form.location ?? ''} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="e.g. us-east-1 (N. Virginia)" /></FormFieldGroup>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-slate-900 text-amber-400 text-sm font-bold hover:bg-slate-800">Register Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
