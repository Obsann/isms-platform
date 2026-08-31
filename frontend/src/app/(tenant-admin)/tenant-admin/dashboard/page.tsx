'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users, PiggyBank, TrendingUp, BarChart3, Building2, CheckCircle2,
  AlertCircle, RefreshCw, Loader2, FileText, Settings, ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { getSessionUser, getSavingsSummaryReport, getLoanPortfolioReport, type ReportingSummary } from '@/lib/api-client';

function fmtETB(value: number): string {
  if (value >= 1_000_000) return `ETB ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `ETB ${(value / 1_000).toFixed(1)}K`;
  return `ETB ${value.toLocaleString()}`;
}

export default function TenantAdminDashboardPage() {
  const [userName, setUserName] = useState<string | null>(null);
  const [loadingKpi, setLoadingKpi] = useState(true);
  const [kpiError, setKpiError] = useState<string | null>(null);
  const [savings, setSavings] = useState<ReportingSummary | null>(null);
  const [loans, setLoans] = useState<ReportingSummary | null>(null);

  useEffect(() => {
    const u = getSessionUser();
    if (u) setUserName(u.fullName ?? null);

    async function loadKpis() {
      setLoadingKpi(true);
      setKpiError(null);
      try {
        const [sav, loan] = await Promise.all([
          getSavingsSummaryReport(),
          getLoanPortfolioReport(),
        ]);
        setSavings(sav);
        setLoans(loan);
      } catch (err: unknown) {
        setKpiError(err instanceof Error ? err.message : 'Failed to load dashboard metrics.');
      } finally {
        setLoadingKpi(false);
      }
    }
    loadKpis();
  }, []);

  const totalMembers   = savings?.memberCount ?? 0;
  const totalSavings   = parseFloat(savings?.totalSavings ?? '0');
  const totalShares    = parseFloat(savings?.totalShares ?? '0');
  const totalLoans     = parseFloat(loans?.totalLoansOutstanding ?? '0');
  const activeBorrowers = loans?.activeMemberCount ?? 0;
  const loansInArrears  = loans?.loansInArrears ?? 0;
  const repaymentRate   = activeBorrowers > 0
    ? (((activeBorrowers - loansInArrears) / activeBorrowers) * 100).toFixed(1)
    : null;

  const KPI_CARDS = [
    { label: 'Total Members',    value: totalMembers.toLocaleString(),                    sub: 'Registered members',          icon: <Users className="w-5 h-5" />,       accent: 'bg-blue-500'   },
    { label: 'Total Savings',    value: fmtETB(totalSavings),                             sub: 'Across all savings accounts', icon: <PiggyBank className="w-5 h-5" />,   accent: 'bg-emerald-500'},
    { label: 'Share Capital',    value: fmtETB(totalShares),                              sub: 'Total share holdings',        icon: <BarChart3 className="w-5 h-5" />,   accent: 'bg-sky-500'    },
    { label: 'Loan Portfolio',   value: fmtETB(totalLoans),                               sub: 'Outstanding principal',       icon: <TrendingUp className="w-5 h-5" />,  accent: 'bg-amber-500'  },
    { label: 'Active Borrowers', value: activeBorrowers.toLocaleString(),                 sub: 'Disbursed loans',             icon: <Building2 className="w-5 h-5" />,   accent: 'bg-violet-500' },
    { label: 'Repayment Rate',   value: repaymentRate ? `${repaymentRate}%` : 'N/A',      sub: 'Performing vs total',         icon: <CheckCircle2 className="w-5 h-5" />, accent: 'bg-rose-500'   },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page Header */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gold mb-1">
          Tenant Admin
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Executive Dashboard
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
          {userName ? `Welcome back, ${userName}` : 'Welcome back'} — here is your SACCO at a glance.
        </p>
      </div>

      {/* KPI Error Banner */}
      {kpiError && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>Could not load metrics: {kpiError}</span>
          <button
            onClick={() => window.location.reload()}
            className="ml-auto px-3 py-1 bg-rose-100 dark:bg-rose-900/50 rounded-lg text-xs font-bold hover:bg-rose-200 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {KPI_CARDS.map((card) => (
          <Card key={card.label} className="relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: undefined }} />
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {card.label}
                </span>
                <div className={`p-2 rounded-lg ${card.accent}/10 text-slate-600 dark:text-slate-300`}>
                  {card.icon}
                </div>
              </div>
              {loadingKpi ? (
                <div className="h-8 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1" />
              ) : (
                <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">
                  {card.value}
                </div>
              )}
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{card.sub}</p>
              {loadingKpi && (
                <div className="flex items-center gap-1 mt-2">
                  <Loader2 className="w-3 h-3 animate-spin text-gold" />
                  <span className="text-[10px] text-slate-400">Loading…</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Loan applications awaiting officer review</CardDescription>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                Live when Task 16 merges
              </span>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Loan approvals queue</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                  Will populate automatically once the loans approval endpoint is active.
                </p>
                <Link
                  href="/tenant-admin/loans"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:text-amber-600 transition-colors"
                >
                  View Loans <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Recent Transactions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Transaction history</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Wired via teller deposit/withdrawal endpoints.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Financial Reports', href: '/tenant-admin/reports', icon: <FileText className="w-4 h-4" /> },
                { label: 'Manage Members',    href: '/tenant-admin/members', icon: <Users className="w-4 h-4" />    },
                { label: 'Portal Settings',   href: '/tenant-admin/settings', icon: <Settings className="w-4 h-4" />},
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

          {/* Refresh */}
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh metrics
          </button>
        </div>
      </div>
    </div>
  );
}



