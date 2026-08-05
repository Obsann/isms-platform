/**
 * Shared display formatting. Every portal imports from here — never re-implement
 * currency rendering inside a route group.
 */

import type { Amount, CurrencyCode } from "@/types";

/**
 * Renders an `Amount` as a full, unabbreviated figure: `"45230.00"` becomes
 * `"45,230.00"`. Never `45.2K` — abbreviated money is not acceptable anywhere in
 * this product.
 *
 * Works on the decimal string directly and never converts to `number`. That is the
 * whole reason this function exists: `parseFloat("45230.10")` is already imprecise,
 * and `toLocaleString` on the result quietly rounds. Grouping digits is a string
 * operation, so we do it as one.
 *
 * Input with more than two decimal places is preserved rather than rounded — the
 * backend's `numeric(18,2)` never produces that, and silently dropping precision
 * from money is worse than showing an odd-looking figure.
 */
export function formatAmount(amount: Amount): string {
  const raw = amount.trim();
  if (raw === "") return "";

  const negative = raw.startsWith("-");
  const unsigned = negative || raw.startsWith("+") ? raw.slice(1) : raw;

  const [integerPart = "", fractionPart = ""] = unsigned.split(".");

  // Anything unexpected (empty, exponent notation, stray characters) is shown as it
  // arrived rather than rendered as NaN in the middle of a balance column.
  if (!/^\d+$/.test(integerPart) || (fractionPart !== "" && !/^\d+$/.test(fractionPart))) {
    return raw;
  }

  const grouped = groupThousands(stripLeadingZeros(integerPart));
  const fraction = fractionPart.padEnd(2, "0");

  return `${negative ? "-" : ""}${grouped}.${fraction}`;
}

/** `formatAmount` plus the currency code, e.g. `"45,230.00 ETB"`. */
export function formatCurrency(amount: Amount, currency: CurrencyCode = "ETB"): string {
  const formatted = formatAmount(amount);
  return formatted === "" ? "" : `${formatted} ${currency}`;
}

function stripLeadingZeros(digits: string): string {
  const trimmed = digits.replace(/^0+/, "");
  return trimmed === "" ? "0" : trimmed;
}

function groupThousands(digits: string): string {
  let out = "";
  for (let i = 0; i < digits.length; i += 1) {
    const fromRight = digits.length - i;
    out += digits[i];
    if (fromRight > 1 && fromRight % 3 === 1) {
      out += ",";
    }
  }
  return out;
}
