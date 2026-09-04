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
  Pencil,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Receipt,
  UserX,
  UserCheck,
} from 'lucide-react';
import {
  ApiRequestError,
  getMembers,
  createMember,
  updateMember,
  deleteMember,
  type CreateMemberPayload,
  type UpdateMemberPayload,
} from '@/lib/api-client';
import { StatusBadge } from '@/components/badges/StatusBadge';
import { TablePagination } from '@/components/ui/TablePagination';
import { useAuthUser } from '@/components/auth/useAuthUser';
import type { Member, PaginatedResult } from '@/types';
import MemberFormModal from './MemberFormModal';
import { MEMBER_EMAIL_PATTERN, PHONE_PATTERN } from '@/lib/member-field-rules';

interface MemberManagementViewProps {
  portalType: 'tenant-admin' | 'teller';
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiRequestError) {
    if (err.messages.length > 0) return err.messages.join('. ');
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Request failed. Please try again.';
}

function buildUpdatePayload(payload: CreateMemberPayload, original: Member): UpdateMemberPayload {
  const next: UpdateMemberPayload = {};
  if (payload.firstName !== original.firstName) next.firstName = payload.firstName;
  if ((payload.middleName ?? '') !== (original.middleName ?? '')) next.middleName = payload.middleName;
  if (payload.lastName !== original.lastName) next.lastName = payload.lastName;
  if ((payload.nationalId ?? '') !== (original.nationalId ?? '')) {
    next.nationalId = payload.nationalId;
    next.idType = payload.idType;
  }
  if (payload.phone && payload.phone !== original.phone && PHONE_PATTERN.test(payload.phone)) {
    next.phone = payload.phone;
  }
  if (payload.email && payload.email !== original.email && MEMBER_EMAIL_PATTERN.test(payload.email)) {
    next.email = payload.email;
  }
  if ((payload.dateOfBirth ?? '') !== (original.dateOfBirth ?? '')) next.dateOfBirth = payload.dateOfBirth;
  if (payload.status && payload.status !== original.status) next.status = payload.status;
  return next;
}

