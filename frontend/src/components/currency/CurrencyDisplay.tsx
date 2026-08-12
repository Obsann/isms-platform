import React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/components/format";
import type { CurrencyCode } from "@/types";

export interface CurrencyDisplayProps {
  /** Accept value or amount for backward compatibility */
  value?: number | string | null;
  amount?: number | string | null;
  currency?: CurrencyCode;
  variant?: "default" | "gold" | "navy";
  size?: "sm" | "md" | "lg" | "xl";
  colorCode?: "positive" | "negative" | "neutral" | "default";
  allowToggle?: boolean;
  isMasked?: boolean;
  onToggleMask?: () => void;
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: "text-slate-900",
  gold:    "text-[#C59B27] font-semibold",
  navy:    "text-white font-semibold",
};

const colorCodeStyles: Record<string, string> = {
  positive: "text-emerald-600 dark:text-emerald-400 font-semibold",
  negative: "text-rose-600 dark:text-rose-400 font-semibold",
  neutral:  "text-slate-700 dark:text-slate-300 font-semibold",
};

const sizeStyles: Record<string, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base font-medium",
  xl: "text-xl sm:text-2xl font-bold tracking-tight",
};

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  value,
  amount,
  currency = "ETB",
  variant = "default",
  size = "md",
  colorCode = "default",
  allowToggle = false,
  isMasked = false,
  onToggleMask,
  className,
}) => {
  const rawValue = value ?? amount;

  if (isMasked || rawValue === null) {
    return (
      <span className={cn("inline-flex items-center gap-2", className)}>
        <span className="font-mono tracking-widest text-slate-400 font-bold select-none">
          ••••••••
        </span>
        {(allowToggle || onToggleMask) && (
          <button
            type="button"
            onClick={onToggleMask}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded"
            title="Reveal financial value"
            aria-label="Reveal financial value"
          >
            👁️
          </button>
        )}
      </span>
    );
  }

  const stringValue =
    typeof rawValue === "number"
      ? rawValue.toFixed(2)
      : String(rawValue ?? "");

  const formatted = formatCurrency(stringValue, currency);

  const styleClass =
    colorCode !== "default"
      ? colorCodeStyles[colorCode]
      : variantStyles[variant] ?? variantStyles.default;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "font-mono tabular-nums tracking-tight leading-none",
          styleClass,
          sizeStyles[size]
        )}
      >
        {formatted}
      </span>
      {(allowToggle || onToggleMask) && (
        <button
          type="button"
          onClick={onToggleMask}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded opacity-75 hover:opacity-100"
          title="Mask financial value"
          aria-label="Mask financial value"
        >
          🙈
        </button>
      )}
    </span>
  );
};

export default CurrencyDisplay;

