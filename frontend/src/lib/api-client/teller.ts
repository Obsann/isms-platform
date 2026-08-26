/**
 * frontend/src/lib/api-client/teller.ts
 *
 * Typed API client helpers for Teller Desk operations (Task 14).
 * Communicates with accounts, loans, and members endpoints through apiClient.
 */

import { apiClient } from './index';
import type { Amount, Member, Transaction } from '@/types';

export interface AccountBalance {
  accountId: string;
  balance: Amount;
  heldAmount: Amount;
  availableBalance: Amount;
}

export interface DepositPayload {
  amount: Amount;
  reference?: string;
  narration?: string;
}

export interface WithdrawalPayload {
  amount: Amount;
  reference?: string;
  narration?: string;
}

export interface RepayLoanPayload {
  amount: Amount;
  reference?: string;
}

export interface LoanRepaymentResult {
  repaymentId: string;
  loanId: string;
  amount: Amount;
  reference: string | null;
  paidAt: string;
}

export interface LoanDetails {
  id: string;
  memberId: string;
  loanNumber: string;
  requestedAmount: Amount;
  approvedAmount?: Amount | null;
  disbursedAmount?: Amount | null;
  termMonths: number;
  purpose?: string | null;
  status: string;
  appliedAt: string;
  approvedAt?: string | null;
  disbursedAt?: string | null;
  closedAt?: string | null;
}

/**
 * Fetch account balance details (balance, heldAmount, availableBalance).
 * GET /api/accounts/:id
 */
export async function getAccountBalance(accountId: string): Promise<AccountBalance> {
  return apiClient.get<AccountBalance>(`/accounts/${encodeURIComponent(accountId)}`);
}

/**
 * Post a deposit to a savings account.
 * POST /api/accounts/:id/deposits
 */
export async function createDeposit(
  accountId: string,
  payload: DepositPayload,
): Promise<Transaction> {
  return apiClient.post<Transaction>(
    `/accounts/${encodeURIComponent(accountId)}/deposits`,
    payload,
  );
}

/**
 * Post a withdrawal from a savings account.
 * POST /api/accounts/:id/withdrawals
 */
export async function createWithdrawal(
  accountId: string,
  payload: WithdrawalPayload,
): Promise<Transaction> {
  return apiClient.post<Transaction>(
    `/accounts/${encodeURIComponent(accountId)}/withdrawals`,
    payload,
  );
}

/**
 * Post a repayment against an active loan.
 * POST /api/loans/:id/repayments
 */
export async function createLoanRepayment(
  loanId: string,
  payload: RepayLoanPayload,
): Promise<LoanRepaymentResult> {
  return apiClient.post<LoanRepaymentResult>(
    `/loans/${encodeURIComponent(loanId)}/repayments`,
    payload,
  );
}

/**
 * Fetch loan details by ID.
 * GET /api/loans/:id
 */
export async function getLoan(loanId: string): Promise<LoanDetails> {
  return apiClient.get<LoanDetails>(`/loans/${encodeURIComponent(loanId)}`);
}

/**
 * Fetch member details by ID.
 * GET /api/members/:id
 */
export async function getMember(memberId: string): Promise<Member> {
  return apiClient.get<Member>(`/members/${encodeURIComponent(memberId)}`);
}
