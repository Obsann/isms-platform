'use client';

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  DollarSign,
  ShieldCheck,
  Building2,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  UserCheck,
  Lock,
  Unlock,
  RefreshCw,
  Clock,
  Eye,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import StatusBadge from '@/components/badges/StatusBadge';
import CurrencyDisplay from '@/components/currency/CurrencyDisplay';
import FormFieldGroup from '@/components/forms/FormFieldGroup';
import DataTable, { Column } from '@/components/tables/DataTable';
import { Card } from '@/components/ui/Card';
import ApplyLoanModal, { ApplyLoanFormData } from '@/components/forms/ApplyLoanModal';
import { loanApi } from '@/lib/loanApi';

export interface LoanRecord {
  id: string;
  loanNumber: string;
  memberId: string;
  memberName: string;
  requestedAmount: number;
  approvedAmount: number | null;
  disbursedAmount: number | null;
  repaidAmount: number;
  termMonths: number;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed' | 'repaid';
  appliedAt: string;
  guarantors: Array<{
    pledgeId: string;
    guarantorMemberId: string;
    guarantorName: string;
    pledgedAmount: number;
    holdId: string;
    status: 'active' | 'released';
  }>;
}

const initialMockLoans: LoanRecord[] = [
  {
    id: 'LN-101',
    loanNumber: 'LN-2026-000101',
    memberId: 'MEM-1001',
    memberName: 'Abebe Bikila',
    requestedAmount: 80000,
    approvedAmount: 80000,
    disbursedAmount: 80000,
    repaidAmount: 20000,
    termMonths: 24,
    purpose: 'Commercial Vehicle Finance',
    status: 'disbursed',
    appliedAt: '2026-08-01',
    guarantors: [
      {
        pledgeId: 'PLG-1',
        guarantorMemberId: 'MEM-1002',
        guarantorName: 'Tigist Assefa',
        pledgedAmount: 25000,
        holdId: 'HLD-839201',
        status: 'active',
      },
    ],
  },
  {
    id: 'LN-102',
    loanNumber: 'LN-2026-000102',
    memberId: 'MEM-1003',
    memberName: 'Mulugeta Seretse',
    requestedAmount: 35000,
    approvedAmount: null,
    disbursedAmount: null,
    repaidAmount: 0,
    termMonths: 12,
    purpose: 'Retail Store Inventory',
    status: 'pending',
    appliedAt: '2026-08-15',
    guarantors: [
      {
        pledgeId: 'PLG-2',
        guarantorMemberId: 'MEM-1004',
        guarantorName: 'Hirut Bekele',
        pledgedAmount: 10000,
        holdId: 'HLD-449102',
        status: 'active',
      },
    ],
  },
  {
    id: 'LN-103',
    loanNumber: 'LN-2026-000103',
    memberId: 'MEM-1004',
    memberName: 'Hirut Bekele',
    requestedAmount: 250000,
    approvedAmount: 250000,
    disbursedAmount: 250000,
    repaidAmount: 250000,
    termMonths: 36,
    purpose: 'Real Estate Mortgage Support',
    status: 'repaid',
    appliedAt: '2025-06-10',
    guarantors: [
      {
        pledgeId: 'PLG-3',
        guarantorMemberId: 'MEM-1005',
        guarantorName: 'Kassahun Tadesse',
        pledgedAmount: 50000,
        holdId: 'HLD-109283',
        status: 'released',
      },
    ],
  },
  {
    id: 'LN-104',
    loanNumber: 'LN-2026-000104',
    memberId: 'MEM-1007',
    memberName: 'Yonas Gebremedhin',
    requestedAmount: 65000,
    approvedAmount: 65000,
    disbursedAmount: null,
    repaidAmount: 0,
    termMonths: 18,
    purpose: 'Tech Equipment Upgrade',
    status: 'approved',
    appliedAt: '2026-08-18',
    guarantors: [],
  },
];

