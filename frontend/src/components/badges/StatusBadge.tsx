import React from "react";
import { cn } from "@/lib/utils";

export type StatusType =
  | "active"
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "inactive"
  | "compliant"
  | "non_compliant"
  | "high_risk"
  | "open"
  | "in_review"
  | "mitigated"
  | "accepted"
  | "under_maintenance"
  | "decommissioned"
  | "success"
  | "warning"
  | "failed"
  | "Compliant"
  | "Non-Compliant"
  | "High Risk"
  | "Pending"
  | (string & {});

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusConfig: Record<string, { styles: string; dot: string }> = {
  // Task 7 Core Statuses
  active:            { styles: "bg-emerald-50 text-emerald-800 border-emerald-200 ring-emerald-100",  dot: "bg-emerald-500" },
  approved:          { styles: "bg-gold-muted text-amber-900 border-amber-300 ring-amber-100",        dot: "bg-gold" },
  completed:         { styles: "bg-midnight text-amber-300 border-amber-500/30 ring-midnight/10",     dot: "bg-gold-light" },
  pending:           { styles: "bg-amber-50 text-amber-800 border-amber-200 ring-amber-50",           dot: "bg-amber-400" },
  Pending:           { styles: "bg-amber-50 text-amber-800 border-amber-200 ring-amber-50",           dot: "bg-amber-400" },
  rejected:          { styles: "bg-rose-50 text-rose-800 border-rose-200 ring-rose-50",              dot: "bg-rose-500" },
  inactive:          { styles: "bg-slate-50 text-slate-600 border-slate-200 ring-slate-50",          dot: "bg-slate-400" },

  // Compliance & Security Statuses
  compliant:         { styles: "bg-emerald-50 text-emerald-800 border-emerald-200 ring-emerald-100",  dot: "bg-emerald-500" },
  Compliant:         { styles: "bg-emerald-50 text-emerald-800 border-emerald-200 ring-emerald-100",  dot: "bg-emerald-500" },
  non_compliant:     { styles: "bg-rose-50 text-rose-800 border-rose-200 ring-rose-100",              dot: "bg-rose-500" },
  "Non-Compliant":   { styles: "bg-rose-50 text-rose-800 border-rose-200 ring-rose-100",              dot: "bg-rose-500" },
  high_risk:         { styles: "bg-amber-50 text-amber-900 border-amber-300 ring-amber-100",          dot: "bg-rose-600" },
  "High Risk":       { styles: "bg-amber-50 text-amber-900 border-amber-300 ring-amber-100",          dot: "bg-rose-600" },
  open:              { styles: "bg-blue-50 text-blue-800 border-blue-200 ring-blue-100",              dot: "bg-blue-500" },
  in_review:         { styles: "bg-indigo-50 text-indigo-800 border-indigo-200 ring-indigo-100",      dot: "bg-indigo-500" },
  mitigated:         { styles: "bg-teal-50 text-teal-800 border-teal-200 ring-teal-100",              dot: "bg-teal-500" },
  accepted:          { styles: "bg-slate-100 text-slate-800 border-slate-300 ring-slate-100",          dot: "bg-slate-500" },
  under_maintenance: { styles: "bg-amber-50 text-amber-800 border-amber-200 ring-amber-100",          dot: "bg-amber-500" },
  decommissioned:    { styles: "bg-slate-100 text-slate-500 border-slate-200 ring-slate-100",          dot: "bg-slate-400" },
  success:           { styles: "bg-emerald-50 text-emerald-800 border-emerald-200 ring-emerald-100",  dot: "bg-emerald-500" },
  warning:           { styles: "bg-amber-50 text-amber-800 border-amber-200 ring-amber-100",          dot: "bg-amber-500" },
  failed:            { styles: "bg-rose-50 text-rose-800 border-rose-200 ring-rose-100",              dot: "bg-rose-500" },
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-3 py-1 text-[11px]",
  lg: "px-3.5 py-1.5 text-xs",
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = "md",
  className,
}) => {
  const normalizedKey = String(status);
  const displayLabel =
    label ??
    (normalizedKey.includes("_")
      ? normalizedKey
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      : normalizedKey.charAt(0).toUpperCase() + normalizedKey.slice(1));

  const config = statusConfig[normalizedKey] ?? {
    styles: "bg-slate-50 text-slate-700 border-slate-200 ring-slate-50",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide border ring-1 ring-inset transition-colors select-none",
        config.styles,
        sizeStyles[size],
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />
      {displayLabel}
    </span>
  );
};

export default StatusBadge;

