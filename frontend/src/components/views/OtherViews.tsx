'use client';

import React from "react";
import { FolderOpen, Landmark, CreditCard, FileBarChart2, Share2 } from "lucide-react";

export function TransactionsView() {
  return (
    <div className="bg-[#23242a] border border-[#2e303a] rounded-2xl p-6 shadow-md space-y-4 text-white">
      <div className="flex items-center gap-3 border-b border-[#2e303a] pb-4">
        <FolderOpen className="w-6 h-6 text-sky-400" />
        <div>
          <h2 className="text-lg font-bold">Transaction Ledger</h2>
          <p className="text-xs text-[#8e95a5]">Detailed audit record of all member deposits, transfers &amp; withdrawals.</p>
        </div>
      </div>
      <div className="p-8 text-center text-xs text-[#717888]">
        No transaction filters applied. System operating normally.
      </div>
    </div>
  );
}

export function LoansView() {
  return (
    <div className="bg-[#23242a] border border-[#2e303a] rounded-2xl p-6 shadow-md space-y-4 text-white">
      <div className="flex items-center gap-3 border-b border-[#2e303a] pb-4">
        <Landmark className="w-6 h-6 text-purple-400" />
        <div>
          <h2 className="text-lg font-bold">Loan Portfolio</h2>
          <p className="text-xs text-[#8e95a5]">Active credit lines, repayment schedules and collateral records.</p>
        </div>
      </div>
      <div className="p-8 text-center text-xs text-[#717888]">
        347 Active Loans · 0 Default Alerts
      </div>
    </div>
  );
}

export function AccountsView() {
  return (
    <div className="bg-[#23242a] border border-[#2e303a] rounded-2xl p-6 shadow-md space-y-4 text-white">
      <div className="flex items-center gap-3 border-b border-[#2e303a] pb-4">
        <CreditCard className="w-6 h-6 text-emerald-400" />
        <div>
          <h2 className="text-lg font-bold">Sacco Accounts</h2>
          <p className="text-xs text-[#8e95a5]">Institutional bank accounts, vault balances and reserve funds.</p>
        </div>
      </div>
      <div className="p-8 text-center text-xs text-[#717888]">
        CBE Vault Account: 48,205,000.00 ETB
      </div>
    </div>
  );
}

export function ReportsView() {
  return (
    <div className="bg-[#23242a] border border-[#2e303a] rounded-2xl p-6 shadow-md space-y-4 text-white">
      <div className="flex items-center gap-3 border-b border-[#2e303a] pb-4">
        <FileBarChart2 className="w-6 h-6 text-amber-400" />
        <div>
          <h2 className="text-lg font-bold">Financial Reports</h2>
          <p className="text-xs text-[#8e95a5]">Generated P&amp;L, Balance Sheets, Audit Statements &amp; Regulatory Returns.</p>
        </div>
      </div>
      <div className="p-8 text-center text-xs text-[#717888]">
        Q2 2026 Audit Report Ready for Download
      </div>
    </div>
  );
}

export function SocialView() {
  return (
    <div className="bg-[#23242a] border border-[#2e303a] rounded-2xl p-6 shadow-md space-y-4 text-white">
      <div className="flex items-center gap-3 border-b border-[#2e303a] pb-4">
        <Share2 className="w-6 h-6 text-cyan-400" />
        <div>
          <h2 className="text-lg font-bold">Member Community</h2>
          <p className="text-xs text-[#8e95a5]">Community broadcasts, General Assembly announcements &amp; voting notices.</p>
        </div>
      </div>
      <div className="p-8 text-center text-xs text-[#717888]">
        Annual Sacco General Meeting scheduled for August 30, 2026.
      </div>
    </div>
  );
}
