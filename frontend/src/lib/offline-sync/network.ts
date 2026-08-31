import type { TellerOpKind } from './types';

/** Browser online check — also used before enqueue when `navigator.onLine` is false. */
export function isBrowserOffline(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return !navigator.onLine;
}

export function isNetworkFailure(err: unknown): boolean {
  if (err instanceof TypeError) {
    return true;
  }
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed');
  }
  return false;
}

export function generateIdempotencyKey(userReference?: string): string {
  const trimmed = userReference?.trim();
  if (trimmed) {
    return trimmed.slice(0, 128);
  }
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `idem-${crypto.randomUUID()}`;
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function generateQueueId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function defaultNarration(kind: TellerOpKind, userNarration?: string, userReference?: string): string {
  const custom = userNarration?.trim() || userReference?.trim();
  if (custom) {
    return custom;
  }
  switch (kind) {
    case 'deposit':
      return 'Cash Deposit';
    case 'withdrawal':
      return 'Cash Withdrawal';
    case 'loan-repayment':
      return 'Loan Repayment';
    default:
      return 'Teller transaction';
  }
}
