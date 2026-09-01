import type { AccountId, Amount, StaffId, TransactionType } from '../types';

/** Hard-coded GL names for MVP — no chart-of-accounts table (DECISIONS.md D2). */
export const GL = {
  CASH: 'CASH',
  MEMBER_SAVINGS: 'MEMBER_SAVINGS',
  SHARE_CAPITAL: 'SHARE_CAPITAL',
  LOANS_RECEIVABLE: 'LOANS_RECEIVABLE',
} as const;

export type GlCode = (typeof GL)[keyof typeof GL];

export type LedgerSide = 'debit' | 'credit';

export interface LedgerLine {
  glCode: GlCode;
  side: LedgerSide;
  amount: Amount;
  /** Member account this line moves, when it is not a pure GL stub. */
  accountId?: AccountId | null;
}

export interface PostingMeta {
  type: TransactionType;
  currency?: string;
  reference?: string | null;
  narration?: string | null;
  postedByStaffId?: StaffId | null;
}

export interface MemberMovementInput {
  accountId: AccountId;
  amount: Amount;
  currency: string;
  reference?: string | null;
  narration?: string | null;
  postedByStaffId?: StaffId | null;
}

export interface LoanMovementInput {
  amount: Amount;
  currency?: string;
  reference?: string | null;
  narration?: string | null;
  postedByStaffId?: StaffId | null;
}

export interface HoldFundsInput {
  accountId: AccountId;
  amount: Amount;
  reason: string;
}

export interface FundsHold {
  holdId: string;
  accountId: AccountId;
  amount: Amount;
  releasedAt: string | null;
}

/** One GL code's debit/credit totals for a tenant trial balance. */
export interface GlBalanceLine {
  glCode: GlCode;
  debit: Amount;
  credit: Amount;
}

export interface LedgerTrialBalance {
  lines: GlBalanceLine[];
  totalDebits: Amount;
  totalCredits: Amount;
  balanced: boolean;
}
