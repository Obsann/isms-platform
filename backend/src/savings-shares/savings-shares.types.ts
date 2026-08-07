import type { AccountId, Amount, MemberId, StaffId } from '../types';

export interface DepositInput {
  accountId: AccountId;
  amount: Amount;
  /** Teller-supplied reference; also the idempotency anchor for offline sync (Task 15). */
  reference?: string;
  narration?: string;
  postedByStaffId?: StaffId | null;
}

export interface WithdrawalInput {
  accountId: AccountId;
  amount: Amount;
  reference?: string;
  narration?: string;
  postedByStaffId?: StaffId | null;
}

export interface SharePurchaseInput {
  memberId: MemberId;
  shareCount: number;
  amount: Amount;
  reference?: string;
  postedByStaffId?: StaffId | null;
}

export interface AccountBalance {
  accountId: AccountId;
  /** Everything posted to the account. */
  balance: Amount;
  /** Pledged as loan collateral and therefore not withdrawable. */
  heldAmount: Amount;
  /** `balance - heldAmount`, and the only figure a withdrawal may draw against. */
  availableBalance: Amount;
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

export interface LoanEligibilityCeiling {
  memberId: MemberId;
  savingsBalance: Amount;
  multiplier: number;
  /** `savingsBalance * multiplier` — the hard ceiling the Loans vertical checks against. */
  maxLoanAmount: Amount;
}