export default function MemberManagementView({ portalType }: MemberManagementViewProps) {
  const user = useAuthUser();
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pendingActionMember, setPendingActionMember] = useState<Member | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = (await getMembers({
        search: searchTerm,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })) as
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
      const count: number = 'total' in res && typeof res.total === 'number' ? res.total : list.length;
      setMembers(list);
      setTotal(count);
    } catch (err) {
      setError(errorMessage(err));
      setMembers([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const closeForm = () => {
    setFormMode(null);
    setEditingMember(null);
    setFormError(null);
  };

  const handleFormSubmit = async (payload: CreateMemberPayload, original?: Member | null) => {
    setFormError(null);
    setIsSubmitting(true);
    try {
      if (formMode === 'edit' && original) {
        const changes = buildUpdatePayload(payload, original);
        if (Object.keys(changes).length === 0) {
          setSuccessMsg('No changes to save.');
          closeForm();
          return;
        }
        const updated = await updateMember(original.id, changes);
        setSuccessMsg(`Member ${updated.fullName} (${updated.memberNumber}) updated.`);
      } else {
        const created = await createMember(payload);
        setSuccessMsg(
          created.email
            ? `Member ${created.fullName} (${created.memberNumber}) registered. A login email with a temporary password was sent to ${created.email}.`
            : `Member ${created.fullName} (${created.memberNumber}) successfully registered.`,
        );
      }
      closeForm();
      fetchMembers();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingActionMember) return;
    setIsActionLoading(true);
    setActionError(null);
    setError(null);
    try {
      await deleteMember(pendingActionMember.id);
      setSuccessMsg(`Member ${pendingActionMember.fullName} (${pendingActionMember.memberNumber}) deleted.`);
      setMembers((prev) => prev.filter((m) => m.id !== pendingActionMember.id));
      setTotal((count) => Math.max(0, count - 1));
      setPendingActionMember(null);
      setSelectedMember(null);
      fetchMembers();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSetMemberStatus = async (status: 'active' | 'inactive') => {
    if (!pendingActionMember) return;
    setIsActionLoading(true);
    setActionError(null);
    setError(null);
    try {
      const updated = await updateMember(pendingActionMember.id, { status });
      const label = status === 'active' ? 'active' : 'inactive';
      setSuccessMsg(`Member ${updated.fullName} (${updated.memberNumber}) is now ${label}.`);
      setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setPendingActionMember(null);
      if (selectedMember?.id === updated.id) {
        setSelectedMember(updated);
      }
      fetchMembers();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setIsActionLoading(false);
    }
  };

  const openMemberActionDialog = (member: Member) => {
    setActionError(null);
    setPendingActionMember(member);
  };

  const closeMemberActionDialog = () => {
    setPendingActionMember(null);
    setActionError(null);
  };

  const quickSetStatus = async (member: Member, status: 'active' | 'inactive') => {
    setActionError(null);
    setError(null);
    setIsActionLoading(true);
    try {
      const updated = await updateMember(member.id, { status });
      const label = status === 'active' ? 'active' : 'inactive';
      setSuccessMsg(`Member ${updated.fullName} (${updated.memberNumber}) is now ${label}.`);
      setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      if (selectedMember?.id === updated.id) {
        setSelectedMember(updated);
      }
      fetchMembers();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsActionLoading(false);
    }
  };

  const importHref = `/${portalType}/members/import`;
  /** Loan officers share the tenant-admin portal but cannot register/update/delete members. */
  const canManageMembers = user?.role === 'teller' || user?.role === 'tenant-admin';
  const canPermanentlyDelete = user?.role === 'tenant-admin';

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-gold">
              Core Operations
            </span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Member Services</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-serif mt-0.5">
            Member Directory &amp; Registration
          </h1>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
            {canManageMembers
              ? "Register members, search profiles, and bulk-import legacy member records. This tenant cannot see another SACCO's members."
              : 'Search and view member profiles. Registration is limited to tenant admin and teller accounts.'}
          </p>
        </div>
        {canManageMembers && (
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
                setEditingMember(null);
                setFormMode('create');
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-midnight text-gold hover:bg-midnight-light dark:bg-gold dark:text-midnight dark:hover:bg-gold-light transition-all cursor-pointer shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Register Member</span>
            </button>
          </div>
        )}
      </div>

      {!canManageMembers && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-950 dark:text-amber-100 text-xs font-medium">
          You are signed in as <strong>{user?.role ?? 'unknown'}</strong>. Member registration requires{' '}
          <strong>tenant-admin</strong> (<span className="font-mono">admin@tenant-a.dev</span>) or{' '}
          <strong>teller</strong> (<span className="font-mono">teller@tenant-a.dev</span>).
        </div>
      )}

      {successMsg && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs font-medium shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg(null)} className="p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-900 dark:text-rose-200 text-xs font-medium flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 rounded-xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by member number, name, email, or phone..."
            className="w-full h-9 pl-9 pr-4 bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-gold"
          />
        </div>
        <button
          type="button"
          onClick={fetchMembers}
          className="flex items-center justify-center gap-2 px-3.5 h-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 shrink-0 w-full sm:w-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/30">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-800 dark:text-gold" />
            <span>Members List ({total})</span>
          </h2>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Page {page} · {members.length} on screen
          </span>
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
            <p className="text-xs">Try another search or click &quot;+ Register Member&quot;.</p>
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
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {m.nationalId ? (
                        <span className="inline-block bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-mono text-[11px] whitespace-nowrap">
                          {m.nationalId}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.status} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {portalType === 'teller' && (
                          <Link
                            href={`/teller/desk?lookup=${encodeURIComponent(m.memberNumber)}`}
                            title="Open in Teller Desk"
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-gold border border-amber-200 dark:border-amber-900/50"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <button
                          type="button"
                          title="View"
                          onClick={() => setSelectedMember(m)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-800 dark:text-gold" />
                        </button>
                        {canManageMembers && (
                          <>
                            <button
                              type="button"
                              title="Edit"
                              onClick={() => {
                                setFormError(null);
                                setEditingMember(m);
                                setFormMode('edit');
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                            >
                              <Pencil className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            </button>
                            <button
                              type="button"
                              title={canPermanentlyDelete ? 'Deactivate, reactivate, or delete' : 'Set inactive or active'}
                              onClick={() => openMemberActionDialog(m)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700"
                            >
                              {canPermanentlyDelete ? (
                                <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              ) : (
                                <UserX className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && total > 0 && (
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalItems={total}
            itemLabel="members"
            onPageChange={setPage}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize);
              setPage(1);
            }}
          />
        )}
      </div>

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
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 dark:text-gold">Member Profile</span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-serif">{selectedMember.fullName}</h3>
              </div>
              <button type="button" onClick={() => setSelectedMember(null)} className="p-1" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold block">Member Number</span>
                <p className="font-mono font-bold text-amber-800 dark:text-gold text-sm mt-0.5">{selectedMember.memberNumber}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold block">Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedMember.status} size="sm" />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 col-span-2">
                <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold block">ID Number</span>
                <p className="font-mono text-slate-900 dark:text-slate-200 mt-0.5 font-medium whitespace-nowrap overflow-x-auto">
                  {selectedMember.nationalId || 'Not provided'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold block">ID Type</span>
                <p className="text-slate-900 dark:text-slate-200 mt-0.5 font-medium">{selectedMember.idType || 'Not specified'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold block">Phone</span>
                <p className="text-slate-900 dark:text-slate-200 mt-0.5 font-medium">{selectedMember.phone || 'Not provided'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold block">Email</span>
                <p className="text-slate-900 dark:text-slate-200 mt-0.5 font-medium break-all">{selectedMember.email || 'Not provided'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold block">Date of Birth</span>
                <p className="text-slate-900 dark:text-slate-200 mt-0.5 font-medium">{selectedMember.dateOfBirth || 'Not provided'}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex justify-end gap-2">
              {portalType === 'teller' && (
                <Link
                  href={`/teller/desk?lookup=${encodeURIComponent(selectedMember.memberNumber)}`}
                  onClick={() => setSelectedMember(null)}
                  className="px-4 py-2 bg-midnight text-gold hover:bg-midnight-light dark:bg-gold dark:text-midnight dark:hover:bg-gold-light text-xs font-bold rounded-xl shadow-sm inline-flex items-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5" /> Transact in Desk
                </Link>
              )}
              {canManageMembers && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMember(null);
                    setEditingMember(selectedMember);
                    setFormMode('edit');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
              )}
              {canManageMembers &&
                (selectedMember.status === 'inactive' ? (
                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={() => quickSetStatus(selectedMember, 'active')}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-900/50 inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Set active
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={() => quickSetStatus(selectedMember, 'inactive')}
                    className="px-4 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs font-bold rounded-xl border border-amber-200 dark:border-amber-900/50 inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <UserX className="w-3.5 h-3.5" /> Set inactive
                  </button>
                ))}
              {canPermanentlyDelete && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMember(null);
                    openMemberActionDialog(selectedMember);
                  }}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900/50 inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete…
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingActionMember && (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {canPermanentlyDelete ? 'Member status or removal' : 'Change member status'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {canPermanentlyDelete ? (
                <>
                  Choose what to do with <strong>{pendingActionMember.fullName}</strong> (
                  {pendingActionMember.memberNumber}). <strong>Set inactive</strong> keeps the profile on file but blocks
                  transactions. <strong>Delete permanently</strong> removes the member and all related savings, loans, and
                  transaction history — this cannot be undone.
                </>
              ) : (
                <>
                  Set <strong>{pendingActionMember.fullName}</strong> ({pendingActionMember.memberNumber}) to inactive
                  or active. Tellers cannot permanently delete members — ask tenant admin if a row must be removed.
                </>
              )}
            </p>
            {actionError && (
              <p className="text-xs font-semibold text-rose-600" role="alert">
                {actionError}
              </p>
            )}
            <div className="flex flex-col gap-2">
              {pendingActionMember.status === 'inactive' ? (
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => handleSetMemberStatus('active')}
                  className="w-full px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {isActionLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5" />
                  )}
                  Set active
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => handleSetMemberStatus('inactive')}
                  className="w-full px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {isActionLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserX className="w-3.5 h-3.5" />
                  )}
                  Set inactive
                </button>
              )}
              {canPermanentlyDelete && (
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={handleDelete}
                  className="w-full px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {isActionLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Delete permanently
                </button>
              )}
              <button
                type="button"
                disabled={isActionLoading}
                onClick={closeMemberActionDialog}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {formMode && (
        <MemberFormModal
          key={editingMember?.id ?? 'create'}
          mode={formMode}
          member={editingMember}
          submitting={isSubmitting}
          formError={formError}
          onClose={closeForm}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}
