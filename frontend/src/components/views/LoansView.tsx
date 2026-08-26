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
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import StatusBadge, { type StatusType } from '@/components/badges/StatusBadge';
import CurrencyDisplay from '@/components/currency/CurrencyDisplay';
import FormFieldGroup from '@/components/forms/FormFieldGroup';
import DataTable, { Column } from '@/components/tables/DataTable';
import { Card } from '@/components/ui/Card';
import ApplyLoanModal, { ApplyLoanFormData } from '@/components/forms/ApplyLoanModal';
import { loanApi, type LoanRow, type GuarantorPledge } from '@/lib/loanApi';
import { getMembers } from '@/lib/api-client';
import type { Member } from '@/types';

export default function LoansView() {
  const { showToast } = useApp();
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Selected loan for action modals
  const [selectedLoan, setSelectedLoan] = useState<LoanRow | null>(null);
  const [activeModal, setActiveModal] = useState<'approve' | 'disburse' | 'repay' | 'guarantors' | null>(null);

  // Modal form states
  const [approvalNote, setApprovalNote] = useState('');
  const [repaymentAmount, setRepaymentAmount] = useState<number>(5000);
  const [repaymentRef, setRepaymentRef] = useState('PAY-');
  const [destinationAccountId, setDestinationAccountId] = useState('');

  // Guarantor pledge state for selected loan
  const [loanGuarantors, setLoanGuarantors] = useState<GuarantorPledge[]>([]);
  const [isLoadingGuarantors, setIsLoadingGuarantors] = useState(false);

  const fetchLoans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await loanApi.list({
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setLoans(res.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch loans from server.');
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
    let mounted = true;
    loanApi
      .list({
        status: statusFilter !== 'all' ? statusFilter : undefined,
      })
      .then((res) => {
        if (!mounted) return;
        setLoans(res.items || []);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch loans from server.');
        setLoans([]);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [statusFilter]);

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
  const handleDisburse = async () => {
    if (!selectedLoan) return;
    try {
      await loanApi.disburse(
        selectedLoan.id,
        destinationAccountId || selectedLoan.memberId,
        selectedLoan.approvedAmount || selectedLoan.requestedAmount,
      );
      showToast(
        'Loan Disbursed',
        `Disbursed ${selectedLoan.approvedAmount || selectedLoan.requestedAmount} ETB to borrower.`,
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
      showToast('Release Failed', err instanceof Error ? err.message : 'Could not release guarantor pledge.', 'error');
    }
  };

  // Table Columns Setup
  const columns: Column<LoanRow>[] = [
    {
      header: 'Loan Details',
      key: 'loanNumber',
      render: (l) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">{l.loanNumber}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{l.purpose || 'General loan'}</span>
        </div>
      ),
    },
    {
      header: 'Borrower',
      key: 'memberId',
      render: (l) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">{getMemberName(l.memberId)}</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{getMemberNumber(l.memberId)}</span>
        </div>
      ),
    },
    {
      header: 'Requested',
      key: 'requestedAmount',
      render: (l) => <CurrencyDisplay value={parseFloat(l.requestedAmount || '0')} currency="ETB" size="sm" />,
    },
    {
      header: 'Disbursed',
      key: 'disbursedAmount',
      render: (l) =>
        l.disbursedAmount ? (
          <div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              {parseFloat(l.disbursedAmount).toLocaleString()} ETB
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500 italic">—</span>
        ),
    },
    {
      header: 'Term',
      key: 'termMonths',
      render: (l) => <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{l.termMonths} mos</span>,
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
          {l.status === 'pending' && (
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

          {l.status === 'approved' && (
            <button
              onClick={() => {
                setSelectedLoan(l);
                setActiveModal('disburse');
              }}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              Disburse
            </button>
          )}

          {l.status === 'disbursed' && (
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

          <button
            onClick={() => openGuarantorModal(l)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg"
            title="View Guarantors & Holds"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Loans & Credit Portfolio</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Application, approval workflow, disbursements, and guarantor holds</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLoans()}
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
            title="Refresh Loans"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Loan Application
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Exposure</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <CurrencyDisplay value={totalLoanExposure} currency="ETB" size="lg" />
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">Disbursed loan portfolio</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Approvals</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{pendingCount}</span>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">Awaiting officer review</p>
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

      {/* Approval Action Modal */}
      {activeModal === 'approve' && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Review Loan {selectedLoan.loanNumber}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Requested by <strong className="text-slate-800 dark:text-slate-200">{getMemberName(selectedLoan.memberId)}</strong> for {parseFloat(selectedLoan.requestedAmount).toLocaleString()} ETB.
            </p>

            <FormFieldGroup label="Officer Approval Note">
              <textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="e.g. Credit score verified, income backing confirmed."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                rows={3}
              />
            </FormFieldGroup>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => handleDecideApproval(false)} className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/60 rounded-xl text-xs font-semibold">
                Reject Application
              </button>
              <button onClick={() => handleDecideApproval(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md">
                Approve Loan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disbursement Action Modal */}
      {activeModal === 'disburse' && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Disburse Loan {selectedLoan.loanNumber}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Disbursing <strong>{(parseFloat(selectedLoan.approvedAmount || selectedLoan.requestedAmount)).toLocaleString()} ETB</strong> into borrower&apos;s account via double-entry ledger posting.
            </p>

            <FormFieldGroup label="Destination Account ID / Reference">
              <input
                type="text"
                value={destinationAccountId}
                onChange={(e) => setDestinationAccountId(e.target.value)}
                placeholder="Enter member savings account UUID"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Record Loan Repayment</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Loan: {selectedLoan.loanNumber}</p>

            <FormFieldGroup label="Repayment Amount (ETB)">
              <input
                type="number"
                value={repaymentAmount}
                onChange={(e) => setRepaymentAmount(Number(e.target.value))}
                min="100"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
              />
            </FormFieldGroup>

            <FormFieldGroup label="Payment Reference / Idempotency Key">
              <input
                type="text"
                value={repaymentRef}
                onChange={(e) => setRepaymentRef(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
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

      {/* Guarantors & Holds Modal */}
      {activeModal === 'guarantors' && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Guarantor Pledges — {selectedLoan.loanNumber}</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
            </div>

            {isLoadingGuarantors ? (
              <div className="p-8 text-center text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-800 dark:text-gold" />
                <p className="text-xs mt-2">Loading guarantor records...</p>
              </div>
            ) : loanGuarantors.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic py-4 text-center">No guarantor pledges attached to this loan.</p>
            ) : (
              <div className="space-y-3">
                {loanGuarantors.map((g) => (
                  <div key={g.pledgeId} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{getMemberName(g.guarantorMemberId)}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">Hold ID: {g.holdId}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{parseFloat(g.pledgedAmount).toLocaleString()} ETB</span>

                      <button
                        onClick={() => handleReleaseGuarantor(g.pledgeId)}
                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded text-[11px] font-medium"
                      >
                        Release
                      </button>
                    </div>
                  </div>
                ))}
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
