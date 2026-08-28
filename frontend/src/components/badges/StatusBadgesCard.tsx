'use client';

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface StatusBadgeItem {
  id: string;
  label: string;
  textColor: string;
  bgGradient: string;
  borderColor: string;
}

const statusBadgesList: StatusBadgeItem[] = [
  {
    id: "Pending",
    label: "Pending",
    textColor: "text-[#eab308]",
    bgGradient: "bg-[#292113]",
    borderColor: "border-[#4d3b14]",
  },
  {
    id: "Active / Verified",
    label: "Active / Verified",
    textColor: "text-[#22c55e]",
    bgGradient: "bg-[#13261a]",
    borderColor: "border-[#1d4d33]",
  },
  {
    id: "In Review",
    label: "In Review",
    textColor: "text-[#c084fc]",
    bgGradient: "bg-[#241830]",
    borderColor: "border-[#482a63]",
  },
  {
    id: "Approved",
    label: "Approved",
    textColor: "text-[#f59e0b]",
    bgGradient: "bg-[#2a1d12]",
    borderColor: "border-[#563515]",
  },
  {
    id: "Rejected",
    label: "Rejected",
    textColor: "text-[#ef4444]",
    bgGradient: "bg-[#281417]",
    borderColor: "border-[#521a22]",
  },
  {
    id: "Inactive",
    label: "Inactive",
    textColor: "text-[#e2e8f0] dark:text-[#94a3b8]",
    bgGradient: "bg-[#1c2028]",
    borderColor: "border-[#2e3745]",
  },
];

interface StatusBadgesCardProps {
  onSelectStatusFilter?: (status: string | null) => void;
  selectedStatus?: string | null;
}

export function StatusBadgesCard({
  onSelectStatusFilter,
  selectedStatus,
}: StatusBadgesCardProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleBadgeClick = (badge: StatusBadgeItem) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(badge.label);
    }
    setCopiedId(badge.id);
    if (onSelectStatusFilter) {
      onSelectStatusFilter(selectedStatus === badge.id ? null : badge.id);
    }
    setTimeout(() => setCopiedId(null), 1200);
  };

  return (
    <div
      id="status-badges-card"
      className="bg-[#23242a] border border-[#2e303a] rounded-2xl p-5 sm:p-6 shadow-md flex flex-col justify-between"
    >
      {/* Header with bright lime/green title */}
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-sm sm:text-base font-semibold text-[#4ade80] tracking-tight">
          Status Badges
        </h3>
        {copiedId && (
          <span className="text-[11px] text-[#4ade80] font-medium animate-pulse">
            Filter applied!
          </span>
        )}
      </div>

      {/* Grid of status badge buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1 content-start">
        {statusBadgesList.map((badge) => {
          const isSelected = selectedStatus === badge.id;

          return (
            <button
              key={badge.id}
              id={`badge-preview-${badge.id.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
              onClick={() => handleBadgeClick(badge)}
              className={cn(
                "group relative p-3 rounded-xl border text-center transition-all duration-150 cursor-pointer flex items-center justify-center h-14 focus:outline-hidden",
                badge.bgGradient,
                badge.borderColor,
                isSelected ? "ring-2 ring-white/70 shadow-lg scale-[1.02]" : "hover:border-white/30"
              )}
            >
              <span className={cn("text-xs font-semibold tracking-tight", badge.textColor)}>
                {badge.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default StatusBadgesCard;
