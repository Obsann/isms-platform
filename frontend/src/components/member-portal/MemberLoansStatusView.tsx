'use client';

import { useCallback, useEffect, useState } from 'react';
import { Landmark } from 'lucide-react';
import { ApiRequestError } from '@/lib/api-client';
import {
  getMemberLoans,
  type MemberLoanSummary,
  type MemberLoansView,
} from '@/lib/api-client/member-self-service';
import ApplyLoanModal, { type ApplyLoanFormData } from '@/components/forms/ApplyLoanModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CurrencyDisplay } from '@/components/currency/CurrencyDisplay';
import { StatusBadge, type StatusType } from '@/components/badges/StatusBadge';
import { loanApi } from '@/lib/loanApi';
import type { Member } from '@/types';

function loanBadge(status: string): { status: StatusType; label: string } {
  const normalized = status.replace(/_/g, '-').toLowerCase();
  if (normalized === 'approved') return { status: 'approved', label: 'Approved' };
  if (normalized === 'rejected') return { status: 'rejected', label: 'Rejected' };
  if (normalized === 'disbursed') return { status: 'disbursed', label: 'Disbursed' };
  if (normalized === 'repaying') return { status: 'repaying', label: 'Repaying' };
  if (normalized === 'repaid' || normalized === 'closed') return { status: 'repaid', label: status };
  if (normalized === 'defaulted') return { status: 'failed', label: 'Defaulted' };
  if (normalized === 'pending' || normalized === 'pending-approval') return { status: 'pending', label: 'Pending approval' };
  return { status: 'pending', label: status };
}

function LoanCard({ loan }: { loan: MemberLoanSummary }) {
  const badge = loanBadge(loan.status);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono text-sm">{loan.loanNumber}</CardTitle>
        <StatusBadge status={badge.status} label={badge.label} size="sm" />
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <p className="font-bold uppercase tracking-wider text-slate-500">Requested</p>
          <div className="mt-1">
            <CurrencyDisplay amount={loan.requestedAmount} size="md" />
          </div>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wider text-slate-500">Approved</p>
          <div className="mt-1">
            {loan.approvedAmount ? (
              <CurrencyDisplay amount={loan.approvedAmount} size="md" />
            ) : (
              <span className="text-slate-500">Not yet approved</span>
            )}
          </div>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wider text-slate-500">Disbursed</p>
          <div className="mt-1">
            {loan.disbursedAmount ? (
              <CurrencyDisplay amount={loan.disbursedAmount} size="md" />
            ) : (
              <span className="text-slate-500">Not disbursed</span>
            )}
          </div>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wider text-slate-500">Term</p>
          <p className="mt-1 font-medium">{loan.termMonths} months</p>
        </div>
        <div className="sm:col-span-2">
          <p className="font-bold uppercase tracking-wider text-slate-500">Purpose</p>
          <p className="mt-1 font-medium">{loan.purpose || '—'}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="font-bold uppercase tracking-wider text-slate-500">Applied</p>
          <p className="mt-1 font-medium">{new Date(loan.appliedAt).toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MemberLoansStatusView({ member }: { member: Member }) {
  const [data, setData] = useState<MemberLoansView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadLoans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const view = await getMemberLoans(member.id);
      setData(view);
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not load your loans.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [member.id]);

  useEffect(() => {
    void loadLoans();
  }, [loadLoans]);

  const handleApplyLoan = async (form: ApplyLoanFormData) => {
    if (form.memberId !== member.id) {
      throw new Error('You can only apply for a loan on your own membership.');
    }
    const created = await loanApi.apply({
      memberId: member.id,
      requestedAmount: String(form.requestedAmount),
      termMonths: form.termMonths,
      purpose: form.purpose || undefined,
    });
    setSuccessMsg(
      `Loan ${created.loanNumber} submitted. Status is pending — a loan officer or tenant admin will review it.`,
    );
    setApplyOpen(false);
    await loadLoans();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {member.fullName} · {member.memberNumber}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Apply here; approval and disbursement are done by SACCO staff (loan officer / tenant admin).
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSuccessMsg(null);
            setApplyOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-midnight text-gold hover:bg-midnight-light dark:bg-gold dark:text-midnight dark:hover:bg-gold-light shadow-sm shrink-0"
        >
          <Landmark className="w-3.5 h-3.5" />
          Apply for loan
        </button>
      </div>

      {successMsg && (
        <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-3">
          {successMsg}
        </p>
      )}

      {error && (
        <p className="text-sm font-semibold text-rose-600" role="alert">
          {error}
        </p>
      )}

      {loading && !data && (
        <p className="text-sm text-slate-600 dark:text-slate-400" role="status">
          Loading loan status…
        </p>
      )}

      {!loading && data && data.loans.length === 0 && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          You have no loan applications yet. Use <strong>Apply for loan</strong> to submit one.
        </p>
      )}

      {data && data.loans.length > 0 && (
        <div className="space-y-3">
          {data.loans.map((loan) => (
            <LoanCard key={loan.loanId} loan={loan} />
          ))}
        </div>
      )}

      <ApplyLoanModal
        isOpen={applyOpen}
        onClose={() => setApplyOpen(false)}
        onSubmit={handleApplyLoan}
        members={[member]}
        lockedMemberId={member.id}
        allowGuarantors={false}
      />
    </div>
  );
}
