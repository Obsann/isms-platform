import React from "react";
import { cn } from "@/lib/utils";

export type StatusType =
  | "active"
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "inactive";

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const statusConfig: Record<StatusType, { styles: string; dot: string }> = {
  active:    { styles: "bg-emerald-50 text-emerald-800 border-emerald-200 ring-emerald-100",  dot: "bg-emerald-500" },
  approved:  { styles: "bg-gold-muted text-amber-800 border-amber-200 ring-amber-100",        dot: "bg-gold" },
  completed: { styles: "bg-midnight text-amber-300 border-amber-500/30 ring-midnight/10",     dot: "bg-gold-light" },
  pending:   { styles: "bg-amber-50 text-amber-700 border-amber-200 ring-amber-50",           dot: "bg-amber-400" },
  rejected:  { styles: "bg-rose-50 text-rose-700 border-rose-200 ring-rose-50",              dot: "bg-rose-500" },
  inactive:  { styles: "bg-slate-50 text-slate-500 border-slate-200 ring-slate-50",          dot: "bg-slate-400" },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className }) => {
  const displayLabel = label ?? (status.charAt(0).toUpperCase() + status.slice(1));
  const { styles, dot } = statusConfig[status] ?? statusConfig.inactive;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide border ring-1 ring-inset transition-colors select-none",
        styles,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dot)} />
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
