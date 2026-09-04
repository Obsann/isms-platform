import { ApiRequestError } from '@/lib/api-client';
import {
  createDeposit,
  createLoanRepayment,
  createWithdrawal,
  type LoanRepaymentResult,
} from '@/lib/api-client/teller';
import type { Transaction } from '@/types';
import {
  deleteOutboxItem,
  listOutboxItems,
  listPendingOutboxItems,
  putOutboxItem,
} from './idb-store';
import {
  defaultNarration,
  generateIdempotencyKey,
  generateQueueId,
  isBrowserOffline,
  isNetworkFailure,
} from './network';
import type { QueuedTellerOperation, TellerOpKind } from './types';
import { requiresHighValueOtp } from '@/lib/otp';

export interface TellerSubmitInput {
  kind: TellerOpKind;
  feedTempId: string;
  accountId?: string;
  loanId?: string;
  amount: string;
  userReference?: string;
  userNarration?: string;
  otp?: string;
}

export type TellerSubmitResult =
  | { mode: 'online'; deposit?: Transaction; withdrawal?: Transaction; repayment?: LoanRepaymentResult }
  | { mode: 'queued'; queueItem: QueuedTellerOperation };

export async function submitTellerOperation(input: TellerSubmitInput): Promise<TellerSubmitResult> {
  const idempotencyKey = generateIdempotencyKey(input.userReference);
  const narration = defaultNarration(input.kind, input.userNarration, input.userReference);

  if (isBrowserOffline()) {
    if (input.kind === 'withdrawal' && requiresHighValueOtp(input.amount)) {
      throw new Error('Large withdrawals need an email code and an online connection.');
    }
    const queueItem = await enqueueOperation(input, idempotencyKey, narration);
    return { mode: 'queued', queueItem };
  }

  try {
    return await executeOnline(input, idempotencyKey, narration);
  } catch (err) {
    if (isNetworkFailure(err)) {
      const queueItem = await enqueueOperation(input, idempotencyKey, narration);
      return { mode: 'queued', queueItem };
    }
    throw err;
  }
}

async function executeOnline(
  input: TellerSubmitInput,
  idempotencyKey: string,
  narration: string,
): Promise<TellerSubmitResult> {
  switch (input.kind) {
    case 'deposit':
      const deposit = await createDeposit(input.accountId!, {
        amount: input.amount,
        reference: idempotencyKey,
        narration,
      });
      return { mode: 'online', deposit };
    case 'withdrawal':
      const withdrawal = await createWithdrawal(input.accountId!, {
        amount: input.amount,
        reference: idempotencyKey,
        narration,
        otp: input.otp,
      });
      return { mode: 'online', withdrawal };
    case 'loan-repayment':
      const repayment = await createLoanRepayment(input.loanId!, {
        amount: input.amount,
        reference: idempotencyKey,
      });
      return { mode: 'online', repayment };
    default:
      throw new Error(`Unsupported teller operation: ${input.kind}`);
  }
}

async function enqueueOperation(
  input: TellerSubmitInput,
  idempotencyKey: string,
  narration: string,
): Promise<QueuedTellerOperation> {
  const item: QueuedTellerOperation = {
    id: generateQueueId(),
    feedTempId: input.feedTempId,
    idempotencyKey,
    kind: input.kind,
    accountId: input.accountId,
    loanId: input.loanId,
    amount: input.amount,
    narration,
    otp: input.otp,
    status: 'queued',
    createdAt: new Date().toISOString(),
  };
  await putOutboxItem(item);
  return item;
}

export interface SyncDrainHandlers {
  onDepositSynced: (item: QueuedTellerOperation, tx: Transaction) => void;
  onWithdrawalSynced: (item: QueuedTellerOperation, tx: Transaction) => void;
  onRepaymentSynced: (item: QueuedTellerOperation, result: LoanRepaymentResult) => void;
  onItemNeedsReview: (item: QueuedTellerOperation, message: string) => void;
  onItemFailed: (item: QueuedTellerOperation, message: string) => void;
  onSummaryChange?: (pending: number, needsReview: number) => void;
}

let draining = false;
let registeredHandlers: SyncDrainHandlers | null = null;
let autoSyncStarted = false;

export function registerOutboxSyncHandlers(handlers: SyncDrainHandlers): void {
  registeredHandlers = handlers;
}

export function startOutboxAutoSync(): () => void {
  if (autoSyncStarted || typeof window === 'undefined') {
    return () => undefined;
  }
  autoSyncStarted = true;

  const drain = () => {
    void drainOutboxQueue();
  };

  window.addEventListener('online', drain);
  const interval = window.setInterval(() => {
    if (!isBrowserOffline()) {
      drain();
    }
  }, 15000);

  drain();

  return () => {
    window.removeEventListener('online', drain);
    window.clearInterval(interval);
    autoSyncStarted = false;
    registeredHandlers = null;
  };
}

export async function drainOutboxQueue(): Promise<void> {
  if (draining || isBrowserOffline() || !registeredHandlers) {
    return;
  }

  draining = true;
  try {
    const pending = await listPendingOutboxItems();
    for (const item of pending) {
      await syncOneItem(item);
    }
    await publishSummary();
  } finally {
    draining = false;
  }
}

async function syncOneItem(item: QueuedTellerOperation): Promise<void> {
  const handlers = registeredHandlers;
  if (!handlers) {
    return;
  }

  const syncing: QueuedTellerOperation = { ...item, status: 'syncing' };
  await putOutboxItem(syncing);

  try {
    const result = await executeOnline(
      {
        kind: item.kind,
        feedTempId: item.feedTempId,
        accountId: item.accountId,
        loanId: item.loanId,
        amount: item.amount,
        userReference: item.idempotencyKey,
        userNarration: item.narration,
        otp: item.otp,
      },
      item.idempotencyKey,
      item.narration ?? defaultNarration(item.kind),
    );

    if (result.mode === 'queued') {
      await putOutboxItem({ ...item, status: 'queued' });
      return;
    }

    await deleteOutboxItem(item.id);

    if (result.deposit) {
      handlers.onDepositSynced(item, result.deposit);
    } else if (result.withdrawal) {
      handlers.onWithdrawalSynced(item, result.withdrawal);
    } else if (result.repayment) {
      handlers.onRepaymentSynced(item, result.repayment);
    }
  } catch (err) {
    const message = extractErrorMessage(err);
    if (err instanceof ApiRequestError && err.error === 'SyncConflict') {
      const reviewed: QueuedTellerOperation = {
        ...item,
        status: 'needs_review',
        lastError: message,
      };
      await putOutboxItem(reviewed);
      handlers.onItemNeedsReview(reviewed, message);
      return;
    }

    const failed: QueuedTellerOperation = {
      ...item,
      status: 'failed',
      lastError: message,
    };
    await putOutboxItem(failed);
    handlers.onItemFailed(failed, message);
  }
}

async function publishSummary(): Promise<void> {
  if (!registeredHandlers?.onSummaryChange) {
    return;
  }
  const items = await listOutboxItems();
  const pending = items.filter((i) => i.status === 'queued' || i.status === 'failed').length;
  const needsReview = items.filter((i) => i.status === 'needs_review').length;
  registeredHandlers.onSummaryChange(pending, needsReview);
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof ApiRequestError) {
    return err.messages.join('. ') || err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Sync failed';
}

export async function getOutboxCounts(): Promise<{ pending: number; needsReview: number }> {
  const items = await listOutboxItems();
  return {
    pending: items.filter((i) => i.status === 'queued' || i.status === 'failed').length,
    needsReview: items.filter((i) => i.status === 'needs_review').length,
  };
}
