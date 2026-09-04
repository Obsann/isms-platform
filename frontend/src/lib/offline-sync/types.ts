/**
 * Task 15 — offline teller outbox types.
 * `reference` on the API is the idempotency anchor (`idempotencyKey` here).
 */

export type TellerOpKind = 'deposit' | 'withdrawal' | 'loan-repayment';

export type OutboxItemStatus = 'queued' | 'syncing' | 'synced' | 'failed' | 'needs_review';

export interface QueuedTellerOperation {
  /** IndexedDB primary key. */
  id: string;
  /** Correlates with the optimistic row in the teller activity feed. */
  feedTempId: string;
  idempotencyKey: string;
  kind: TellerOpKind;
  accountId?: string;
  loanId?: string;
  amount: string;
  narration?: string;
  otp?: string;
  status: OutboxItemStatus;
  createdAt: string;
  lastError?: string;
}

export interface OutboxSyncSummary {
  pendingCount: number;
  needsReviewCount: number;
  isDraining: boolean;
}
