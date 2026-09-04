'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FileText, Landmark, Smartphone, Wallet } from 'lucide-react';
import { ApiRequestError } from '@/lib/api-client';
import { getMemberBalance, getMemberLoans } from '@/lib/api-client/member-self-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CurrencyDisplay } from '@/components/currency/CurrencyDisplay';
import { addAmounts } from '@/lib/money';
import type { Member } from '@/types';

const LINKS = [
  {
    href: '/member/balance',
    label: 'Balance',
    detail: 'Live savings and share figures from the ledger.',
    icon: Wallet,
  },
  {
    href: '/member/statement',
    label: 'Statement',
    detail: 'Request a date-range posting history.',
    icon: FileText,
  },
  {
    href: '/member/loans',
    label: 'Loan status',
    detail: 'See applications, approvals, and disbursements.',
    icon: Landmark,
  },
  {
    href: '/member/mobile-money',
    label: 'Mobile money',
    detail: 'Deposit or withdraw savings through Chapa.',
    icon: Smartphone,
  },
] as const;

export default function MemberDashboardView({ member }: { member: Member }) {
  const [available, setAvailable] = useState<string | null>(null);
  const [loanCount, setLoanCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMemberBalance(member.id), getMemberLoans(member.id)])
      .then(([balance, loans]) => {
        if (cancelled) return;
        const total = balance.accounts.reduce(
          (sum, account) => addAmounts(sum, account.availableBalance),
          '0.00',
        );
        setAvailable(total);
        setLoanCount(loans.status === 'available' ? loans.loans.length : 0);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiRequestError ? err.message : 'Could not load dashboard figures.');
      });
    return () => {
      cancelled = true;
    };
  }, [member.id]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-600 dark:text-slate-400">
        {member.fullName} · {member.memberNumber}
      </p>

      {error && (
        <p className="text-sm font-semibold text-rose-600" role="alert">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <CardHeader>
            <CardTitle>Available savings</CardTitle>
          </CardHeader>
          <CardContent>
            {available ? <CurrencyDisplay amount={available} size="xl" colorCode="positive" /> : (
              <p className="text-sm text-slate-500">Loading…</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Loans on file</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {loanCount === null ? '—' : loanCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:border-gold/80 transition-all"
          >
            <div className="flex items-start justify-between">
              <span className="w-10 h-10 rounded-lg bg-amber-500/10 dark:bg-gold/15 text-amber-800 dark:text-gold flex items-center justify-center border border-amber-500/20 dark:border-gold/30">
                <item.icon className="w-5 h-5" />
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                Open
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
            <h2 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">{item.label}</h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.detail}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
