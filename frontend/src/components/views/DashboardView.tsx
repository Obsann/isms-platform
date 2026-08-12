'use client';

import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Vendor, SaccoStatusType } from '@/types/isms';
import StatusBadge from '@/components/badges/StatusBadge';
import CurrencyDisplay from '@/components/currency/CurrencyDisplay';
import FormFieldGroup from '@/components/forms/FormFieldGroup';
import DataTable, { Column } from '@/components/tables/DataTable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function DashboardView() {
  const {
    vendors, financialMetrics,
    toggleFinancialMask, addVendor, setSelectedVendor, setQuickScanType, showToast,
  } = useApp();

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<SaccoStatusType | null>(null);
  const [vendorName, setVendorName] = useState('');
  const [auditScore, setAuditScore] = useState('');
  const [notes, setNotes] = useState('');

  const filteredVendors = vendors.filter((v) =>
    selectedStatusFilter ? v.status === selectedStatusFilter : true
  );

  const handleStatusFilterClick = (status: SaccoStatusType) => {
    if (selectedStatusFilter === status) {
      setSelectedStatusFilter(null);
      showToast('Filter Cleared', 'Showing all vendor records.', 'info');
    } else {
      setSelectedStatusFilter(status);
      showToast(`Filtered by ${status}`, `Showing vendors with status "${status}".`, 'info');
    }
  };

  const handleSaveDataEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) { showToast('Validation Error', 'Please enter a vendor name.', 'error'); return; }
    const numericScore = auditScore !== '' ? parseInt(auditScore, 10) : 85;
    let computedStatus: SaccoStatusType = 'Compliant';
    let computedRisk: Vendor['riskLevel'] = 'Low';
    if (numericScore < 60) { computedStatus = 'High Risk'; computedRisk = 'High'; }
    else if (numericScore < 75) { computedStatus = 'Non-Compliant'; computedRisk = 'High'; }
    else if (numericScore < 85) { computedStatus = 'Pending'; computedRisk = 'Medium'; }
    addVendor({ name: vendorName.trim(), status: computedStatus, lastAuditCost: 15000, riskLevel: computedRisk, auditScore: numericScore, notes: notes.trim() || 'Direct data entry submission.' });
    setVendorName(''); setAuditScore(''); setNotes('');
    showToast('Entry Saved', `Vendor "${vendorName}" successfully registered.`, 'success');
  };

  const vendorColumns: Column<Vendor>[] = [
    { key: 'name', header: 'Vendor Name', sortable: true, className: 'font-semibold text-slate-900' },
    {
      key: 'status', header: 'Status', sortable: true,
      render: (v) => <StatusBadge status={v.status} size="sm" />,
    },
    {
      key: 'lastAuditCost', header: 'Last Audit Cost', sortable: true, align: 'right',
      render: (v) => <CurrencyDisplay value={v.lastAuditCost ?? 0} currency="ETB" size="sm" isMasked={v.lastAuditCost === null} />,
    },
    {
      key: 'riskLevel', header: 'Risk Level', sortable: true,
      render: (v) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${v.riskLevel === 'Low' ? 'bg-emerald-500' : v.riskLevel === 'High' ? 'bg-rose-500' : 'bg-amber-400'}`} />
          <span className="text-xs font-medium text-slate-700">{v.riskLevel}</span>
        </div>
      ),
    },
    {
      key: 'auditScore', header: 'Score', sortable: true, align: 'center',
      render: (v) => <span className="font-mono text-sm font-bold text-slate-800">{v.auditScore ?? '-'}</span>,
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Page Title */}
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Tenant Admin</span>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 font-serif">ISMS Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Security posture overview, vendor compliance registry, and financial metrics.</p>
      </div>

      {/* Quick Scan Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-slate-900">
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Quick Action</p>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">Primary Scan</h3>
              <p className="text-xs text-slate-500 mt-1">Trigger rapid ISMS security verification across core infrastructure.</p>
            </div>
            <button onClick={() => setQuickScanType('primary')} className="shrink-0 px-4 py-2 bg-slate-900 text-amber-400 text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors">
              Run Scan
            </button>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Quick Action</p>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">Secondary Scan</h3>
              <p className="text-xs text-slate-500 mt-1">Run deep policy assessment on third-party vendor integrations.</p>
            </div>
            <button onClick={() => setQuickScanType('secondary')} className="shrink-0 px-4 py-2 bg-amber-500 text-slate-900 text-sm font-bold rounded-lg hover:bg-amber-400 transition-colors">
              Run Scan
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter */}
      <Card>
        <CardHeader><CardTitle>ISMS Status Filter</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['Compliant', 'Non-Compliant', 'High Risk', 'Pending'] as SaccoStatusType[]).map((status) => (
              <button key={status} type="button" onClick={() => handleStatusFilterClick(status)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${selectedStatusFilter === status ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <StatusBadge status={status.toLowerCase().replace(/-/g, '_').replace(/ /g, '_')} size="md" label={status} />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Financial Metrics */}
        <div className="lg:col-span-7">
          <Card className="h-full">
            <CardHeader><CardTitle>Financial Metrics &amp; Privacy Vault</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {financialMetrics.map((metric) => (
                <div key={metric.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50/50 hover:border-amber-300 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{metric.label}</p>
                    <CurrencyDisplay
                      value={metric.amount} currency="ETB"
                      isMasked={metric.isMasked}
                      onToggleMask={() => { toggleFinancialMask(metric.id); showToast(metric.isMasked ? 'Data Revealed' : 'Data Masked', `${metric.label} privacy state updated.`, 'info'); }}
                      colorCode={metric.type === 'fine' ? 'negative' : metric.type === 'saving' ? 'positive' : 'neutral'}
                      size="xl"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Vendor Registration Form */}
        <div className="lg:col-span-5">
          <Card className="h-full">
            <CardHeader><CardTitle>Vendor Registration Entry</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSaveDataEntry} className="space-y-4">
                <FormFieldGroup label="Vendor / Partner Name" required tooltip="Enter full official name of the third-party Sacco vendor." helperText="E.g. Core Banking API Services Ltd">
                  <input type="text" required value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="Enter vendor name" />
                </FormFieldGroup>
                <FormFieldGroup label="Initial Audit Score (0-100)" tooltip="Score based on latest ISO 27001 assessment audit.">
                  <input type="number" min="0" max="100" value={auditScore} onChange={(e) => setAuditScore(e.target.value)} placeholder="e.g. 85" />
                </FormFieldGroup>
                <FormFieldGroup label="Assessment Notes">
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add audit assessment notes..." rows={2} />
                </FormFieldGroup>
                <button type="submit" className="w-full py-2.5 bg-slate-900 text-amber-400 text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors">Save Vendor Entry</button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Vendor Table */}
        <div className="lg:col-span-12">
          <DataTable
            data={filteredVendors}
            columns={vendorColumns}
            keyExtractor={(v) => v.id}
            title="Vendor Security Registry"
            description="Central ISMS registry of all third-party vendors, audit costs, and security ratings."
            searchPlaceholder="Search vendors..."
            defaultPageSize={8}
            onRowClick={(vendor) => setSelectedVendor(vendor)}
          />
        </div>
      </div>
    </div>
  );
}
