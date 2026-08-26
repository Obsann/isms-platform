'use client';

import React, { useState } from "react";
import { Search, X, Command, ArrowRight } from "lucide-react";
import { MemberRecord } from "@/types/dashboard";
import { navItems } from "@/components/layout/Sidebar";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberRecord[];
  onSelectNav?: (navId: string) => void;
}

export function SearchModal({
  isOpen,
  onClose,
  members,
  onSelectNav,
}: SearchModalProps) {
  const [query, setQuery] = useState("");

  if (!isOpen) return null;

  const filteredNav = navItems.filter((n) =>
    n.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.memberId.toLowerCase().includes(query.toLowerCase()) ||
      m.status.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#1c1d22] border border-[#2e303a] rounded-2xl shadow-2xl overflow-hidden z-10 text-[#e2e8f0]">
        {/* Search input bar */}
        <div className="p-3.5 sm:p-4 border-b border-[#282a32] flex items-center gap-3 bg-[#23242a]">
          <Search className="w-4 h-4 text-sky-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Sacco dashboards, members, IDs..."
            className="w-full bg-transparent text-sm text-white placeholder-[#6c7486] focus:outline-hidden"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#717888] hover:text-white hover:bg-[#282a32] transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-3.5 space-y-4 text-xs">
          {/* Navigation Items */}
          {filteredNav.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#717888] px-2 mb-1.5">
                Navigation
              </p>
              <div className="space-y-1">
                {filteredNav.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (onSelectNav) onSelectNav(n.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#23242a] text-left group transition-colors"
                  >
                    <span className="font-medium text-white group-hover:text-sky-400">
                      {n.label}
                    </span>
                    <ArrowRight className="w-3 h-3 text-[#717888] group-hover:text-white" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Members */}
          {filteredMembers.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#717888] px-2 mb-1.5">
                Member Records
              </p>
              <div className="space-y-1">
                {filteredMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[#23242a] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-[#282a32]">
                        <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="font-semibold text-white">{m.name}</span>
                        <span className="text-[10px] text-[#717888] ml-2 font-mono">({m.memberId})</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-amber-400 font-mono font-semibold">{m.savingAmount} ETB</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#282a32] bg-[#1a1b20] flex items-center justify-between text-[11px] text-[#717888]">
          <div className="flex items-center gap-2">
            <Command className="w-3 h-3" />
            <span>Type to search records</span>
          </div>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
}

export default SearchModal;
