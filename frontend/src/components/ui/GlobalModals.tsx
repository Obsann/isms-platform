'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Vendor } from '@/types/isms';
import FormFieldGroup from '@/components/forms/FormFieldGroup';

// ─── Toast Component ─────────────────────────────────────────────────────────
export function GlobalToast() {
  const { toast, closeToast } = useApp();
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(closeToast, 4000);
    return () => clearTimeout(t);
  }, [toast, closeToast]);
  if (!toast) return null;
  const icons = { success: '✅', error: '⚠️', info: 'ℹ️', warning: '🔔' };
  return (
    <div className="fixed bottom-5 right-5 z-[100] max-w-sm bg-white border border-slate-200 rounded-xl shadow-elevated p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <span className="mt-0.5 shrink-0">{icons[toast.type ?? 'success']}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
        {toast.description && <p className="text-xs text-slate-500 mt-0.5">{toast.description}</p>}
      </div>
      <button onClick={closeToast} className="text-slate-400 hover:text-slate-600 p-1 transition-colors">✕</button>
    </div>
  );
}

// ─── Vendor Detail Modal ─────────────────────────────────────────────────────
export function VendorDetailModal() {
  const { selectedVendor, setSelectedVendor, updateVendor, deleteVendor, showToast } = useApp();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Vendor | null>(null);
  useEffect(() => { if (selectedVendor) { setForm({ ...selectedVendor }); setEditing(false); } }, [selectedVendor]);
  if (!selectedVendor || !form) return null;
  const handleSave = () => { updateVendor(form); showToast('Vendor Updated', `${form.name} saved.`, 'success'); setSelectedVendor(null); };
  const handleDelete = () => { if (window.confirm(`Delete vendor ${selectedVendor.name}?`)) { deleteVendor(selectedVendor.id); showToast('Vendor Deleted', `${selectedVendor.name} removed.`, 'info'); setSelectedVendor(null); } };
  const scoreColor = (s?: number) => !s ? 'text-slate-400' : s >= 85 ? 'text-emerald-600' : s >= 65 ? 'text-amber-600' : 'text-rose-600';
  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedVendor(null)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <h3 className="font-bold text-lg text-slate-900">{selectedVendor.name}</h3>
          <button onClick={() => setSelectedVendor(null)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {editing ? (
            <div className="space-y-3">
              <FormFieldGroup label="Vendor Name"><input type="text" value={form.name} onChange={(e) => setForm((p) => p ? { ...p, name: e.target.value } : p)} /></FormFieldGroup>
              <FormFieldGroup label="Status"><select value={form.status} onChange={(e) => setForm((p) => p ? { ...p, status: e.target.value as Vendor['status'] } : p)}>{['Compliant','Non-Compliant','Pending','High Risk'].map((s) => <option key={s} value={s}>{s}</option>)}</select></FormFieldGroup>
              <FormFieldGroup label="Risk Level"><select value={form.riskLevel} onChange={(e) => setForm((p) => p ? { ...p, riskLevel: e.target.value as Vendor['riskLevel'] } : p)}>{['Low','Medium','High','Unknown'].map((r) => <option key={r} value={r}>{r}</option>)}</select></FormFieldGroup>
              <FormFieldGroup label="Audit Score (0-100)"><input type="number" min="0" max="100" value={form.auditScore ?? 0} onChange={(e) => setForm((p) => p ? { ...p, auditScore: Number(e.target.value) } : p)} /></FormFieldGroup>
              <FormFieldGroup label="Notes"><textarea value={form.notes ?? ''} onChange={(e) => setForm((p) => p ? { ...p, notes: e.target.value } : p)} rows={3} /></FormFieldGroup>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Status</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedVendor.status}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Risk Level</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedVendor.riskLevel}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Audit Score</p>
                <p className={`font-black text-2xl font-mono mt-0.5 ${scoreColor(selectedVendor.auditScore)}`}>{selectedVendor.auditScore ?? 'N/A'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Date Added</p>
                <p className="font-mono text-sm font-semibold text-slate-800 mt-0.5">{selectedVendor.dateAdded}</p>
              </div>
              {selectedVendor.notes && (
                <div className="col-span-2 p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Notes</p>
                  <p className="text-sm text-slate-700 mt-0.5">{selectedVendor.notes}</p>
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50">Cancel</button>
                <button onClick={handleSave} className="flex-1 py-2 rounded-xl bg-slate-900 text-amber-400 text-sm font-bold hover:bg-slate-800">Save Changes</button>
              </>
            ) : (
              <>
                <button onClick={handleDelete} className="flex-1 py-2 rounded-xl border border-rose-200 text-rose-600 text-sm font-semibold hover:bg-rose-50">Delete</button>
                <button onClick={() => setEditing(true)} className="flex-1 py-2 rounded-xl bg-slate-900 text-amber-400 text-sm font-bold hover:bg-slate-800">Edit Vendor</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Quick Scan Modal ────────────────────────────────────────────────────────
export function QuickScanModal() {
  const { quickScanType, setQuickScanType, showToast, addAuditLog } = useApp();
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!quickScanType) { setProgress(0); setDone(false); return; }
    setProgress(0); setDone(false);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(interval); setDone(true); return 100; }
        return p + Math.floor(Math.random() * 15) + 5;
      });
    }, 300);
    return () => clearInterval(interval);
  }, [quickScanType]);
  useEffect(() => {
    if (done && quickScanType) {
      const title = quickScanType === 'primary' ? 'Primary Scan Complete' : 'Secondary Scan Complete';
      const desc = quickScanType === 'primary' ? 'All core infrastructure checks passed.' : 'Vendor policy assessment complete.';
      showToast(title, desc, 'success');
      addAuditLog(title, 'Compliance', desc);
    }
  }, [done, quickScanType]);
  if (!quickScanType) return null;
  const items = quickScanType === 'primary'
    ? ['Checking MFA enforcement', 'Scanning API endpoints', 'Verifying SSL certificates', 'Reviewing firewall rules', 'Checking access controls']
    : ['Reviewing vendor contracts', 'Checking SLA compliance', 'Auditing API integrations', 'Verifying data handling', 'Reviewing risk scores'];
  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center text-2xl mx-auto mb-3">
            {done ? '✅' : '🔍'}
          </div>
          <h3 className="font-bold text-xl text-slate-900">{quickScanType === 'primary' ? 'Primary Security Scan' : 'Secondary Policy Scan'}</h3>
          <p className="text-sm text-slate-500 mt-1">{done ? 'Scan complete. No critical issues found.' : 'Running automated security assessment...'}</p>
        </div>
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Scan Progress</span>
            <span className="font-mono font-bold">{Math.min(progress, 100)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div className="bg-amber-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        </div>
        <div className="space-y-2 mb-6">
          {items.map((item, i) => {
            const itemProgress = Math.min(progress, 100);
            const itemDone = itemProgress >= ((i + 1) / items.length) * 100;
            const itemActive = !itemDone && itemProgress >= (i / items.length) * 100;
            return (
              <div key={item} className={cn('flex items-center gap-3 p-2.5 rounded-lg text-sm transition-colors', itemDone ? 'bg-emerald-50 text-emerald-800' : itemActive ? 'bg-amber-50 text-amber-800' : 'text-slate-400')}>
                <span className="w-4 h-4 shrink-0">{itemDone ? '✓' : itemActive ? '⟳' : '○'}</span>
                <span>{item}</span>
              </div>
            );
          })}
        </div>
        {done && (
          <button onClick={() => setQuickScanType(null)} className="w-full py-2.5 bg-slate-900 text-amber-400 text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors">Close Scan Report</button>
        )}
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

// ─── Search Modal ─────────────────────────────────────────────────────────────
export function SearchModal() {
  const { searchModalOpen, setSearchModalOpen, vendors, risks, assets, auditLogs, setSelectedVendor } = useApp();
  const [query, setQuery] = useState('');
  useEffect(() => { if (!searchModalOpen) setQuery(''); }, [searchModalOpen]);
  if (!searchModalOpen) return null;
  const q = query.toLowerCase().trim();
  const vendorResults = q ? vendors.filter((v) => v.name.toLowerCase().includes(q) || v.status.toLowerCase().includes(q)) : [];
  const riskResults = q ? risks.filter((r) => r.title.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)) : [];
  const assetResults = q ? assets.filter((a) => a.name.toLowerCase().includes(q) || a.type.toLowerCase().includes(q)) : [];
  const logResults = q ? auditLogs.filter((l) => l.action.toLowerCase().includes(q) || l.user.toLowerCase().includes(q)) : [];
  const total = vendorResults.length + riskResults.length + assetResults.length + logResults.length;
  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4" onClick={() => setSearchModalOpen(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input autoFocus type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search vendors, risks, assets, logs..." className="w-full pl-9 pr-4 h-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!q && <p className="text-center text-sm text-slate-400 py-8">Start typing to search across the platform...</p>}
          {q && total === 0 && <p className="text-center text-sm text-slate-400 py-8">No results for &quot;{query}&quot;</p>}
          {vendorResults.length > 0 && (
            <div><p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Vendors</p>
              {vendorResults.slice(0, 3).map((v) => <button key={v.id} onClick={() => { setSelectedVendor(v); setSearchModalOpen(false); }} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-left transition-colors"><span className="text-sm font-semibold text-slate-800">{v.name}</span><span className="text-xs text-slate-500">{v.status}</span></button>)}
            </div>
          )}
          {riskResults.length > 0 && (
            <div><p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Risks</p>
              {riskResults.slice(0, 3).map((r) => <div key={r.id} className="p-3 rounded-xl hover:bg-slate-50 transition-colors"><p className="text-sm font-semibold text-slate-800">{r.title}</p><p className="text-xs text-slate-500">{r.category} · {r.impact} impact</p></div>)}
            </div>
          )}
          {assetResults.length > 0 && (
            <div><p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Assets</p>
              {assetResults.slice(0, 3).map((a) => <div key={a.id} className="p-3 rounded-xl hover:bg-slate-50 transition-colors"><p className="text-sm font-semibold text-slate-800">{a.name}</p><p className="text-xs text-slate-500">{a.type} · {a.status}</p></div>)}
            </div>
          )}
          {logResults.length > 0 && (
            <div><p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Audit Logs</p>
              {logResults.slice(0, 3).map((l) => <div key={l.id} className="p-3 rounded-xl hover:bg-slate-50 transition-colors"><p className="text-sm font-semibold text-slate-800">{l.action}</p><p className="text-xs text-slate-500">{l.user} · {l.timestamp}</p></div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Help Modal ──────────────────────────────────────────────────────────────
export function HelpModal() {
  const { helpModalOpen, setHelpModalOpen } = useApp();
  if (!helpModalOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setHelpModalOpen(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-xl text-slate-900">ISMS Help & Documentation</h3>
            <p className="text-sm text-slate-500">Quick reference guide for platform features</p>
          </div>
          <button onClick={() => setHelpModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
        </div>
        <div className="space-y-4">
          {[
            { title: '🏠 Dashboard', desc: 'Overview of vendor compliance, financial metrics, and quick security scans. Use the status filter to focus on specific compliance states.' },
            { title: '👥 Members', desc: 'Manage Sacco member registry with Fayda ID verification. Register new members, toggle status, and export data.' },
            { title: '📋 Compliance', desc: 'Track ISO 27001, SOC 2, GDPR, and HIPAA framework scores. Click any framework to view detailed control breakdown.' },
            { title: '⚠️ Risk Registry', desc: 'Log and manage security risks by category, impact, and likelihood. Use the score indicator to prioritize remediation.' },
            { title: '💻 Assets', desc: 'IT asset inventory with classification levels and vulnerability counts. Register new assets and track security posture.' },
            { title: '📜 Audit Logs', desc: 'Immutable security event log. Filter by category and status to investigate specific events.' },
            { title: '🔍 Quick Scan', desc: 'Automated security scan across infrastructure (Primary) or vendor integrations (Secondary). Results logged to Audit Trail.' },
          ].map((item) => (
            <div key={item.title} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-1">{item.title}</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <button onClick={() => setHelpModalOpen(false)} className="mt-5 w-full py-2.5 bg-slate-900 text-amber-400 text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors">Got it!</button>
      </div>
    </div>
  );
}
