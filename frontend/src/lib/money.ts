/**
 * Money calculations using BigInt minor units (cents).
 * Guarantees precision without floating-point errors (no parseFloat / Number).
 * Mirrors backend/src/ledger/money.ts.
 */

const AMOUNT_PATTERN = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

const ZERO_BIGINT = BigInt(0);
const HUNDRED_BIGINT = BigInt(100);

export function isValidAmountDecimal(amount: string): boolean {
  const trimmed = amount.trim();
  if (!AMOUNT_PATTERN.test(trimmed)) return false;
  try {
    return toCents(trimmed) > ZERO_BIGINT;
  } catch {
    return false;
  }
}

export function toCents(amount: string): bigint {
  const trimmed = amount.trim();
  if (!AMOUNT_PATTERN.test(trimmed)) {
    throw new Error(`Amount must be a non-negative decimal string with at most 2 places, got "${amount}"`);
  }
  const [whole, fraction = ''] = trimmed.split('.');
  return BigInt(whole) * HUNDRED_BIGINT + BigInt(fraction.padEnd(2, '0'));
}

export function fromCents(cents: bigint): string {
  if (cents < ZERO_BIGINT) {
    throw new Error('Amount cannot be negative');
  }
  const whole = cents / HUNDRED_BIGINT;
  const fraction = (cents % HUNDRED_BIGINT).toString().padStart(2, '0');
  return `${whole.toString()}.${fraction}`;
}

export function addAmounts(left: string, right: string): string {
  return fromCents(toCents(left) + toCents(right));
}

export function subtractAmounts(left: string, right: string): string {
  const result = toCents(left) - toCents(right);
  if (result < ZERO_BIGINT) {
    throw new Error(`Insufficient funds: ${left} minus ${right} would be negative`);
  }
  return fromCents(result);
}

export function amountGreaterThan(left: string, right: string): boolean {
  return toCents(left) > toCents(right);
}

export function amountsEqual(left: string, right: string): boolean {
  return toCents(left) === toCents(right);
}
