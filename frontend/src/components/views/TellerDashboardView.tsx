'use client';

/**
 * frontend/src/components/views/TellerDashboardView.tsx
 *
 * Compact, professional Teller Dashboard workstation overview and quick actions.
 */

import React from 'react';
import Link from 'next/link';
import {
  Receipt,
  Users,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  ArrowDownCircle,
  ArrowUpCircle,
  FileCheck2,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useAuthUser } from '@/components/auth/useAuthUser';
import { StatusBadge } from '@/components/badges/StatusBadge';

export function TellerDashboardView() {
  const user = useAuthUser();

  return (
    <div className="space-y-5">
      {/* Header (Cleaned up top-right, rebalanced) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-gold">
              Core Operations
            </span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Station #{user?.tenantId ?? 'default'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-serif mt-0.5">
            Teller Dashboard
          </h1>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
            Welcome back{user?.fullName ? `, ${user.fullName}` : ''}. Manage counter operations and member servicing.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <StatusBadge status="active" size="sm" label="Terminal Online" />
        </div>
      </div>

      {/* Quick Action Cards (Compact 2-col) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/teller/desk"
          className="group block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm hover:border-gold/80 dark:hover:border-gold/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <div className="flex items-start justify-between">
            <span className="w-10 h-10 rounded-lg bg-amber-500/10 dark:bg-gold/15 text-amber-800 dark:text-gold flex items-center justify-center shrink-0 border border-amber-500/20 dark:border-gold/30">
              <Receipt className="w-5 h-5" />
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-800 dark:group-hover:text-gold transition-colors">
              <span>Open Desk</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div className="mt-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-800 dark:group-hover:text-gold transition-colors">
              Teller Desk
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
              Account lookup, cash deposits, verified withdrawals, and loan repayments with instant ledger reconciliation.
            </p>
          </div>
        </Link>

        <Link
          href="/teller/members"
          className="group block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm hover:border-blue-500/80 dark:hover:border-blue-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <div className="flex items-start justify-between">
            <span className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
              <span>Directory</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div className="mt-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
              Members Directory
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
              Browse registered member profiles, verify national identity details, check account KYC and statuses.
            </p>
          </div>
        </Link>
      </div>

      {/* Operational Workflows (Compact 3-col) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 text-xs font-bold">
            <ArrowDownCircle className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>Cash Deposits</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Optimistic balance increment with authoritative server ledger posting.
          </p>
          <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
            Real-time posting
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-400 text-xs font-bold">
            <ArrowUpCircle className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
            <span>Cash Withdrawals</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Strict available balance validation preventing hold violations.
          </p>
          <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
            Hold protected
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400 text-xs font-bold">
            <CreditCard className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
            <span>Loan Repayments</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Active loan contract lookup with instant receipt confirmations.
          </p>
          <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
            Contract tracked
          </span>
        </div>
      </div>

      {/* Operational Protocol & Security */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SOP Checklist */}
        <Card>
          <CardHeader className="py-2.5 px-4">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-amber-700 dark:text-gold shrink-0" />
              <CardTitle className="text-sm">Daily Operating Protocol</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                  1
                </span>
                <span className="truncate font-medium">Verify member identity &amp; account</span>
              </li>
              <li className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                  2
                </span>
                <span className="truncate font-medium">Count cash prior to posting</span>
              </li>
              <li className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                  3
                </span>
                <span className="truncate font-medium">Confirm receipt reference code</span>
              </li>
              <li className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                  4
                </span>
                <span className="truncate font-medium">Lock workstation when idle</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Ledger Integrity Note */}
        <Card>
          <CardHeader className="py-2.5 px-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <CardTitle className="text-sm">Ledger Security &amp; Precision</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex flex-col justify-between gap-3 text-xs">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              All transactions enforce double-entry ledger rules using exact minor-unit (cents) arithmetic, automatic failure rollbacks, and tenant isolation.
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              <span>Currency: <strong className="text-slate-900 dark:text-slate-100">ETB</strong></span>
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Encrypted Session
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TellerDashboardView;
