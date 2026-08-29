/**
 * Money calculations using BigInt minor units (cents).
 * Guarantees precision without floating-point errors (no parseFloat / Number).
 * Mirrors backend/src/ledger/money.ts.
 */

import type { Amount } from '@/types';

const AMOUNT_PATTERN = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

const ZERO_BIGINT = BigInt(0);
const HUNDRED_BIGINT = BigInt(100);

/**
 * Validates whether the given string is a strictly positive, valid decimal amount.
 * Accepts formats such as "500", "500.00", "0.50", "12345.67".
 */
export function isValidAmountDecimal(amount: string): boolean {
  const trimmed = (amount ?? '').trim();
  if (!AMOUNT_PATTERN.test(trimmed)) return false;
  try {
    return toCents(trimmed) > ZERO_BIGINT;
  } catch {
    return false;
  }
}

/**
 * Converts a decimal amount string to BigInt minor units (cents).
 * "500.00" -> 50000n, "500" -> 50000n, "0.50" -> 50n.
 */
export function toCents(amount: Amount | string): bigint {
  const trimmed = (amount ?? '').trim();
  if (!AMOUNT_PATTERN.test(trimmed)) {
    throw new Error(
      `Amount must be a non-negative decimal string with at most 2 decimal places, got "${amount}"`,
    );
  }
  const [whole, fraction = ''] = trimmed.split('.');
  return BigInt(whole) * HUNDRED_BIGINT + BigInt(fraction.padEnd(2, '0'));
}

/**
 * Converts BigInt cents into a standard 2-decimal string format.
 * 50000n -> "500.00", 50n -> "0.50".
 */
export function fromCents(cents: bigint): Amount {
  if (cents < ZERO_BIGINT) {
    throw new Error('Amount cannot be negative');
  }
  const whole = cents / HUNDRED_BIGINT;
  const remainder = cents % HUNDRED_BIGINT;
  const fraction = remainder.toString().padStart(2, '0');
  return `${whole.toString()}.${fraction}`;
}

/**
 * Adds two decimal amount strings.
 */
export function addAmounts(a: Amount | string, b: Amount | string): Amount {
  return fromCents(toCents(a) + toCents(b));
}

/**
 * Subtracts amount b from amount a. Throws if b > a.
 */
export function subtractAmounts(a: Amount | string, b: Amount | string): Amount {
  const result = toCents(a) - toCents(b);
  if (result < ZERO_BIGINT) {
    throw new Error(`Insufficient funds: ${a} minus ${b} would be negative`);
  }
  return fromCents(result);
}

/**
 * Returns true if amount a is strictly greater than amount b.
 */
export function amountGreaterThan(a: Amount | string, b: Amount | string): boolean {
  return toCents(a) > toCents(b);
}

/**
 * Returns true if amount a equals amount b in value.
 */
export function amountsEqual(a: Amount | string, b: Amount | string): boolean {
  return toCents(a) === toCents(b);
}
