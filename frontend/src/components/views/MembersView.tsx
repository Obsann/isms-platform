'use client';

import React, { useState } from 'react';
import { Users, UserPlus, ShieldCheck, Download, DollarSign, CreditCard, Building2, BadgeCheck, RefreshCw, Trash2, Eye, Search } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { SaccoMember } from '@/types/isms';
import StatusBadge from '@/components/badges/StatusBadge';
import CurrencyDisplay from '@/components/currency/CurrencyDisplay';
import FormFieldGroup from '@/components/forms/FormFieldGroup';
import DataTable, { Column } from '@/components/tables/DataTable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function MembersView() {
  const { members, addMember, updateMember, deleteMember, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<SaccoMember | null>(null);
  const [formData, setFormData] = useState({
    fullName: '', faydaId: 'FIN-', email: '', phone: '+251 ',
    membershipType: 'Full' as 'Full' | 'Associate' | 'Institutional',
    branch: 'Addis Ababa Central', savingsBalance: 5000, shareCapital: 1000, loanBalance: 0,
    occupation: '', verifiedByFayda: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filteredMembers = members.filter((m) => {
    const matchesSearch = m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || m.faydaId.toLowerCase().includes(searchTerm.toLowerCase()) || m.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = branchFilter === 'All' || m.branch === branchFilter;
    const matchesType = typeFilter === 'All' || m.membershipType === typeFilter;
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter.toLowerCase();
    return matchesSearch && matchesBranch && matchesType && matchesStatus;
  });

  const totalSavings = members.reduce((acc, m) => acc + m.savingsBalance, 0);
  const totalShares = members.reduce((acc, m) => acc + m.shareCapital, 0);
  const totalLoans = members.reduce((acc, m) => acc + m.loanBalance, 0);
  const faydaVerified = members.filter((m) => m.verifiedByFayda).length;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full Name is required.';
    if (!formData.faydaId.trim() || formData.faydaId.length < 8) errors.faydaId = 'Valid Fayda ID is required.';
    if (!formData.email.includes('@')) errors.email = 'Valid email is required.';
    if (!formData.occupation.trim()) errors.occupation = 'Occupation is required.';
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    addMember({ fullName: formData.fullName, faydaId: formData.faydaId, email: formData.email, phone: formData.phone, membershipType: formData.membershipType, branch: formData.branch, savingsBalance: Number(formData.savingsBalance) || 0, shareCapital: Number(formData.shareCapital) || 0, loanBalance: Number(formData.loanBalance) || 0, status: 'active', verifiedByFayda: formData.verifiedByFayda, occupation: formData.occupation });
    setIsAddModalOpen(false);
    showToast('Member Registered', `Successfully registered "${formData.fullName}".`, 'success');
    setFormData({ fullName: '', faydaId: 'FIN-', email: '', phone: '+251 ', membershipType: 'Full', branch: 'Addis Ababa Central', savingsBalance: 5000, shareCapital: 1000, loanBalance: 0, occupation: '', verifiedByFayda: true });
    setFormErrors({});
  };

  const handleToggleStatus = (member: SaccoMember) => {
    const nextStatus: SaccoMember['status'] = member.status === 'active' ? 'suspended' : 'active';
    updateMember({ ...member, status: nextStatus });
    showToast('Status Updated', `Member "${member.fullName}" is now ${nextStatus.toUpperCase()}.`, nextStatus === 'active' ? 'success' : 'info');
  };

  const columns: Column<SaccoMember>[] = [
    { key: 'id', header: 'Member ID', sortable: true, render: (r) => <span className="font-mono text-xs text-amber-700 font-bold">{r.id}</span> },
    { key: 'fullName', header: 'Full Name', sortable: true, render: (r) => (
      <div><div className="font-bold text-slate-900 flex items-center gap-1">{r.fullName}{r.verifiedByFayda && <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />}</div><div className="text-xs text-slate-500">{r.occupation}</div></div>
    )},
    { key: 'faydaId', header: 'Fayda ID', render: (r) => <span className="font-mono text-xs text-slate-600">{r.faydaId}</span> },
    { key: 'branch', header: 'Branch', render: (r) => (
      <div><div className="text-xs font-semibold text-slate-800">{r.branch}</div><span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 mt-0.5">{r.membershipType}</span></div>
    )},
    { key: 'savingsBalance', header: 'Savings', sortable: true, align: 'right', render: (r) => <CurrencyDisplay value={r.savingsBalance} currency="ETB" size="sm" variant="gold" /> },
    { key: 'status', header: 'Status', sortable: true, render: (r) => <StatusBadge status={r.status} size="sm" /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (r) => (
      <div className="flex items-center justify-center gap-1">
        <button onClick={() => setSelectedMember(r)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors" title="View"><Eye className="w-4 h-4" /></button>
        <button onClick={() => handleToggleStatus(r)} className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors" title="Toggle Status"><RefreshCw className="w-4 h-4" /></button>
        <button onClick={() => { if (window.confirm(`Remove ${r.fullName}?`)) { deleteMember(r.id); showToast('Member Removed', `${r.fullName} deleted.`, 'info'); } }} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  const branches = ['All', ...Array.from(new Set(members.map((m) => m.branch)))];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Savings & Credit Sacco</span>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 font-serif">Member Registry Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Verified Sacco membership registry with Fayda National ID authentication.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => showToast('Export Started', 'Exporting member registry to CSV...', 'info')} className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-sm">
            <Download className="w-4 h-4" /><span>Export CSV</span>
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-900 text-amber-400 hover:bg-slate-800 border border-amber-500/40 transition-all cursor-pointer shadow-md">
            <UserPlus className="w-4 h-4" /><span>Register New Member</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-0 text-white">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Total Members</span>
              <div className="w-8 h-8 rounded-lg bg-white/10 text-amber-400 flex items-center justify-center"><Users className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-black tracking-tight text-white font-mono">{members.length.toLocaleString()}</div>
            <p className="text-xs text-amber-400 font-semibold flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" />{faydaVerified} Fayda Verified</p>
          </CardContent>
        </Card>
        <Card><CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">Total Savings</span><div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><DollarSign className="w-4 h-4" /></div></div>
          <CurrencyDisplay value={totalSavings} currency="ETB" size="lg" variant="gold" />
          <p className="text-xs text-slate-500">Across all branch accounts</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">Total Share Capital</span><div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><CreditCard className="w-4 h-4" /></div></div>
          <CurrencyDisplay value={totalShares} currency="ETB" size="lg" />
          <p className="text-xs text-slate-500">Institutional capital base</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">Active Loan Exposure</span><div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><Building2 className="w-4 h-4" /></div></div>
          <CurrencyDisplay value={totalLoans} currency="ETB" size="lg" />
          <p className="text-xs text-emerald-600 font-medium">Performing loans portfolio</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <Card><CardContent className="p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, Fayda ID, email..." className="w-full h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400" />
          </div>
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
            {branches.map((b) => <option key={b} value={b}>{b === 'All' ? 'All Branches' : b}</option>)}
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
            {['All', 'Full', 'Associate', 'Institutional'].map((t) => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
            {['All', 'Active', 'Pending', 'Suspended', 'Flagged'].map((s) => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>
        </div>
      </CardContent></Card>

      {/* Table */}
      <DataTable data={filteredMembers} columns={columns} keyExtractor={(m) => m.id} title={`Member Registry (${filteredMembers.length} of ${members.length})`} description="Complete Sacco member registry with Fayda National ID verification." defaultPageSize={8} />

      {/* Selected Member Detail */}
      {selectedMember && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedMember(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900">{selectedMember.fullName}</h3>
              <button onClick={() => setSelectedMember(null)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-xs text-slate-400 uppercase tracking-wider">Member ID</span><p className="font-mono font-bold text-amber-700">{selectedMember.id}</p></div>
                <div><span className="text-xs text-slate-400 uppercase tracking-wider">Status</span><div className="mt-1"><StatusBadge status={selectedMember.status} size="sm" /></div></div>
                <div><span className="text-xs text-slate-400 uppercase tracking-wider">Fayda ID</span><p className="font-mono text-xs text-slate-700">{selectedMember.faydaId}</p></div>
                <div><span className="text-xs text-slate-400 uppercase tracking-wider">Verified</span><p className={selectedMember.verifiedByFayda ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>{selectedMember.verifiedByFayda ? '✓ Verified' : '✗ Not Verified'}</p></div>
                <div><span className="text-xs text-slate-400 uppercase tracking-wider">Branch</span><p className="font-medium text-slate-800">{selectedMember.branch}</p></div>
                <div><span className="text-xs text-slate-400 uppercase tracking-wider">Type</span><p className="font-medium text-slate-800">{selectedMember.membershipType}</p></div>
                <div><span className="text-xs text-slate-400 uppercase tracking-wider">Savings</span><CurrencyDisplay value={selectedMember.savingsBalance} currency="ETB" size="sm" variant="gold" /></div>
                <div><span className="text-xs text-slate-400 uppercase tracking-wider">Share Capital</span><CurrencyDisplay value={selectedMember.shareCapital} currency="ETB" size="sm" /></div>
              </div>
              <div><span className="text-xs text-slate-400 uppercase tracking-wider">Contact</span><p className="text-slate-700">{selectedMember.email} · {selectedMember.phone}</p></div>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => handleToggleStatus(selectedMember)} className="flex-1 py-2 rounded-lg bg-amber-50 text-amber-800 text-sm font-semibold border border-amber-200 hover:bg-amber-100 transition-colors">
                {selectedMember.status === 'active' ? 'Suspend' : 'Activate'}
              </button>
              <button onClick={() => setSelectedMember(null)} className="flex-1 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsAddModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-xl text-slate-900">Register New Member</h3>
                <p className="text-sm text-slate-500">Complete Fayda ID registration for new Sacco member</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <FormFieldGroup label="Full Name" required error={formErrors.fullName}>
                <input type="text" value={formData.fullName} onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))} placeholder="Full legal name" />
              </FormFieldGroup>
              <FormFieldGroup label="National Fayda ID" required error={formErrors.faydaId}>
                <input type="text" value={formData.faydaId} onChange={(e) => setFormData((p) => ({ ...p, faydaId: e.target.value }))} placeholder="FIN-XXXX-XXXX-XXXX" />
              </FormFieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <FormFieldGroup label="Email" required error={formErrors.email}>
                  <input type="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} placeholder="member@sacco.org.et" />
                </FormFieldGroup>
                <FormFieldGroup label="Phone">
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} placeholder="+251 9XX XXX XXXX" />
                </FormFieldGroup>
              </div>
              <FormFieldGroup label="Occupation" required error={formErrors.occupation}>
                <input type="text" value={formData.occupation} onChange={(e) => setFormData((p) => ({ ...p, occupation: e.target.value }))} placeholder="e.g. Accountant" />
              </FormFieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <FormFieldGroup label="Membership Type">
                  <select value={formData.membershipType} onChange={(e) => setFormData((p) => ({ ...p, membershipType: e.target.value as SaccoMember['membershipType'] }))}>
                    <option value="Full">Full Member</option>
                    <option value="Associate">Associate Member</option>
                    <option value="Institutional">Institutional Member</option>
                  </select>
                </FormFieldGroup>
                <FormFieldGroup label="Branch">
                  <select value={formData.branch} onChange={(e) => setFormData((p) => ({ ...p, branch: e.target.value }))}>
                    {['Addis Ababa Central','Bole Branch','Merkato Branch','Hawassa Branch','Dire Dawa Branch'].map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </FormFieldGroup>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FormFieldGroup label="Initial Savings (ETB)">
                  <input type="number" value={formData.savingsBalance} onChange={(e) => setFormData((p) => ({ ...p, savingsBalance: Number(e.target.value) }))} min="0" />
                </FormFieldGroup>
                <FormFieldGroup label="Share Capital (ETB)">
                  <input type="number" value={formData.shareCapital} onChange={(e) => setFormData((p) => ({ ...p, shareCapital: Number(e.target.value) }))} min="0" />
                </FormFieldGroup>
                <FormFieldGroup label="Loan Balance (ETB)">
                  <input type="number" value={formData.loanBalance} onChange={(e) => setFormData((p) => ({ ...p, loanBalance: Number(e.target.value) }))} min="0" />
                </FormFieldGroup>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.verifiedByFayda} onChange={(e) => setFormData((p) => ({ ...p, verifiedByFayda: e.target.checked }))} className="w-4 h-4 accent-amber-500" />
                <span className="text-sm font-medium text-slate-700">Fayda National ID Verified</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-slate-900 text-amber-400 text-sm font-bold hover:bg-slate-800 transition-colors">Register Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
