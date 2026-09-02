'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Building2,
  CheckCircle2,
  RefreshCw,
  Clock,
  Eye,
  Loader2,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  UserCheck,
  FileText,
  X,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuthUser } from '@/components/auth/useAuthUser';
import StatusBadge, { type StatusType } from '@/components/badges/StatusBadge';
import CurrencyDisplay from '@/components/currency/CurrencyDisplay';
import FormFieldGroup from '@/components/forms/FormFieldGroup';
import DataTable, { Column } from '@/components/tables/DataTable';
import { Card } from '@/components/ui/Card';
import ApplyLoanModal, { ApplyLoanFormData } from '@/components/forms/ApplyLoanModal';
import { loanApi, type LoanRow, type GuarantorPledge } from '@/lib/loanApi';
import { getMembers } from '@/lib/api-client';
import { createSavingsAccount, listAccountsByMember } from '@/lib/api-client/teller';
import type { Member } from '@/types';

const HIGH_VALUE_THRESHOLD = 50000;

export default function LoansView() {
  const { showToast } = useApp();
  const authUser = useAuthUser();
  const role = authUser?.role;

  // Role permissions
  const canReview = role === 'loan-officer' || role === 'tenant-admin' || role === 'super-admin';
  const canDisburse = role === 'loan-officer' || role === 'tenant-admin';
  const canRepay = role === 'teller' || role === 'tenant-admin' || role === 'loan-officer';
  const canManageGuarantors = role === 'loan-officer' || role === 'tenant-admin';
  const isLoanOfficer = role === 'loan-officer';
  const isTeller = role === 'teller';

  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Selected loan for action modals
  const [selectedLoan, setSelectedLoan] = useState<LoanRow | null>(null);
  const [activeModal, setActiveModal] = useState<'approve' | 'disburse' | 'repay' | 'guarantors' | 'details' | null>(null);

  // Modal form states
  const [approvalNote, setApprovalNote] = useState('');
  const [repaymentAmount, setRepaymentAmount] = useState<number>(5000);
  const [repaymentRef, setRepaymentRef] = useState('PAY-');
  const [destinationAccountId, setDestinationAccountId] = useState('');

  // Guarantor pledge state for selected loan
  const [loanGuarantors, setLoanGuarantors] = useState<GuarantorPledge[]>([]);
  const [isLoadingGuarantors, setIsLoadingGuarantors] = useState(false);
  const [showAddGuarantorForm, setShowAddGuarantorForm] = useState(false);
  const [pledgeGuarantorId, setPledgeGuarantorId] = useState('');
  const [pledgeAmount, setPledgeAmount] = useState('');
  const [isSubmittingPledge, setIsSubmittingPledge] = useState(false);

  const fetchLoans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await loanApi.list({
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setLoans(res.items || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch loans from server.';
      setError(msg === 'Failed to fetch' ? 'Unable to reach backend server. Please check your network connection or try retrying.' : msg);
      setLoans([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    let mounted = true;
    getMembers({ limit: 100 })
      .then((res) => {
        if (!mounted) return;
        const items = 'items' in res && Array.isArray(res.items) ? res.items : Array.isArray(res) ? res : [];
        setMembers(items);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    void fetchLoans();
  }, [fetchLoans]);

  const getMemberName = (memberId: string) => {
    const m = members.find((x) => x.id === memberId);
    return m ? m.fullName : memberId;
  };

  const getMemberNumber = (memberId: string) => {
    const m = members.find((x) => x.id === memberId);
    return m ? m.memberNumber : memberId;
  };

  // KPI Calculations from real backend data
  const totalLoanExposure = loans
    .filter((l) => l.status === 'disbursed')
    .reduce((acc, l) => acc + parseFloat(l.disbursedAmount || l.approvedAmount || l.requestedAmount || '0'), 0);

  const pendingCount = loans.filter((l) => l.status === 'pending').length;
  const approvedCount = loans.filter((l) => l.status === 'approved').length;
  const repaidCount = loans.filter((l) => l.status === 'repaid').length;

  // New Loan Application Submit Handler
  const handleApplyLoan = async (data: ApplyLoanFormData) => {
    try {
      const created = await loanApi.apply({
        memberId: data.memberId,
        requestedAmount: String(data.requestedAmount),
        termMonths: data.termMonths,
        purpose: data.purpose,
      });

      showToast('Application Submitted', `Loan ${created.loanNumber} created in pending status.`, 'success');
      setIsApplyModalOpen(false);
      await fetchLoans();
    } catch (err) {
      showToast('Application Failed', err instanceof Error ? err.message : 'Could not submit loan application.', 'error');
    }
  };

  // Approval / Rejection Handler
  const handleDecideApproval = async (approved: boolean) => {
    if (!selectedLoan) return;
    try {
      await loanApi.decideApproval(selectedLoan.id, approved, approvalNote);
      showToast(
        approved ? 'Loan Approved' : 'Loan Rejected',
        `Loan ${selectedLoan.loanNumber} has been ${approved ? 'approved' : 'rejected'}.`,
        approved ? 'success' : 'info',
      );
      setActiveModal(null);
      setSelectedLoan(null);
      setApprovalNote('');
      await fetchLoans();
    } catch (err) {
      showToast('Approval Failed', err instanceof Error ? err.message : 'Could not process approval decision.', 'error');
    }
  };

  // Disbursement Handler
  const openDisburseModal = async (loan: LoanRow) => {
    setSelectedLoan(loan);
    setDestinationAccountId('');
    setActiveModal('disburse');
    try {
      const accounts = await listAccountsByMember(loan.memberId);
      let savings =
        accounts.find((a) => a.type === 'savings' && a.status === 'active') ??
        accounts.find((a) => a.type === 'savings') ??
        accounts[0];
      if (!savings) {
        savings = await createSavingsAccount(loan.memberId);
      }
      setDestinationAccountId(savings.id);
    } catch (err) {
      showToast(
        'Account lookup failed',
        err instanceof Error ? err.message : 'Could not find a savings account for this member.',
        'error',
      );
    }
  };

  const handleDisburse = async () => {
    if (!selectedLoan) return;
    if (!destinationAccountId) {
      showToast('Disbursement Failed', 'A savings account is required before disbursement.', 'error');
      return;
    }
    try {
      await loanApi.disburse(
        selectedLoan.id,
        destinationAccountId,
        selectedLoan.approvedAmount || selectedLoan.requestedAmount,
      );
      showToast(
        'Loan Disbursed',
        `Disbursed ${selectedLoan.approvedAmount || selectedLoan.requestedAmount} ETB to borrower account.`,
        'success',
      );
      setActiveModal(null);
      setSelectedLoan(null);
      setDestinationAccountId('');
      await fetchLoans();
    } catch (err) {
      showToast('Disbursement Failed', err instanceof Error ? err.message : 'Disbursement failed.', 'error');
    }
  };

  // Repayment Handler
  const handleRecordRepayment = async () => {
    if (!selectedLoan) return;
    try {
      await loanApi.recordRepayment(selectedLoan.id, String(repaymentAmount), repaymentRef);
      showToast('Repayment Recorded', `Recorded ${repaymentAmount.toLocaleString()} ETB repayment.`, 'success');
      setActiveModal(null);
      setSelectedLoan(null);
      setRepaymentAmount(5000);
      await fetchLoans();
    } catch (err) {
      showToast('Repayment Failed', err instanceof Error ? err.message : 'Repayment recording failed.', 'error');
    }
  };

  // Open Guarantor Modal & Fetch pledges
  const openGuarantorModal = async (loan: LoanRow) => {
    setSelectedLoan(loan);
    setActiveModal('guarantors');
    setShowAddGuarantorForm(false);
    setPledgeGuarantorId('');
    setPledgeAmount('');
    setIsLoadingGuarantors(true);
    try {
      const g = await loanApi.getGuarantors(loan.id);
      setLoanGuarantors(g);
    } catch {
      setLoanGuarantors([]);
    } finally {
      setIsLoadingGuarantors(false);
    }
  };

  // Add Guarantor Pledge
  const handleAddGuarantorPledge = async () => {
    if (!selectedLoan || !pledgeGuarantorId || !pledgeAmount) {
      showToast('Validation Error', 'Please select a guarantor and enter a valid pledge amount.', 'error');
      return;
    }
    setIsSubmittingPledge(true);
    try {
      // Find active savings account for the guarantor
      const accounts = await listAccountsByMember(pledgeGuarantorId);
      const savings =
        accounts.find((a) => a.type === 'savings' && a.status === 'active') ?? accounts[0];
      if (!savings) {
        throw new Error('Selected guarantor has no active savings account to place a collateral hold on.');
      }
      await loanApi.recordGuarantorPledge(selectedLoan.id, pledgeGuarantorId, savings.id, pledgeAmount);
      showToast('Pledge Recorded', `Pledge of ${pledgeAmount} ETB recorded with collateral hold.`, 'success');
      setPledgeGuarantorId('');
      setPledgeAmount('');
      setShowAddGuarantorForm(false);
      const g = await loanApi.getGuarantors(selectedLoan.id);
      setLoanGuarantors(g);
    } catch (err) {
      showToast('Pledge Failed', err instanceof Error ? err.message : 'Could not record guarantor pledge.', 'error');
    } finally {
      setIsSubmittingPledge(false);
    }
  };

  // Manual Release Guarantor Hold
  const handleReleaseGuarantor = async (pledgeId: string) => {
    if (!selectedLoan) return;
    try {
      await loanApi.releaseGuarantorPledge(pledgeId);
      showToast('Hold Released', 'Guarantor pledge hold released & withdrawable balance restored.', 'info');
      const g = await loanApi.getGuarantors(selectedLoan.id);
      setLoanGuarantors(g);
      await fetchLoans();
    } catch (err) {
      showToast('Release Failed', err instanceof Error ? err.message : 'Could not release guarantor hold.', 'error');
    }
  };

  const openDetailsModal = (loan: LoanRow) => {
    setSelectedLoan(loan);
    setActiveModal('details');
  };

  // Main DataTable Columns Definition
  const columns: Column<LoanRow>[] = [
    {
      header: 'Loan #',
      key: 'loanNumber',
      render: (l) => (
        <span className="font-mono text-xs font-bold text-amber-800 dark:text-gold">{l.loanNumber}</span>
      ),
    },
    {
      header: 'Member / Borrower',
      key: 'memberId',
      render: (l) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-slate-100 block">{getMemberName(l.memberId)}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{getMemberNumber(l.memberId)}</span>
        </div>
      ),
    },
    {
      header: 'Requested Amount',
      key: 'requestedAmount',
      render: (l) => (
        <div className="font-semibold text-slate-900 dark:text-slate-100">
          {parseFloat(l.requestedAmount).toLocaleString()} ETB
        </div>
      ),
    },
    {
      header: 'Approved / Disbursed',
      key: 'disbursedAmount',
      render: (l) =>
        l.disbursedAmount ? (
          <div className="text-xs">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 block">
              {parseFloat(l.disbursedAmount).toLocaleString()} ETB
            </span>
            <span className="text-[10px] text-slate-400">Disbursed</span>
          </div>
        ) : l.approvedAmount ? (
          <div className="text-xs">
            <span className="font-semibold text-indigo-700 dark:text-indigo-400 block">
              {parseFloat(l.approvedAmount).toLocaleString()} ETB
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400">Approved</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">—</span>
        ),
    },
    {
      header: 'Term',
      key: 'termMonths',
      render: (l) => <span className="text-xs text-slate-700 dark:text-slate-300">{l.termMonths} mos</span>,
    },
    {
      header: 'Status',
      key: 'status',
      render: (l) => <StatusBadge status={l.status as StatusType} />,
    },
    {
      header: 'Actions',
      key: 'id',
      render: (l) => (
        <div className="flex items-center gap-1.5">
          {/* Review / Decision (Only for Loan Officer / Admin) */}
          {l.status === 'pending' && canReview && (
            <button
              onClick={() => {
                setSelectedLoan(l);
                setActiveModal('approve');
              }}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              Review
            </button>
          )}

          {/* Disburse (Only for Loan Officer / Admin) */}
          {l.status === 'approved' && canDisburse && (
            <button
              onClick={() => {
                void openDisburseModal(l);
              }}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              Disburse
            </button>
          )}

          {/* Repayment (For Tellers, Admins, Loan Officers) */}
          {l.status === 'disbursed' && canRepay && (
            <button
              onClick={() => {
                setSelectedLoan(l);
                setActiveModal('repay');
              }}
              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              Repay
            </button>
          )}

          {/* View Details Modal for all roles */}
          <button
            onClick={() => openDetailsModal(l)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg"
            title="View Full Loan Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Guarantors & Holds Modal */}
          <button
            onClick={() => openGuarantorModal(l)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg"
            title="Guarantors & Collateral Holds"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-800 dark:text-gold">
              Credit Management
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-400">
              Role: {role || 'Staff'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            Loans &amp; Underwriting Desk
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automated eligibility calculation, threshold routing, double-entry disbursement, and guarantor collateral holds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchLoans()}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsApplyModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-midnight text-gold hover:bg-midnight-light dark:bg-gold dark:text-midnight rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Application</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Portfolio</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {totalLoanExposure.toLocaleString()} ETB
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Total active principal</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Approvals</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{pendingCount}</span>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">
            {canReview ? 'Awaiting your review' : 'Under officer review'}
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Approved Loans</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{approvedCount}</span>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1">Ready for disbursement</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fully Settled Loans</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{repaidCount}</span>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">Holds auto-released</p>
        </Card>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-900 dark:text-rose-200 text-xs font-medium flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchLoans()}
            className="px-3 py-1 bg-rose-100 dark:bg-rose-900/60 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-900 dark:text-rose-100 rounded-lg text-xs font-bold transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'pending', 'approved', 'disbursed', 'repaid'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </Card>

      {/* Main Loan Data Table */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-600 dark:text-slate-400 space-y-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-800 dark:text-gold" />
          <p className="text-xs font-medium">Loading loans from server...</p>
        </div>
      ) : (
        <DataTable
          data={loans}
          columns={columns}
          emptyMessage="No loan records found in this tenant."
          searchPlaceholder="Search by loan # or purpose..."
        />
      )}

      {/* Application Modal */}
      <ApplyLoanModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSubmit={handleApplyLoan}
        members={members}
      />

      {/* Approval Action Modal (Review) */}
      {activeModal === 'approve' && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Review Loan {selectedLoan.loanNumber}</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-500 dark:text-slate-400">
                Requested by <strong className="text-slate-800 dark:text-slate-200">{getMemberName(selectedLoan.memberId)}</strong> ({getMemberNumber(selectedLoan.memberId)})
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-slate-500">Requested Principal:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {parseFloat(selectedLoan.requestedAmount).toLocaleString()} ETB
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Purpose: {selectedLoan.purpose || 'Working capital / general loan'}</p>
            </div>

            {/* Threshold Notice for Loan Officers */}
            {isLoanOfficer && parseFloat(selectedLoan.requestedAmount) > HIGH_VALUE_THRESHOLD && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 text-xs">
                <p className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  High-Value Loan Approval Rule (FR-3.2)
                </p>
                <p className="mt-1 text-[11px] leading-relaxed">
                  Applications above {HIGH_VALUE_THRESHOLD.toLocaleString()} ETB exceed loan officer authority and require <strong>Tenant Admin / Manager</strong> approval.
                </p>
              </div>
            )}

            <FormFieldGroup label="Officer Approval Note">
              <textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="e.g. Credit evaluation passed, savings multiplier and guarantor coverage verified."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                rows={3}
              />
            </FormFieldGroup>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => handleDecideApproval(false)}
                className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/60 rounded-xl text-xs font-semibold"
              >
                Reject Application
              </button>
              <button
                onClick={() => handleDecideApproval(true)}
                disabled={isLoanOfficer && parseFloat(selectedLoan.requestedAmount) > HIGH_VALUE_THRESHOLD}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-md"
              >
                Approve Loan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disbursement Action Modal */}
      {activeModal === 'disburse' && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Disburse Loan {selectedLoan.loanNumber}</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Disbursing <strong>{(parseFloat(selectedLoan.approvedAmount || selectedLoan.requestedAmount)).toLocaleString()} ETB</strong> directly into the borrower&apos;s savings account via atomic ledger posting.
            </p>

            <FormFieldGroup label="Destination Savings Account ID">
              <input
                type="text"
                value={destinationAccountId}
                onChange={(e) => setDestinationAccountId(e.target.value)}
                placeholder="Savings account ID (auto-resolved)"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-mono"
              />
            </FormFieldGroup>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold">
                Cancel
              </button>
              <button onClick={handleDisburse} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md">
                Confirm Disbursement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repayment Action Modal */}
      {activeModal === 'repay' && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Record Loan Repayment</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Posting repayment for loan <strong className="text-slate-800 dark:text-slate-200">{selectedLoan.loanNumber}</strong> ({getMemberName(selectedLoan.memberId)}).
            </p>

            <FormFieldGroup label="Repayment Amount (ETB)">
              <input
                type="number"
                value={repaymentAmount}
                onChange={(e) => setRepaymentAmount(Number(e.target.value))}
                min="100"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
              />
            </FormFieldGroup>

            <FormFieldGroup label="Payment Reference / Receipt ID">
              <input
                type="text"
                value={repaymentRef}
                onChange={(e) => setRepaymentRef(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-mono"
              />
            </FormFieldGroup>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold">
                Cancel
              </button>
              <button onClick={handleRecordRepayment} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md">
                Post Repayment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loan Details Modal (Read-Only View for All Roles) */}
      {activeModal === 'details' && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-800 dark:text-gold" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Loan Details — {selectedLoan.loanNumber}</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Borrower</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{getMemberName(selectedLoan.memberId)}</p>
                <p className="font-mono text-slate-500 text-[10px]">{getMemberNumber(selectedLoan.memberId)}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedLoan.status as StatusType} />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Requested Principal</span>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                  {parseFloat(selectedLoan.requestedAmount).toLocaleString()} ETB
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Approved / Disbursed</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
                  {selectedLoan.disbursedAmount
                    ? `${parseFloat(selectedLoan.disbursedAmount).toLocaleString()} ETB`
                    : selectedLoan.approvedAmount
                      ? `${parseFloat(selectedLoan.approvedAmount).toLocaleString()} ETB (Approved)`
                      : 'Pending'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Term Duration</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{selectedLoan.termMonths} Months</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Applied Date</span>
                <p className="font-mono text-slate-700 dark:text-slate-300 mt-0.5 text-[11px]">
                  {new Date(selectedLoan.appliedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="col-span-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Purpose &amp; Note</span>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5">{selectedLoan.purpose || 'General / Working capital'}</p>
                {selectedLoan.approvalNote && (
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 italic">
                    Approval note: {selectedLoan.approvalNote}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guarantors & Holds Modal */}
      {activeModal === 'guarantors' && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Guarantor Pledges — {selectedLoan.loanNumber}</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              Borrower: <strong className="text-slate-800 dark:text-slate-200">{getMemberName(selectedLoan.memberId)}</strong> · Pledges hold savings balances as collateral security.
            </div>

            {/* List of existing pledges */}
            {isLoadingGuarantors ? (
              <div className="p-8 text-center text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-800 dark:text-gold" />
                <p className="text-xs mt-2">Loading guarantor records...</p>
              </div>
            ) : loanGuarantors.length === 0 ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-xs italic">
                No guarantor pledges recorded for this loan.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {loanGuarantors.map((g) => (
                  <div key={g.pledgeId} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{getMemberName(g.guarantorMemberId)}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">Hold ID: {g.holdId}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{parseFloat(g.pledgedAmount).toLocaleString()} ETB</span>

                      {/* Release hold only for loan officer / admin */}
                      {canManageGuarantors && (
                        <button
                          onClick={() => handleReleaseGuarantor(g.pledgeId)}
                          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded text-[11px] font-medium"
                        >
                          Release
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Guarantor Pledge Form (Only for Loan Officer / Admin when loan is pending or approved) */}
            {canManageGuarantors && ['pending', 'approved'].includes(selectedLoan.status) && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                {!showAddGuarantorForm ? (
                  <button
                    type="button"
                    onClick={() => setShowAddGuarantorForm(true)}
                    className="w-full py-2 px-3 border border-dashed border-indigo-300 dark:border-indigo-800 hover:border-indigo-500 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Guarantor Pledge</span>
                  </button>
                ) : (
                  <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/50 space-y-3 text-xs">
                    <span className="font-bold text-indigo-900 dark:text-indigo-300 block text-xs">New Guarantor Pledge</span>
                    <div>
                      <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">Select Guarantor Member</label>
                      <select
                        value={pledgeGuarantorId}
                        onChange={(e) => setPledgeGuarantorId(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      >
                        <option value="">-- Choose Member --</option>
                        {members
                          .filter((m) => m.id !== selectedLoan.memberId)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.fullName} ({m.memberNumber})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">Pledged Amount (ETB)</label>
                      <input
                        type="number"
                        value={pledgeAmount}
                        onChange={(e) => setPledgeAmount(e.target.value)}
                        placeholder="e.g. 15000"
                        min="1"
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddGuarantorForm(false)}
                        className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddGuarantorPledge}
                        disabled={isSubmittingPledge}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                      >
                        {isSubmittingPledge ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Record Pledge Hold'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
