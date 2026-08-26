'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Search,
  Upload,
  RefreshCw,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import { getMembers, createMember, type CreateMemberPayload } from '@/lib/api-client';
import { StatusBadge } from '@/components/badges/StatusBadge';
import type { Member, PaginatedResult } from '@/types';

interface MemberManagementViewProps {
  portalType: 'tenant-admin' | 'teller';
}

const EMPTY_FORM: CreateMemberPayload = {
  memberNumber: '',
  firstName: '',
  middleName: '',
  lastName: '',
  nationalId: '',
  idType: 'national_id',
  phone: '',
  email: '',
  dateOfBirth: '',
  status: 'active',
};

function buildCreatePayload(form: CreateMemberPayload): CreateMemberPayload {
  const payload: CreateMemberPayload = {
    memberNumber: form.memberNumber.trim(),
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    status: form.status ?? 'active',
  };

  const middleName = form.middleName?.trim();
  if (middleName) payload.middleName = middleName;

  const nationalId = form.nationalId?.trim();
  if (nationalId) {
    payload.nationalId = nationalId;
    payload.idType = form.idType ?? 'national_id';
  }

  const phone = form.phone?.trim();
  if (phone) payload.phone = phone;

  const email = form.email?.trim();
  if (email) payload.email = email;

  const dateOfBirth = form.dateOfBirth?.trim();
  if (dateOfBirth) payload.dateOfBirth = dateOfBirth;

  return payload;
}

