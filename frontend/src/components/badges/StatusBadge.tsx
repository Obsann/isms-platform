import React from "react";
import { cn } from "@/lib/utils";

export type StatusType =
  | "active"
  | "approved"
  | "completed"
  | "pending"
  | "Pending"
  | "rejected"
  | "inactive"
  | "disbursed"
  | "repaying"
  | "repaid"
  | "closed"
  | "compliant"
  | "Compliant"
  | "non_compliant"
  | "Non-Compliant"
  | "high_risk"
  | "High Risk"
  | "open"
  | "in_review"
  | "mitigated"
  | "accepted"
  | "under_maintenance"
  | "decommissioned"
  | "provisioning"
  | "suspended"
  | "success"
  | "warning"
  | "failed";

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusConfig: Record<string, { styles: string; dot: string }> = {
  // Core Statuses
  active:            { styles: "bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/80 ring-emerald-100 dark:ring-emerald-900/30",  dot: "bg-emerald-600" },
  approved:          { styles: "bg-amber-100/80 dark:bg-amber-950/40 text-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700 ring-amber-100 dark:ring-amber-900/30",        dot: "bg-amber-500" },
  completed:         { styles: "bg-midnight text-amber-300 border-amber-500/30 ring-midnight/10",     dot: "bg-gold-light" },
  pending:           { styles: "bg-amber-100/80 dark:bg-amber-950/50 text-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800/80 ring-amber-100 dark:ring-amber-900/30",           dot: "bg-amber-500" },
  Pending:           { styles: "bg-amber-100/80 dark:bg-amber-950/50 text-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800/80 ring-amber-100 dark:ring-amber-900/30",           dot: "bg-amber-500" },
  rejected:          { styles: "bg-rose-100/80 dark:bg-rose-950/50 text-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800/80 ring-rose-100 dark:ring-rose-900/30",              dot: "bg-rose-600" },
  inactive:          { styles: "bg-slate-200/70 dark:bg-slate-800/60 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700 ring-slate-100 dark:ring-slate-800",          dot: "bg-slate-500" },
  disbursed:         { styles: "bg-blue-100/80 dark:bg-blue-950/50 text-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800 ring-blue-100 dark:ring-blue-900/30",              dot: "bg-blue-600" },
  repaying:          { styles: "bg-indigo-100/80 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 ring-indigo-100 dark:ring-indigo-900/30",      dot: "bg-indigo-600" },
  repaid:            { styles: "bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/80 ring-emerald-100 dark:ring-emerald-900/30",  dot: "bg-emerald-600" },
  closed:            { styles: "bg-slate-200/70 dark:bg-slate-800/60 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700 ring-slate-100 dark:ring-slate-800",          dot: "bg-slate-500" },
  provisioning:      { styles: "bg-amber-100/80 dark:bg-amber-950/50 text-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800/80 ring-amber-100 dark:ring-amber-900/30",           dot: "bg-amber-500" },
  suspended:         { styles: "bg-rose-100/80 dark:bg-rose-950/50 text-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800/80 ring-rose-100 dark:ring-rose-900/30",              dot: "bg-rose-600" },

  // Compliance & Security Statuses
  compliant:         { styles: "bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/80 ring-emerald-100 dark:ring-emerald-900/30",  dot: "bg-emerald-600" },
  Compliant:         { styles: "bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/80 ring-emerald-100 dark:ring-emerald-900/30",  dot: "bg-emerald-600" },
  non_compliant:     { styles: "bg-rose-100/80 dark:bg-rose-950/50 text-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800/80 ring-rose-100 dark:ring-rose-900/30",              dot: "bg-rose-600" },
  "Non-Compliant":   { styles: "bg-rose-100/80 dark:bg-rose-950/50 text-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800/80 ring-rose-100 dark:ring-rose-900/30",              dot: "bg-rose-600" },
  high_risk:         { styles: "bg-amber-100/80 dark:bg-amber-950/50 text-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700 ring-amber-100 dark:ring-amber-900/30",          dot: "bg-rose-600" },
  "High Risk":       { styles: "bg-amber-100/80 dark:bg-amber-950/50 text-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700 ring-amber-100 dark:ring-amber-900/30",          dot: "bg-rose-600" },
  open:              { styles: "bg-blue-100/80 dark:bg-blue-950/50 text-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800 ring-blue-100 dark:ring-blue-900/30",              dot: "bg-blue-600" },
  in_review:         { styles: "bg-indigo-100/80 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 ring-indigo-100 dark:ring-indigo-900/30",      dot: "bg-indigo-600" },
  mitigated:         { styles: "bg-teal-100/80 dark:bg-teal-950/50 text-teal-950 dark:text-teal-300 border-teal-300 dark:border-teal-800 ring-teal-100 dark:ring-teal-900/30",              dot: "bg-teal-600" },
  accepted:          { styles: "bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border-slate-300 dark:border-slate-700 ring-slate-100 dark:ring-slate-800",          dot: "bg-slate-600" },
  under_maintenance: { styles: "bg-amber-100/80 dark:bg-amber-950/50 text-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800 ring-amber-100 dark:ring-amber-900/30",          dot: "bg-amber-600" },
  decommissioned:    { styles: "bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700 ring-slate-100 dark:ring-slate-800",          dot: "bg-slate-500" },
  success:           { styles: "bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/80 ring-emerald-100 dark:ring-emerald-900/30",  dot: "bg-emerald-600" },
  warning:           { styles: "bg-amber-100/80 dark:bg-amber-950/50 text-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800 ring-amber-100 dark:ring-amber-900/30",          dot: "bg-amber-600" },
  failed:            { styles: "bg-rose-100/80 dark:bg-rose-950/50 text-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800/80 ring-rose-100 dark:ring-rose-900/30",              dot: "bg-rose-600" },
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
  const config = statusConfig[status] || {
    styles: "bg-slate-100 text-slate-800 border-slate-200",
    dot: "bg-slate-400",
  };

  const displayText = label || status.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-bold rounded-full border ring-1 ring-inset tracking-wide transition-colors",
        config.styles,
        sizeStyles[size],
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />
      <span className="capitalize">{displayText}</span>
    </span>
  );
};

export default StatusBadge;
