import type { Account, IsoDateTime, Member, MemberId, Transaction } from '../types';

// ---------------------------------------------------------------------------
// Balance view
// ---------------------------------------------------------------------------

/**
 * What `GET /members/:id/balance` returns.
 *
 * Aggregates all savings & share accounts for the member so the member portal
 * can show balances at a glance without knowing individual account IDs.
 */
export interface MemberBalanceView {
  memberId: MemberId;
  memberNumber: string;
  fullName: string;
  /** All savings & share accounts belonging to the member. */
  accounts: Account[];
  /** ISO-8601 timestamp of when this snapshot was generated. */
  asOf: IsoDateTime;
}

// ---------------------------------------------------------------------------
// Statement view
// ---------------------------------------------------------------------------

/**
 * What `GET /members/:id/statement` returns.
 *
 * Transactions are returned newest-first, across all accounts of the member,
 * optionally filtered by `from` / `to` date query parameters.
 */
export interface MemberStatementView {
  memberId: MemberId;
  memberNumber: string;
  fullName: string;
  /** Transactions across all member accounts, newest-first. */
  transactions: Transaction[];
  /** ISO-8601 timestamp of when this snapshot was generated. */
  asOf: IsoDateTime;
}

// ---------------------------------------------------------------------------
// Loans view
// ---------------------------------------------------------------------------

/**
 * Minimal loan summary shape for the member self-service portal.
 *
 * TODO(Task 23 → Abenezer): Replace with the real type from `LoanService` once
 * `LoanService.findByMemberId()` (or the equivalent method Abenezer ships) is
 * available and merged to main. Track in Task 23 → subtask "wire loans".
 */
export interface MemberLoanSummary {
  loanId: string;
  loanNumber: string;
  requestedAmount: string;
  approvedAmount: string | null;
  disbursedAmount: string | null;
  termMonths: number;
  purpose: string | null;
  status: string;
  appliedAt: IsoDateTime;
}

/**
 * What `GET /members/:id/loans` returns.
 *
 * `status` lets the frontend distinguish between a member who genuinely has no
 * loans (`available`, `loans: []`) versus the case where the dependency has not
 * yet been merged (`dependency_unavailable`, `loans: []`).
 */
export interface MemberLoansView {
  memberId: MemberId;
  memberNumber: string;
  fullName: string;
  /**
   * - `'available'`              — `LoanService.findByMemberId()` was called
   *                                successfully; `loans` may be empty or populated.
   * - `'dependency_unavailable'` — `LoanService.findByMemberId()` does not exist
   *                                yet; `loans` is always `[]`.
   */
  status: 'available' | 'dependency_unavailable';
  loans: MemberLoanSummary[];
}

// ---------------------------------------------------------------------------
// Re-export Member for convenience within this module
// ---------------------------------------------------------------------------
export type { Member };
