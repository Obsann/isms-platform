'use client';

import React from "react";
import { MemberRecord } from "@/types/dashboard";
import { formatETB } from "@/lib/utils";

interface MemberPortalViewProps {
  members: MemberRecord[];
}

export function MemberPortalView({ members }: MemberPortalViewProps) {
  return (
    <div className="space-y-4 text-white">
      <div className="bg-[#23242a] border border-[#2e303a] rounded-2xl p-6 shadow-md">
        <h2 className="text-lg font-bold text-sky-400">Member Directory View</h2>
        <p className="text-xs text-[#8e95a5] mt-1">Detailed directory of all enrolled Sacco members and account balances.</p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {members.map((m) => (
            <div key={m.id} className="p-3.5 bg-[#1c1d22] border border-[#2e303a] rounded-xl flex items-center gap-3">
              <img src={m.avatar} alt={m.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-xs text-white truncate">{m.name}</p>
                <p className="text-[10px] text-[#717888] font-mono">{m.memberId}</p>
                <p className="text-xs font-bold text-sky-400 mt-0.5">{formatETB(m.savingAmount)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MemberPortalView;
