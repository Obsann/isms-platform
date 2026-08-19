import { UnprocessableEntityException } from '@nestjs/common';
import type { Amount } from '../types';

const AMOUNT_PATTERN = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

/**
 * Integer minor units (cents) so posting math never goes through `number`.
 * `"45230.00"` → `4523000n`.
 */
export function toCents(amount: Amount): bigint {
  if (!AMOUNT_PATTERN.test(amount)) {
    throw new UnprocessableEntityException(
      `Amount must be a non-negative decimal string with at most 2 places, got "${amount}"`,
    );
  }
  const [whole, fraction = ''] = amount.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
}

export function fromCents(cents: bigint): Amount {
  if (cents < 0n) {
    throw new UnprocessableEntityException('Amount cannot be negative');
  }
  const whole = cents / 100n;
  const fraction = (cents % 100n).toString().padStart(2, '0');
  return `${whole.toString()}.${fraction}`;
}

export function addAmounts(left: Amount, right: Amount): Amount {
  return fromCents(toCents(left) + toCents(right));
}

export function subtractAmounts(left: Amount, right: Amount): Amount {
  const result = toCents(left) - toCents(right);
  if (result < 0n) {
    throw new UnprocessableEntityException(
      `Insufficient funds: ${left} minus ${right} would be negative`,
    );
  }
  return fromCents(result);
}

export function amountsEqual(left: Amount, right: Amount): boolean {
  return toCents(left) === toCents(right);
}

export function amountGreaterThan(left: Amount, right: Amount): boolean {
  return toCents(left) > toCents(right);
}
