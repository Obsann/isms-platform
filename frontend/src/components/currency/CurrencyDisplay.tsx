import React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/components/format";
import type { CurrencyCode } from "@/types";

export interface CurrencyDisplayProps {
  value: number | string;
  currency?: CurrencyCode;
  variant?: "default" | "gold" | "navy";
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: "text-slate-900",
  gold:    "text-gold font-semibold",
  navy:    "text-white font-semibold",
};

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  value,
  currency = "ETB",
  variant = "default",
  className,
}) => {
  const stringValue = typeof value === "number" ? value.toFixed(2) : String(value);
  const formatted = formatCurrency(stringValue, currency);

  return (
    <span
      className={cn(
        "font-mono tabular-nums tracking-tight leading-none",
        variantStyles[variant] ?? variantStyles.default,
        className
      )}
    >
      {formatted}
    </span>
  );
};

export default CurrencyDisplay;
