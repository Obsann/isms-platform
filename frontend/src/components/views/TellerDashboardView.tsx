'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import CurrencyDisplay from '@/components/currency/CurrencyDisplay';
import StatusBadge from '@/components/badges/StatusBadge';
import DataTable, { Column } from '@/components/tables/DataTable';
import {
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Users,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
  Receipt,
} from 'lucide-react';
import { useAuthUser } from '@/components/auth/useAuthUser';

interface ActivityItem {
  id: string;
  time: string;
  type: 'deposit' | 'withdrawal' | 'loan-repayment';
  accountNo: string;
  member: string;
  amount: string;
  status: 'completed' | 'pending';
}

const recentActivity: ActivityItem[] = [
  { id: 'TXN-9012', time: '14:15 PM', type: 'deposit', accountNo: 'SAV-849201-1029', member: 'Abebe Bikila', amount: '15,000.00', status: 'completed' },
  { id: 'TXN-9011', time: '13:50 PM', type: 'withdrawal', accountNo: 'SAV-448102-3920', member: 'Tigist Assefa', amount: '5,000.00', status: 'completed' },
  { id: 'TXN-9010', time: '13:22 PM', type: 'loan-repayment', accountNo: 'LN-2026-881920', member: 'Kassahun Tadesse', amount: '25,000.00', status: 'completed' },
  { id: 'TXN-9009', time: '12:05 PM', type: 'deposit', accountNo: 'SAV-119283-4819', member: 'Hirut Bekele', amount: '50,000.00', status: 'completed' },
  { id: 'TXN-9008', time: '11:30 AM', type: 'withdrawal', accountNo: 'SAV-992810-5512', member: 'Yonas Gebremedhin', amount: '2,500.00', status: 'completed' },
];

export default function TellerDashboardView() {
  const authUser = useAuthUser();

  const activityColumns: Column<ActivityItem>[] = [
    {
      key: 'id',
      header: 'Reference',
      render: (item) => <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">{item.id}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (item) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
          item.type === 'deposit'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : item.type === 'withdrawal'
            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
        }`}>
          {item.type === 'deposit' && <ArrowDownLeft className="w-3 h-3" />}
          {item.type === 'withdrawal' && <ArrowUpRight className="w-3 h-3" />}
          {item.type === 'loan-repayment' && <Receipt className="w-3 h-3" />}
          <span>{item.type.replace('-', ' ')}</span>
        </span>
      ),
    },
    {
      key: 'member',
      header: 'Member / Account',
      render: (item) => (
        <div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{item.member}</p>
          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{item.accountNo}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount (ETB)',
      align: 'right',
      render: (item) => (
        <CurrencyDisplay
          value={item.amount}
          currency="ETB"
          size="sm"
          colorCode={item.type === 'deposit' ? 'positive' : item.type === 'withdrawal' ? 'negative' : 'neutral'}
        />
      ),
    },
    {
      key: 'time',
      header: 'Time',
      align: 'center',
      render: (item) => <span className="text-xs text-slate-500 font-mono">{item.time}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Landmark className="w-4 h-4" />
            <span>Teller Operations</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {authUser?.fullName ?? 'Teller'}
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Over-the-counter cash deposits, member withdrawals, and loan repayments workstation.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/teller/desk"
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-colors flex items-center gap-2 shadow-lg"
          >
            <CreditCard className="w-4 h-4" />
            <span>Open Teller Desk</span>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deposits Posted</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            </div>
            <CurrencyDisplay value="125,400.00" currency="ETB" size="lg" colorCode="positive" />
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              18 posted transactions today
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Withdrawals Paid</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <CurrencyDisplay value="42,800.00" currency="ETB" size="lg" colorCode="negative" />
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              12 withdrawals fulfilled today
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loan Repayments</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <CurrencyDisplay value="85,000.00" currency="ETB" size="lg" />
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
              6 repayments processed today
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teller Till Status</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">Balanced &amp; Active</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Till ID: TL-04 • Branch 01</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group">
          <CardHeader>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <CardTitle>Member Savings Deposit</CardTitle>
            <CardDescription>Post instant deposits to active savings accounts with real-time balance update.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/teller/desk"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Go to Deposit Workstation</span>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-rose-300 dark:hover:border-rose-700 transition-all group">
          <CardHeader>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <CardTitle>Member Cash Withdrawal</CardTitle>
            <CardDescription>Process available balance cash payouts after collateral hold verification.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/teller/desk"
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Go to Withdrawal Workstation</span>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group">
          <CardHeader>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <CardTitle>Loan Repayment Posting</CardTitle>
            <CardDescription>Credit repayments against disbursed loans with automatic status updates.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/teller/desk"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
            >
              <CreditCard className="w-4 h-4" />
              <span>Go to Repayment Workstation</span>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <DataTable
        data={recentActivity}
        columns={activityColumns}
        keyExtractor={(item) => item.id}
        title="Today's Posted Transactions"
        description="Chronological log of transactions processed in your active teller session."
        defaultPageSize={5}
      />
    </div>
  );
}