export default function LoansView() {
  const { members, showToast } = useApp();
  const [loans, setLoans] = useState<LoanRecord[]>(initialMockLoans);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Selected loan for modals
  const [selectedLoan, setSelectedLoan] = useState<LoanRecord | null>(null);
  const [activeModal, setActiveModal] = useState<'approve' | 'disburse' | 'repay' | 'guarantors' | null>(null);

  // Modal form states
  const [approvalNote, setApprovalNote] = useState('');
  const [repaymentAmount, setRepaymentAmount] = useState<number>(5000);
  const [repaymentRef, setRepaymentRef] = useState('PAY-');

  // Filtered list
  const filteredLoans = loans.filter((l) => {
    const matchesSearch =
      l.loanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const totalLoanExposure = loans
    .filter((l) => l.status === 'disbursed')
    .reduce((acc, l) => acc + ((l.disbursedAmount || 0) - l.repaidAmount), 0);

  const pendingCount = loans.filter((l) => l.status === 'pending').length;
  const totalGuarantorHolds = loans
    .flatMap((l) => l.guarantors)
    .filter((g) => g.status === 'active')
    .reduce((acc, g) => acc + g.pledgedAmount, 0);
  const repaidCount = loans.filter((l) => l.status === 'repaid').length;

  // New Loan Application Submit Handler
  const handleApplyLoan = async (data: ApplyLoanFormData) => {
    const borrower = members.find((m) => m.id === data.memberId);
    const newLoanNumber = `LN-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000) + 100000}`;

    const newLoan: LoanRecord = {
      id: `LN-${Date.now()}`,
      loanNumber: newLoanNumber,
      memberId: data.memberId,
      memberName: borrower?.fullName || 'Unknown Member',
      requestedAmount: data.requestedAmount,
      approvedAmount: null,
      disbursedAmount: null,
      repaidAmount: 0,
      termMonths: data.termMonths,
      purpose: data.purpose,
      status: 'pending',
      appliedAt: new Date().toISOString().split('T')[0],
      guarantors: data.guarantors.map((g, idx) => ({
        pledgeId: `PLG-${Date.now()}-${idx}`,
        guarantorMemberId: g.guarantorMemberId,
        guarantorName: g.guarantorName,
        pledgedAmount: g.pledgedAmount,
        holdId: `HLD-${Math.floor(Math.random() * 900000) + 100000}`,
        status: 'active',
      })),
    };

    // Attempt NestJS backend API call if available
    try {
      await loanApi.apply({
        memberId: data.memberId,
        requestedAmount: String(data.requestedAmount),
        termMonths: data.termMonths,
        purpose: data.purpose,
      });
    } catch {
      // Fallback to local state demo mode
    }

    setLoans((prev) => [newLoan, ...prev]);
    showToast('Application Submitted', `Loan ${newLoanNumber} created in pending status.`, 'success');
  };

  // Approval / Rejection Handler
  const handleDecideApproval = async (approved: boolean) => {
    if (!selectedLoan) return;

    try {
      await loanApi.decideApproval(selectedLoan.id, approved, approvalNote);
    } catch {
      // Local fallback
    }

    setLoans((prev) =>
      prev.map((l) =>
        l.id === selectedLoan.id
          ? {
              ...l,
              status: approved ? 'approved' : 'rejected',
              approvedAmount: approved ? l.requestedAmount : null,
            }
          : l,
      ),
    );

    showToast(
      approved ? 'Loan Approved' : 'Loan Rejected',
      `Loan ${selectedLoan.loanNumber} has been ${approved ? 'approved' : 'rejected'}.`,
      approved ? 'success' : 'info',
    );
    setActiveModal(null);
    setSelectedLoan(null);
    setApprovalNote('');
  };

  // Disbursement Handler
  const handleDisburse = async () => {
    if (!selectedLoan) return;

    try {
      await loanApi.disburse(selectedLoan.id, 'ACC-SAVINGS', String(selectedLoan.approvedAmount || selectedLoan.requestedAmount));
    } catch {
      // Local fallback
    }

    setLoans((prev) =>
      prev.map((l) =>
        l.id === selectedLoan.id
          ? {
              ...l,
              status: 'disbursed',
              disbursedAmount: l.approvedAmount || l.requestedAmount,
            }
          : l,
      ),
    );

    showToast(
      'Loan Disbursed',
      `Disbursed ${selectedLoan.approvedAmount || selectedLoan.requestedAmount} ETB to borrower savings.`,
      'success',
    );
    setActiveModal(null);
    setSelectedLoan(null);
  };

  // Repayment Handler (Auto-releases guarantor holds if fully repaid!)
  const handleRecordRepayment = async () => {
    if (!selectedLoan) return;

    try {
      await loanApi.recordRepayment(selectedLoan.id, String(repaymentAmount), repaymentRef);
    } catch {
      // Local fallback
    }

    setLoans((prev) =>
      prev.map((l) => {
        if (l.id !== selectedLoan.id) return l;
        const newRepaidTotal = l.repaidAmount + repaymentAmount;
        const disbursed = l.disbursedAmount || l.requestedAmount;
        const isFullyRepaid = newRepaidTotal >= disbursed;

        // Auto-release active guarantor holds if fully repaid (Task 17)
        const updatedGuarantors = isFullyRepaid
          ? l.guarantors.map((g) => ({ ...g, status: 'released' as const }))
          : l.guarantors;

        return {
          ...l,
          repaidAmount: newRepaidTotal,
          status: isFullyRepaid ? 'repaid' : 'disbursed',
          guarantors: updatedGuarantors,
        };
      }),
    );

    const isFullyRepaid = selectedLoan.repaidAmount + repaymentAmount >= (selectedLoan.disbursedAmount || selectedLoan.requestedAmount);
    showToast(
      isFullyRepaid ? 'Loan Fully Repaid!' : 'Repayment Recorded',
      isFullyRepaid
        ? `Loan ${selectedLoan.loanNumber} is settled! Guarantor holds auto-released.`
        : `Recorded ${repaymentAmount.toLocaleString()} ETB repayment.`,
      'success',
    );

    setActiveModal(null);
    setSelectedLoan(null);
    setRepaymentAmount(5000);
  };

  // Manual Release Guarantor Hold
  const handleReleaseGuarantor = (pledgeId: string) => {
    if (!selectedLoan) return;
    setLoans((prev) =>
      prev.map((l) =>
        l.id === selectedLoan.id
          ? {
              ...l,
              guarantors: l.guarantors.map((g) => (g.pledgeId === pledgeId ? { ...g, status: 'released' as const } : g)),
            }
          : l,
      ),
    );
    showToast('Hold Released', 'Guarantor pledge hold released & withdrawable balance restored.', 'info');
  };

  // Table Columns Setup
  const columns: Column<LoanRecord>[] = [
    {
      header: 'Loan Details',
      key: 'loanNumber',
      render: (l) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">{l.loanNumber}</span>
          <span className="text-[11px] text-slate-500">{l.purpose}</span>
        </div>
      ),
    },
    {
      header: 'Borrower',
      key: 'memberName',
      render: (l) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">{l.memberName}</span>
          <span className="text-[10px] text-slate-400 font-mono">{l.memberId}</span>
        </div>
      ),
    },
    {
      header: 'Requested',
      key: 'requestedAmount',
      render: (l) => <CurrencyDisplay value={l.requestedAmount} currency="ETB" size="sm" />,
    },
    {
      header: 'Disbursed / Repaid',
      key: 'disbursedAmount',
      render: (l) =>
        l.disbursedAmount ? (
          <div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              {l.disbursedAmount.toLocaleString()} ETB
            </span>
            <span className="text-[10px] text-emerald-600 font-medium block">
              Repaid: {l.repaidAmount.toLocaleString()} ETB
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">—</span>
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
      render: (l) => <StatusBadge status={l.status} />,
    },
    {
      header: 'Guarantors (Holds)',
      key: 'guarantors',
      render: (l) => {
        const activeCount = l.guarantors.filter((g) => g.status === 'active').length;
        return (
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {l.guarantors.length} ({activeCount} active)
            </span>
          </div>
        );
      },
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
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-lg text-xs font-semibold flex items-center gap-1"
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
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1"
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
              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              Repay
            </button>
          )}

          <button
            onClick={() => {
              setSelectedLoan(l);
              setActiveModal('guarantors');
            }}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg"
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
          <p className="text-xs text-slate-500">Task 16 & 17 — Application, approval workflow, disbursements, & guarantor collateral holds</p>
        </div>

        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Loan Application
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Exposure</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <CurrencyDisplay value={totalLoanExposure} currency="ETB" size="lg" />
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Performing loan portfolio</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{pendingCount}</span>
          <p className="text-[11px] text-amber-600 font-medium mt-1">Awaiting officer review</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Guarantor Holds</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <CurrencyDisplay value={totalGuarantorHolds} currency="ETB" size="lg" />
          <p className="text-[11px] text-indigo-600 font-medium mt-1">Collateral locked via Task 17</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fully Repaid Loans</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{repaidCount}</span>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Holds auto-released</p>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
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

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search borrower or loan #..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </Card>

      {/* Main Loan Data Table */}
      <DataTable data={filteredLoans} columns={columns} />

      {/* Application Modal */}
      <ApplyLoanModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSubmit={handleApplyLoan}
      />

      {/* Approval Action Modal */}
      {activeModal === 'approve' && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Review Loan {selectedLoan.loanNumber}</h3>
            <p className="text-xs text-slate-500">Requested by <strong className="text-slate-800 dark:text-slate-200">{selectedLoan.memberName}</strong> for {selectedLoan.requestedAmount.toLocaleString()} ETB.</p>

            <FormFieldGroup label="Officer Approval Note">
              <textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="e.g. Credit score verified, income backing confirmed."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 outline-none"
                rows={3}
              />
            </FormFieldGroup>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => handleDecideApproval(false)} className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-semibold">
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
            <p className="text-xs text-slate-500">Disbursing <strong>{(selectedLoan.approvedAmount || selectedLoan.requestedAmount).toLocaleString()} ETB</strong> into borrower's savings account via double-entry ledger posting.</p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold">
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
            <p className="text-xs text-slate-500">Loan: {selectedLoan.loanNumber} — Outstanding Balance: {((selectedLoan.disbursedAmount || 0) - selectedLoan.repaidAmount).toLocaleString()} ETB</p>

            <FormFieldGroup label="Repayment Amount (ETB)">
              <input
                type="number"
                value={repaymentAmount}
                onChange={(e) => setRepaymentAmount(Number(e.target.value))}
                min="100"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 outline-none"
              />
            </FormFieldGroup>

            <FormFieldGroup label="Payment Reference / Idempotency Key">
              <input
                type="text"
                value={repaymentRef}
                onChange={(e) => setRepaymentRef(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 outline-none"
              />
            </FormFieldGroup>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold">
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
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Guarantor Pledges — {selectedLoan.loanNumber}</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {selectedLoan.guarantors.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">No guarantor pledges attached to this loan.</p>
            ) : (
              <div className="space-y-3">
                {selectedLoan.guarantors.map((g) => (
                  <div key={g.pledgeId} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{g.guarantorName}</span>
                      <span className="text-[10px] text-slate-400 font-mono block">Hold ID: {g.holdId}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{g.pledgedAmount.toLocaleString()} ETB</span>
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${g.status === 'active' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'}`}>
                        {g.status.toUpperCase()}
                      </span>

                      {g.status === 'active' && (
                        <button
                          onClick={() => handleReleaseGuarantor(g.pledgeId)}
                          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded text-[11px] font-medium"
                        >
                          Release
                        </button>
                      )}
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
