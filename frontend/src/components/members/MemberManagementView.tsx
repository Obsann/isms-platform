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
  FileText
} from 'lucide-react';
import { getMembers, createMember, type CreateMemberPayload } from '@/lib/api-client';
import type { Member, PaginatedResult } from '@/types';

interface MemberManagementViewProps {
  portalType: 'tenant-admin' | 'teller';
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
  const [formData, setFormData] = useState<CreateMemberPayload>({
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
  });

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: PaginatedResult<Member> = await getMembers({ search: searchTerm });
      setMembers(res.data);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch members.');
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
      const created = await createMember(formData);
      setSuccessMsg(`Member ${created.fullName} (${created.memberNumber}) successfully registered!`);
      setIsRegisterOpen(false);
      // Reset form
      setFormData({
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
      });
      fetchMembers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Registration failed. Please check fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const importHref = `/${portalType}/members/import`;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            Task 10 & 11 — Member Management
          </span>
          <h1 className="mt-2 text-2xl font-bold text-slate-100">Member Directory & Registration</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Register members, search profiles, and bulk-import legacy member records.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={importHref}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:border-amber-500/40 transition-all cursor-pointer shadow-sm"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Import Legacy CSV</span>
          </Link>
          <button
            onClick={() => {
              setFormError(null);
              setIsRegisterOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all cursor-pointer shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Register Member</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by member number, name, email, or phone..."
            className="w-full h-10 pl-10 pr-4 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all"
          />
        </div>
        <button
          onClick={fetchMembers}
          className="flex items-center gap-2 px-4 h-10 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-card">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Members List ({total})</span>
          </h2>
          <span className="text-xs text-slate-400">Showing {members.length} records</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400" />
            <p className="text-xs">Loading members from database...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-medium text-slate-400">No members found</p>
            <p className="text-xs text-slate-500">
              Try searching with another term or click "+ Register Member" to create one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
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
              <tbody className="divide-y divide-slate-800/60">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-amber-400">{m.memberNumber}</td>
                    <td className="px-4 py-3 font-semibold text-slate-100">{m.fullName}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{m.phone || '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{m.email || '—'}</td>
                    <td className="px-4 py-3 text-xs">
                      {m.nationalId ? (
                        <span className="bg-slate-950 px-2 py-1 rounded text-slate-300 border border-slate-800 font-mono">
                          {m.idType ? m.idType.toUpperCase() : 'ID'}: {m.nationalId}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          m.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : m.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedMember(m)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
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
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Member Profile</span>
                <h3 className="text-xl font-bold text-slate-100">{selectedMember.fullName}</h3>
              </div>
              <button onClick={() => setSelectedMember(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 uppercase tracking-wider text-[10px]">Member Number</span>
                <p className="font-mono font-bold text-amber-400 text-sm mt-0.5">{selectedMember.memberNumber}</p>
              </div>
              <div>
                <span className="text-slate-500 uppercase tracking-wider text-[10px]">Status</span>
                <p className="mt-0.5 font-bold uppercase text-emerald-400">{selectedMember.status}</p>
              </div>
              <div>
                <span className="text-slate-500 uppercase tracking-wider text-[10px]">National ID</span>
                <p className="font-mono text-slate-300 mt-0.5">{selectedMember.nationalId || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-slate-500 uppercase tracking-wider text-[10px]">ID Type</span>
                <p className="text-slate-300 mt-0.5">{selectedMember.idType || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-slate-500 uppercase tracking-wider text-[10px]">Phone</span>
                <p className="text-slate-300 mt-0.5">{selectedMember.phone || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-slate-500 uppercase tracking-wider text-[10px]">Email</span>
                <p className="text-slate-300 mt-0.5">{selectedMember.email || 'Not provided'}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl"
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
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsRegisterOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                  Task 10 — Register New Member
                </span>
                <h3 className="text-xl font-bold text-slate-100 mt-0.5">Member Registration Form</h3>
              </div>
              <button onClick={() => setIsRegisterOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              {/* Personal Info */}
              <div className="space-y-3">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-1">
                  1. Personal Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                      placeholder="e.g. Abebe"
                      className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Middle Name</label>
                    <input
                      type="text"
                      value={formData.middleName}
                      onChange={(e) => setFormData((p) => ({ ...p, middleName: e.target.value }))}
                      placeholder="e.g. Kebede"
                      className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                      placeholder="e.g. Tadesse"
                      className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                </div>
              </div>

              {/* Identification */}
              <div className="space-y-3">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-1">
                  2. Identification (Decision D1)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">ID Type</label>
                    <select
                      value={formData.idType}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          idType: e.target.value as CreateMemberPayload['idType'],
                        }))
                      }
                      className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/60"
                    >
                      <option value="national_id">National ID (Fayda)</option>
                      <option value="passport">Passport</option>
                      <option value="other">Other ID</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">National ID / Document No</label>
                    <input
                      type="text"
                      value={formData.nationalId}
                      onChange={(e) => setFormData((p) => ({ ...p, nationalId: e.target.value }))}
                      placeholder="FIN-1234-5678-9012"
                      className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                </div>
              </div>

              {/* Contact & Membership */}
              <div className="space-y-3">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-1">
                  3. Contact & Membership
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Member Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.memberNumber}
                      onChange={(e) => setFormData((p) => ({ ...p, memberNumber: e.target.value }))}
                      placeholder="MEM-00101"
                      className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/60 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+251 911 234 567"
                      className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                      placeholder="member@sacco.org.et"
                      className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          status: e.target.value as CreateMemberPayload['status'],
                        }))
                      }
                      className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/60"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-300 font-semibold hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