export default function MemberManagementView({ portalType }: MemberManagementViewProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Registration Form State
  const [formData, setFormData] = useState<CreateMemberPayload>(EMPTY_FORM);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = (await getMembers({ search: searchTerm })) as
        | PaginatedResult<Member>
        | { data?: Member[]; items?: Member[]; total?: number }
        | Member[];
      const list: Member[] =
        'items' in res && Array.isArray(res.items)
          ? res.items
          : 'data' in res && Array.isArray(res.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
      const count: number =
        'total' in res && typeof res.total === 'number' ? res.total : list.length;
      setMembers(list);
      setTotal(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch members.');
      setMembers([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.memberNumber.trim() || !formData.firstName.trim() || !formData.lastName.trim()) {
      setFormError('Member Number, First Name, and Last Name are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createMember(buildCreatePayload(formData));
      setSuccessMsg(`Member ${created.fullName} (${created.memberNumber}) successfully registered!`);
      setIsRegisterOpen(false);
      setFormData(EMPTY_FORM);
      fetchMembers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Registration failed. Please check fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const importHref = `/${portalType}/members/import`;

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-gold">
              Core Operations
            </span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Member Services
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-serif mt-0.5">
            Member Directory &amp; Registration
          </h1>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
            Register members, search profiles, and bulk-import legacy member records.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={importHref}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-gold/60 transition-all cursor-pointer shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-amber-800 dark:text-gold" />
            <span>Import Legacy CSV</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setIsRegisterOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-midnight text-gold hover:bg-midnight-light dark:bg-gold dark:text-midnight dark:hover:bg-gold-light transition-all cursor-pointer shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Register Member</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs font-medium shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-900 dark:text-rose-200 text-xs font-medium flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-700 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 rounded-xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by member number, name, email, or phone..."
            className="w-full h-9 pl-9 pr-4 bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-gold dark:focus:border-gold focus:ring-1 focus:ring-amber-500/20 transition-all"
          />
        </div>
        <button
          type="button"
          onClick={fetchMembers}
          className="flex items-center justify-center gap-2 px-3.5 h-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-all border border-slate-200 dark:border-slate-700 shrink-0 w-full sm:w-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/30">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-800 dark:text-gold" />
            <span>Members List ({total})</span>
          </h2>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Showing {(members || []).length} records</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-600 dark:text-slate-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-800 dark:text-gold" />
            <p className="text-xs font-medium">Loading members from database...</p>
          </div>
        ) : (members || []).length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No members found</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Try searching with another term or click &quot;+ Register Member&quot; to create one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50/90 dark:bg-slate-950/60 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Member No</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">ID Details</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/60">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-amber-800 dark:text-gold">{m.memberNumber}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{m.fullName}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">{m.phone || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">{m.email || '—'}</td>
                    <td className="px-4 py-3 text-xs">
                      {m.nationalId ? (
                        <span className="bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                          {m.idType ? m.idType.toUpperCase() : 'ID'}: {m.nationalId}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedMember(m)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors inline-flex items-center gap-1.5 text-xs font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-800 dark:text-gold" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Detail Modal */}
      {selectedMember && (
        <div
          className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 dark:text-gold">
                  Member Profile
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-serif">{selectedMember.fullName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold block">Member Number</span>
                <p className="font-mono font-bold text-amber-800 dark:text-gold text-sm mt-0.5">{selectedMember.memberNumber}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold block">Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedMember.status} size="sm" />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold block">National ID</span>
                <p className="font-mono text-slate-900 dark:text-slate-200 mt-0.5 font-medium">{selectedMember.nationalId || 'Not provided'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold block">ID Type</span>
                <p className="text-slate-900 dark:text-slate-200 mt-0.5 font-medium">{selectedMember.idType || 'Not specified'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold block">Phone</span>
                <p className="text-slate-900 dark:text-slate-200 mt-0.5 font-medium">{selectedMember.phone || 'Not provided'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold block">Email</span>
                <p className="text-slate-900 dark:text-slate-200 mt-0.5 font-medium break-all">{selectedMember.email || 'Not provided'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold block">Date of Birth</span>
                <p className="text-slate-900 dark:text-slate-200 mt-0.5 font-medium">{selectedMember.dateOfBirth || 'Not provided'}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {isRegisterOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsRegisterOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 dark:text-gold">
                  Task 10 — Register New Member
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-serif mt-0.5">Member Registration Form</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-900 dark:text-rose-200 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              {/* Personal Info */}
              <div className="space-y-3">
                <h4 className="font-bold text-amber-800 dark:text-gold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800 pb-1">
                  1. Personal Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                      placeholder="e.g. Abebe"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-gold dark:focus:border-gold focus:ring-1 focus:ring-amber-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Middle Name</label>
                    <input
                      type="text"
                      value={formData.middleName}
                      onChange={(e) => setFormData((p) => ({ ...p, middleName: e.target.value }))}
                      placeholder="e.g. Kebede"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-gold dark:focus:border-gold focus:ring-1 focus:ring-amber-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                      placeholder="e.g. Tadesse"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-gold dark:focus:border-gold focus:ring-1 focus:ring-amber-500/20 transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth ?? ''}
                      onChange={(e) => setFormData((p) => ({ ...p, dateOfBirth: e.target.value }))}
                      className="w-full h-9 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-gold dark:focus:border-gold focus:ring-1 focus:ring-amber-500/20 transition-all"
                    />
                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">Optional. Stored as YYYY-MM-DD.</p>
                  </div>
                </div>
              </div>

              {/* Identification */}
              <div className="space-y-3">
                <h4 className="font-bold text-amber-800 dark:text-gold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800 pb-1">
                  2. Identification (Decision D1)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">ID Type</label>
                    <select
                      value={formData.idType}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          idType: e.target.value as CreateMemberPayload['idType'],
                        }))
                      }
                      className="w-full h-9 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-gold dark:focus:border-gold focus:ring-1 focus:ring-amber-500/20 transition-all"
                    >
                      <option value="national_id">National ID (Fayda)</option>
                      <option value="passport">Passport</option>
                      <option value="other">Other ID</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">National ID / Document No</label>
                    <input
                      type="text"
                      value={formData.nationalId}
                      onChange={(e) => setFormData((p) => ({ ...p, nationalId: e.target.value }))}
                      placeholder="FIN-1234-5678-9012"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-gold dark:focus:border-gold focus:ring-1 focus:ring-amber-500/20 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Contact & Membership */}
              <div className="space-y-3">
                <h4 className="font-bold text-amber-800 dark:text-gold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800 pb-1">
                  3. Contact &amp; Membership
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Member Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.memberNumber}
                      onChange={(e) => setFormData((p) => ({ ...p, memberNumber: e.target.value }))}
                      placeholder="MEM-00101"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-gold dark:focus:border-gold focus:ring-1 focus:ring-amber-500/20 transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+251 911 234 567"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-gold dark:focus:border-gold focus:ring-1 focus:ring-amber-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                      placeholder="member@sacco.org.et"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-gold dark:focus:border-gold focus:ring-1 focus:ring-amber-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          status: e.target.value as CreateMemberPayload['status'],
                        }))
                      }
                      className="w-full h-9 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-gold dark:focus:border-gold focus:ring-1 focus:ring-amber-500/20 transition-all"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-midnight text-gold hover:bg-midnight-light dark:bg-gold dark:text-midnight dark:hover:bg-gold-light font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Registering...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
