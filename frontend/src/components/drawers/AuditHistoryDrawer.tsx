'use client';

import React from "react";
import { X, ShieldAlert, CheckCircle2, Info, Clock, Filter, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockAuditTrail = [
  {
    id: "aud-1",
    action: "KYC Verification Cleared",
    actor: "Hirut Bekele (Branch Admin)",
    target: "Drew Cano (M-003)",
    timestamp: "10 mins ago",
    type: "success" as const,
    ip: "196.188.42.10",
  },
  {
    id: "aud-2",
    action: "Large Withdrawal Threshold Triggered",
    actor: "System Audit Bot",
    target: "Orlando Diggs (M-004) - 95,300 ETB",
    timestamp: "45 mins ago",
    type: "alert" as const,
    ip: "Internal Trigger",
  },
  {
    id: "aud-3",
    action: "Role Permission Alteration",
    actor: "ByeWind (Super Admin)",
    target: "Teller Station #3 Privileges",
    timestamp: "2 hours ago",
    type: "info" as const,
    ip: "196.188.40.12",
  },
  {
    id: "aud-4",
    action: "Exported Members Ledger (CSV)",
    actor: "Natali Craig (Manager)",
    target: "All Active Members (1,265)",
    timestamp: "5 hours ago",
    type: "info" as const,
    ip: "196.188.42.15",
  },
];

export function AuditHistoryDrawer({ isOpen, onClose }: AuditHistoryDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1c1d22] border-l border-[#282a32] h-full shadow-2xl flex flex-col justify-between z-10 text-[#e2e8f0]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#282a32] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Audit &amp; Activity History
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8e95a5] hover:text-white hover:bg-[#282a32] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {mockAuditTrail.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-[#23242a] border border-[#2e303a] hover:border-sky-500/40 transition-colors space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {item.type === "alert" && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
                  {item.type === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  {item.type === "info" && <Info className="w-3.5 h-3.5 text-sky-400" />}
                  <span className="font-semibold text-white truncate max-w-[200px]">{item.action}</span>
                </div>
                <span className="text-[10px] text-[#717888]">{item.timestamp}</span>
              </div>
              <p className="text-xs text-[#8e95a5]">{item.target}</p>
              <div className="flex items-center justify-between text-[10px] text-[#717888] pt-1 border-t border-[#2e303a]/60">
                <span>Actor: {item.actor}</span>
                <span>IP: {item.ip}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#282a32] bg-[#1a1b20] flex items-center justify-between text-xs text-[#717888]">
          <span>Full immutable audit ledger active</span>
          <button onClick={onClose} className="text-sky-400 font-semibold hover:underline">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuditHistoryDrawer;
