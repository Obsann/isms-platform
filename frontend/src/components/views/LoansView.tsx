'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Search,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Banknote,
  X,
  Calculator,
  Download,
  Printer,
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
import { getMembers, getMemberBalance } from '@/lib/api-client';
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
  const [searchQuery, setSearchQuery] = useState<string>('');
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
  const disbursedCount = loans.filter((l) => l.status === 'disbursed').length;
  const repaidCount = loans.filter((l) => l.status === 'repaid').length;
  const rejectedCount = loans.filter((l) => l.status === 'rejected').length;

  // Filtered loans list based on search and status
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const memberName = getMemberName(loan.memberId).toLowerCase();
      const memberNum = getMemberNumber(loan.memberId).toLowerCase();
      const loanNum = (loan.loanNumber || '').toLowerCase();
      const purpose = (loan.purpose || '').toLowerCase();
      return memberName.includes(q) || memberNum.includes(q) || loanNum.includes(q) || purpose.includes(q);
    });
  }, [loans, searchQuery, members]);

  // Export to CSV Function
  const exportToCsv = () => {
    if (filteredLoans.length === 0) {
      showToast('Export Notice', 'No loans available to export.', 'info');
      return;
    }

    const headers = [
      'Loan Number',
      'Borrower Name',
      'Member Number',
      'Requested (ETB)',
      'Approved (ETB)',
      'Disbursed (ETB)',
      'Term (Months)',
      'Status',
      'Applied Date',
      'Purpose',
    ];

    const rows = filteredLoans.map((l) => [
      l.loanNumber,
      `"${getMemberName(l.memberId).replace(/"/g, '""')}"`,
      l.memberId ? getMemberNumber(l.memberId) : '',
      l.requestedAmount,
      l.approvedAmount || '',
      l.disbursedAmount || '',
      l.termMonths,
      l.status,
      l.appliedAt ? new Date(l.appliedAt).toISOString().split('T')[0] : '',
      `"${(l.purpose || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ISMS_Loans_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export Complete', `Exported ${filteredLoans.length} loan records to CSV.`, 'success');
  };

  // New Loan Application Submit Handler
  const handleApplyLoan = async (data: ApplyLoanFormData) => {
    try {
      const created = await loanApi.apply({
        memberId: data.memberId,
        requestedAmount: String(data.requestedAmount),
        termMonths: data.termMonths,
        purpose: data.purpose,
      });

      // Record attached guarantor pledges if any
      if (data.guarantors && data.guarantors.length > 0) {
        for (const g of data.guarantors) {
          try {
            const gBal = await getMemberBalance(g.guarantorMemberId);
            const savingsAcc = gBal.accounts.find((a) => a.type === 'savings' && a.status === 'active');
            if (savingsAcc) {
              await loanApi.recordGuarantorPledge(
                created.id,
                g.guarantorMemberId,
                savingsAcc.id,
                String(g.pledgedAmount),
              );
            }
          } catch (gErr) {
            console.warn('Could not record guarantor pledge:', gErr);
          }
        }
      }

      showToast('Application Submitted', `Loan ${created.loanNumber} created in pending status.`, 'success');
      setIsApplyModalOpen(false);
      await fetchLoans();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not submit loan application.';
      showToast('Application Failed', msg, 'error');
      throw err;
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
      setRepaymentRef('PAY-');
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
        <div className="flex flex-col">
          <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">{l.loanNumber}</span>
          <span className="text-[10px] text-slate-400">{new Date(l.appliedAt).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      header: 'Borrower',
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
            <span className="font-bold text-emerald-700 dark:text-emerald-400 block">
              {parseFloat(l.disbursedAmount).toLocaleString()} ETB
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">Disbursed</span>
          </div>
        ) : l.approvedAmount ? (
          <div className="text-xs">
            <span className="font-bold text-indigo-700 dark:text-indigo-400 block">
              {parseFloat(l.approvedAmount).toLocaleString()} ETB
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Approved</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">—</span>
        ),
    },
    {
      header: 'Term',
      key: 'termMonths',
      render: (l) => <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{l.termMonths} mos</span>,
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
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
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
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
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
              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
            >
              Repay
            </button>
          )}

          {/* View Details Modal for all roles */}
          <button
            onClick={() => openDetailsModal(l)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg transition-colors"
            title="View Full Loan Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Guarantors & Holds Modal */}
          <button
            onClick={() => openGuarantorModal(l)}
            className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors"
            title="Guarantors & Collateral Holds"
          >
            <ShieldCheck className="w-4 h-4" />
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
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              Role: {role || 'Staff'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">
            Loans &amp; Underwriting Desk
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automated eligibility calculation, threshold routing, double-entry disbursement, and guarantor collateral holds.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchLoans()}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-800 shadow-sm"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsApplyModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Application</span>
          </button>
        </div>
      </div>

      {/* Interactive Modern KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 ring-2 ring-blue-400/30'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Portfolio</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100/80 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {totalLoanExposure.toLocaleString()} <span className="text-xs font-bold text-slate-400">ETB</span>
          </span>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1 flex items-center gap-1">
            <span>{loans.length} Total Applications</span>
            <ArrowRight className="w-3 h-3 opacity-60" />
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/30'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Approvals</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100/80 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{pendingCount}</span>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1 flex items-center gap-1">
            <span>{canReview ? 'Awaiting your review' : 'Under officer review'}</span>
            <ArrowRight className="w-3 h-3 opacity-60" />
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('approved')}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer ${
            statusFilter === 'approved'
              ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-400/30'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Approved Loans</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100/80 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{approvedCount}</span>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1 flex items-center gap-1">
            <span>Ready for disbursement</span>
            <ArrowRight className="w-3 h-3 opacity-60" />
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('repaid')}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer ${
            statusFilter === 'repaid'
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/30'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Settled &amp; Closed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100/80 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{repaidCount}</span>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <span>Holds auto-released</span>
            <ArrowRight className="w-3 h-3 opacity-60" />
          </p>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-rose-900 dark:text-rose-200 text-xs font-medium flex items-center justify-between shadow-sm">
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

      {/* Search & Filter Toolbar */}
      <Card className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Search Input & Export Button */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, loan #, or ID..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={exportToCsv}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 shrink-0 shadow-sm cursor-pointer"
            title="Export filtered loans to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>

        {/* Segmented Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All', count: loans.length },
            { id: 'pending', label: 'Pending', count: pendingCount },
            { id: 'approved', label: 'Approved', count: approvedCount },
            { id: 'disbursed', label: 'Disbursed', count: disbursedCount },
            { id: 'repaid', label: 'Repaid', count: repaidCount },
            { id: 'rejected', label: 'Rejected', count: rejectedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === tab.id
                    ? 'bg-indigo-700/80 text-white'
                    : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Main Loan Data Table */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-600 dark:text-slate-400 space-y-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 dark:text-indigo-400" />
          <p className="text-xs font-medium">Loading loans from server...</p>
        </div>
      ) : (
        <DataTable
          data={filteredLoans}
          columns={columns}
          emptyMessage={
            searchQuery
              ? `No loan records found matching "${searchQuery}".`
              : 'No loan records found in this category.'
          }
        />
      )}

      {/* Apply Loan Modal (Task 18 Component) */}
      <ApplyLoanModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSubmit={handleApplyLoan}
        members={members}
      />

      {/* Review / Approval Modal */}
      {activeModal === 'approve' && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Review Loan Application</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
            </div>

            {/* Threshold Notice for Loan Officers */}
            {isLoanOfficer && parseFloat(selectedLoan.requestedAmount) > HIGH_VALUE_THRESHOLD && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">High-Value Loan Approval Required</span>
                  <p className="text-[11px] leading-relaxed">
                    This application of <strong>{parseFloat(selectedLoan.requestedAmount).toLocaleString()} ETB</strong> exceeds the delegated threshold of 50,000 ETB. Manager/Tenant Admin approval is required.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Borrower:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{getMemberName(selectedLoan.memberId)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Requested Amount:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{parseFloat(selectedLoan.requestedAmount).toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Term:</span>
                <span className="font-medium">{selectedLoan.termMonths} Months</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Purpose:</span>
                <span className="font-medium">{selectedLoan.purpose || '—'}</span>
              </div>
            </div>

            <FormFieldGroup label="Decision Note / Reason">
              <textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="Optional notes or rejection reasons..."
                rows={3}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
              />
            </FormFieldGroup>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold">
                Cancel
              </button>
              <button
                onClick={() => handleDecideApproval(false)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md"
              >
                Reject Application
              </button>
              <button
                onClick={() => handleDecideApproval(true)}
                disabled={isLoanOfficer && parseFloat(selectedLoan.requestedAmount) > HIGH_VALUE_THRESHOLD}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Approve Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disburse Modal */}
      {activeModal === 'disburse' && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Disburse Loan Principal</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
            </div>

            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
              <p>Disburses <strong>{parseFloat(selectedLoan.approvedAmount || selectedLoan.requestedAmount).toLocaleString()} ETB</strong> directly into the borrower&apos;s active savings account via balanced ledger posting.</p>
            </div>

            <FormFieldGroup label="Destination Savings Account ID">
              <input
                type="text"
                value={destinationAccountId}
                onChange={(e) => setDestinationAccountId(e.target.value)}
                placeholder="Account UUID"
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

      {/* Repay Modal */}
      {activeModal === 'repay' && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Record Loan Repayment</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
            </div>

            <FormFieldGroup label="Repayment Amount (ETB)">
              <input
                type="number"
                value={repaymentAmount}
                onChange={(e) => setRepaymentAmount(Number(e.target.value))}
                min="1"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
              />
            </FormFieldGroup>

            <FormFieldGroup label="Payment Reference">
              <input
                type="text"
                value={repaymentRef}
                onChange={(e) => setRepaymentRef(e.target.value)}
                placeholder="Receipt / Voucher #"
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

      {/* Modern Loan Details Modal with Visual Lifecycle Stepper */}
      {activeModal === 'details' && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Loan #{selectedLoan.loanNumber}</h3>
                  <p className="text-[11px] text-slate-500 font-mono">ID: {selectedLoan.id}</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg">✕</button>
            </div>

            {/* Visual 4-Stage Lifecycle Stepper */}
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Loan Lifecycle Progression</span>
              <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                {/* Step 1: Applied */}
                <div className="space-y-1">
                  <div className="w-7 h-7 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    ✓
                  </div>
                  <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 block">Applied</span>
                  <span className="text-[9px] text-slate-400 block">{new Date(selectedLoan.appliedAt).toLocaleDateString()}</span>
                </div>

                {/* Step 2: Decision */}
                <div className="space-y-1">
                  <div
                    className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                      selectedLoan.status === 'rejected'
                        ? 'bg-rose-600 text-white'
                        : selectedLoan.approvedAt || ['approved', 'disbursed', 'repaid'].includes(selectedLoan.status)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {selectedLoan.status === 'rejected' ? '✕' : selectedLoan.approvedAt || ['approved', 'disbursed', 'repaid'].includes(selectedLoan.status) ? '✓' : '2'}
                  </div>
                  <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 block">
                    {selectedLoan.status === 'rejected' ? 'Rejected' : 'Approved'}
                  </span>
                  <span className="text-[9px] text-slate-400 block">
                    {selectedLoan.approvedAt ? new Date(selectedLoan.approvedAt).toLocaleDateString() : 'Pending'}
                  </span>
                </div>

                {/* Step 3: Disbursed */}
                <div className="space-y-1">
                  <div
                    className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                      selectedLoan.disbursedAt || ['disbursed', 'repaid'].includes(selectedLoan.status)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {selectedLoan.disbursedAt || ['disbursed', 'repaid'].includes(selectedLoan.status) ? '✓' : '3'}
                  </div>
                  <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 block">Disbursed</span>
                  <span className="text-[9px] text-slate-400 block">
                    {selectedLoan.disbursedAt ? new Date(selectedLoan.disbursedAt).toLocaleDateString() : 'Awaiting'}
                  </span>
                </div>

                {/* Step 4: Settled */}
                <div className="space-y-1">
                  <div
                    className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                      selectedLoan.status === 'repaid'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {selectedLoan.status === 'repaid' ? '✓' : '4'}
                  </div>
                  <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 block">Settled</span>
                  <span className="text-[9px] text-slate-400 block">
                    {selectedLoan.status === 'repaid' ? 'Closed' : 'Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Borrower</span>
                <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{getMemberName(selectedLoan.memberId)}</p>
                <p className="font-mono text-slate-500 text-[10px]">{getMemberNumber(selectedLoan.memberId)}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Current Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedLoan.status as StatusType} />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Requested Principal</span>
                <p className="font-black text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                  {parseFloat(selectedLoan.requestedAmount).toLocaleString()} ETB
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Disbursed Principal</span>
                <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
                  {selectedLoan.disbursedAmount
                    ? `${parseFloat(selectedLoan.disbursedAmount).toLocaleString()} ETB`
                    : selectedLoan.approvedAmount
                      ? `${parseFloat(selectedLoan.approvedAmount).toLocaleString()} ETB (Approved)`
                      : 'Not disbursed'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Term &amp; Installment</span>
                <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {selectedLoan.termMonths} Mos · ~{Math.round(parseFloat(selectedLoan.requestedAmount) / (selectedLoan.termMonths || 12)).toLocaleString()} ETB/mo
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Policy Rule</span>
                <p className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">3× Savings Multiplier</p>
              </div>

              <div className="col-span-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Purpose &amp; Staff Notes</span>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5 font-medium">{selectedLoan.purpose || 'Working Capital'}</p>
                {selectedLoan.approvalNote && (
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 italic">
                    Note: &ldquo;{selectedLoan.approvalNote}&rdquo;
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Print clean branch loan summary voucher"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Voucher</span>
              </button>
              <button onClick={() => setActiveModal(null)} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guarantors & Holds Modal */}
      {activeModal === 'guarantors' && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
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
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-600 dark:text-indigo-400" />
                <p className="text-xs mt-2 font-medium">Loading guarantor records...</p>
              </div>
            ) : loanGuarantors.length === 0 ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-xs italic">
                No guarantor pledges recorded for this loan.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {loanGuarantors.map((g) => (
                  <div key={g.pledgeId} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between text-xs shadow-sm">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{getMemberName(g.guarantorMemberId)}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">Hold ID: {g.holdId}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{parseFloat(g.pledgedAmount).toLocaleString()} ETB</span>

                      {/* Release hold only for loan officer / admin */}
                      {canManageGuarantors && (
                        <button
                          onClick={() => handleReleaseGuarantor(g.pledgeId)}
                          className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-[11px] font-semibold transition-colors"
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
                      <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1 font-medium">Select Guarantor Member</label>
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
                      <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1 font-medium">Pledged Amount (ETB)</label>
                      <input
                        type="number"
                        value={pledgeAmount}
                        onChange={(e) => setPledgeAmount(e.target.value)}
                        placeholder="e.g. 15000"
                        min="1"
                        step="any"
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddGuarantorForm(false)}
                        className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddGuarantorPledge}
                        disabled={isSubmittingPledge}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm"
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
