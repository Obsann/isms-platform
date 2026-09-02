'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Users, PiggyBank, TrendingUp, BarChart3, Building2, CheckCircle2,
  AlertCircle, RefreshCw, Loader2, FileText, Settings, ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import CurrencyDisplay from '@/components/currency/CurrencyDisplay';
import {
  getSessionUser,
  getSavingsSummaryReport,
  getLoanPortfolioReport,
  getRecentTransactionsReport,
  getMembers,
  type ReportingSummary,
} from '@/lib/api-client';
import { loanApi, type LoanRow } from '@/lib/loanApi';
import type { Member, Transaction } from '@/types';
import { useLang } from '@/components/i18n';

export default function TenantAdminDashboardPage() {
  const { t } = useLang();
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savings, setSavings] = useState<ReportingSummary | null>(null);
  const [loans, setLoans] = useState<ReportingSummary | null>(null);
  const [pendingLoans, setPendingLoans] = useState<LoanRow[]>([]);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [membersById, setMembersById] = useState<Record<string, Member>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sav, loan, pending, txns, members] = await Promise.all([
        getSavingsSummaryReport(),
        getLoanPortfolioReport(),
        loanApi.list({ status: 'pending', limit: 8 }),
        getRecentTransactionsReport(8),
        getMembers({ limit: 100 }),
      ]);
      setSavings(sav);
      setLoans(loan);
      setPendingLoans(pending.items ?? []);
      setRecentTxns(txns);
      const map: Record<string, Member> = {};
      for (const member of members.items ?? []) {
        map[member.id] = member;
      }
      setMembersById(map);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const u = getSessionUser();
    if (u) setUserName(u.fullName ?? null);
    void load();
  }, [load]);

  const activeBorrowers = loans?.activeMemberCount ?? 0;
  const loansInArrears = loans?.loansInArrears ?? 0;
  const performing = Math.max(0, activeBorrowers - loansInArrears);
  const repaymentRate =
    activeBorrowers > 0 ? `${((performing / activeBorrowers) * 100).toFixed(1)}%` : 'N/A';

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gold mb-1">
          {t('dash.tenantEyebrow')}
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t('dash.tenantTitle')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
          {userName ? t('dash.tenantIntroNamed', { name: userName }) : t('dash.tenantIntro')}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>Could not load metrics: {error}</span>
          <button
            type="button"
            onClick={() => void load()}
            className="ml-auto px-3 py-1 bg-rose-100 dark:bg-rose-900/50 rounded-lg text-xs font-bold hover:bg-rose-200 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Total Members" sub="Registered members" icon={<Users className="w-5 h-5" />} loading={loading}>
          {(savings?.memberCount ?? 0).toLocaleString()}
        </KpiCard>
        <KpiCard label="Total Savings" sub="Across all savings accounts" icon={<PiggyBank className="w-5 h-5" />} loading={loading}>
          <CurrencyDisplay amount={savings?.totalSavings ?? '0.00'} size="xl" />
        </KpiCard>
        <KpiCard label="Share Capital" sub="Total share holdings" icon={<BarChart3 className="w-5 h-5" />} loading={loading}>
          <CurrencyDisplay amount={savings?.totalShares ?? '0.00'} size="xl" />
        </KpiCard>
        <KpiCard label="Loan Portfolio" sub="Outstanding principal" icon={<TrendingUp className="w-5 h-5" />} loading={loading}>
          <CurrencyDisplay amount={loans?.totalLoansOutstanding ?? '0.00'} size="xl" />
        </KpiCard>
        <KpiCard label="Active Borrowers" sub="Disbursed or defaulted loans" icon={<Building2 className="w-5 h-5" />} loading={loading}>
          {activeBorrowers.toLocaleString()}
        </KpiCard>
        <KpiCard label="Repayment Rate" sub="Performing vs active borrowers" icon={<CheckCircle2 className="w-5 h-5" />} loading={loading}>
          {repaymentRate}
        </KpiCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Loan applications awaiting review</CardDescription>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                {pendingLoans.length} pending
              </span>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-xs text-slate-500 py-6">Loading pending loans…</p>
              ) : pendingLoans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No pending applications</p>
                  <Link
                    href="/tenant-admin/loans"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:text-amber-600 transition-colors"
                  >
                    View loans <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingLoans.map((loan) => (
                    <li key={loan.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono">
                          {loan.loanNumber}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {membersById[loan.memberId]?.fullName ?? loan.memberId}
                        </p>
                      </div>
                      <CurrencyDisplay amount={loan.requestedAmount} size="sm" />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-xs text-slate-500 py-4">Loading…</p>
              ) : recentTxns.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">No postings yet.</p>
              ) : (
                <ul className="space-y-2">
                  {recentTxns.map((txn) => (
                    <li key={txn.id} className="flex items-center justify-between gap-2 text-xs">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{txn.type}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{txn.reference ?? txn.id.slice(0, 8)}</p>
                      </div>
                      <CurrencyDisplay amount={txn.amount} size="sm" />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Financial Reports', href: '/tenant-admin/reports', icon: <FileText className="w-4 h-4" /> },
                { label: 'Manage Members', href: '/tenant-admin/members', icon: <Users className="w-4 h-4" /> },
                { label: 'Portal Settings', href: '/tenant-admin/settings', icon: <Settings className="w-4 h-4" /> },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-200 transition-colors group"
                >
                  <span className="text-slate-400 dark:text-slate-500 group-hover:text-gold transition-colors">
                    {action.icon}
                  </span>
                  {action.label}
                  <ArrowRight className="w-3.5 h-3.5 ml-auto text-slate-300 dark:text-slate-600 group-hover:text-gold transition-colors" />
                </Link>
              ))}
            </CardContent>
          </Card>

          <button
            type="button"
            onClick={() => void load()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh metrics
          </button>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  sub,
  icon,
  loading,
  children,
}: {
  label: string;
  sub: string;
  icon: ReactNode;
  loading: boolean;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </span>
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {icon}
          </div>
        </div>
        {loading ? (
          <div className="h-8 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1" />
        ) : (
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">
            {children}
          </div>
        )}
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{sub}</p>
      </CardContent>
    </Card>
  );
}
