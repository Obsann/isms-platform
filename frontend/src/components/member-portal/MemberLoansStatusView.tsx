'use client';

import { useEffect, useState } from 'react';
import { ApiRequestError } from '@/lib/api-client';
import { getMemberLoans, type MemberLoanSummary, type MemberLoansView } from '@/lib/api-client/member-self-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CurrencyDisplay } from '@/components/currency/CurrencyDisplay';
import { StatusBadge, type StatusType } from '@/components/badges/StatusBadge';
import type { Member } from '@/types';

function loanBadge(status: string): { status: StatusType; label: string } {
  const normalized = status.replace(/_/g, '-').toLowerCase();
  if (normalized === 'approved') return { status: 'approved', label: 'Approved' };
  if (normalized === 'rejected') return { status: 'rejected', label: 'Rejected' };
  if (normalized === 'disbursed') return { status: 'disbursed', label: 'Disbursed' };
  if (normalized === 'repaying') return { status: 'repaying', label: 'Repaying' };
  if (normalized === 'repaid' || normalized === 'closed') return { status: 'repaid', label: status };
  if (normalized === 'defaulted') return { status: 'failed', label: 'Defaulted' };
  if (normalized === 'pending' || normalized === 'pending-approval') return { status: 'pending', label: 'Pending' };
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

  useEffect(() => {
    let cancelled = false;
    setError(null);
    getMemberLoans(member.id)
      .then((view) => {
        if (!cancelled) setData(view);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiRequestError ? err.message : 'Could not load your loans.');
      });
    return () => {
      cancelled = true;
    };
  }, [member.id]);

  if (error) {
    return (
      <p className="text-sm font-semibold text-rose-600" role="alert">
        {error}
      </p>
    );
  }

  if (!data) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-400" role="status">
        Loading loan status…
      </p>
    );
  }

  if (data.loans.length === 0) {
    return <p className="text-sm text-slate-600 dark:text-slate-400">You have no loan applications.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-600 dark:text-slate-400">
        {data.fullName} · {data.memberNumber}
      </p>
      {data.loans.map((loan) => (
        <LoanCard key={loan.loanId} loan={loan} />
      ))}
    </div>
  );
}
