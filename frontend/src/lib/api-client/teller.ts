/**
 * frontend/src/lib/api-client/teller.ts
 *
 * Typed API client helpers for Teller Desk operations (Task 14).
 * Communicates with accounts, loans, and members endpoints through apiClient.
 */

import { apiClient, getMembers } from './index';
import type { Amount, Account, Member, Transaction } from '@/types';

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
 * Fetch loan details by UUID or human Loan Number (e.g. LN-2026-137844).
 * GET /api/loans/:idOrNumber
 */
export async function getLoan(loanIdOrNumber: string): Promise<LoanDetails> {
  const trimmed = loanIdOrNumber.trim();
  try {
    return await apiClient.get<LoanDetails>(`/loans/${encodeURIComponent(trimmed)}`);
  } catch (err) {
    // Fallback: search via loan list query
    const res = await apiClient.get<{ items: LoanDetails[] }>(
      `/loans?search=${encodeURIComponent(trimmed)}&limit=5`,
    );
    const found =
      res.items?.find((l) => l.loanNumber.toUpperCase() === trimmed.toUpperCase()) ||
      res.items?.[0];
    if (found) {
      return found;
    }
    throw err;
  }
}

/**
 * Fetch member details by ID.
 * GET /api/members/:id
 */
export async function getMember(memberId: string): Promise<Member> {
  return apiClient.get<Member>(`/members/${encodeURIComponent(memberId)}`);
}

export async function listAccountsByMember(memberId: string): Promise<Account[]> {
  return apiClient.get<Account[]>(`/accounts?memberId=${encodeURIComponent(memberId)}`);
}

export async function createSavingsAccount(memberId: string): Promise<Account> {
  return apiClient.post<Account>('/accounts', { memberId, type: 'savings' });
}

const ACCOUNT_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Resolve a savings account from a UUID or a member number / name. */
export async function resolveSavingsAccount(lookup: string): Promise<AccountBalance> {
  const raw = lookup.trim();
  if (ACCOUNT_UUID.test(raw)) {
    return getAccountBalance(raw);
  }

  const res = await getMembers({ search: raw, limit: 10 });
  const items = Array.isArray(res.items) ? res.items : [];
  const needle = raw.toUpperCase();
  const member =
    items.find((m) => m.memberNumber.toUpperCase() === needle) ||
    items.find((m) => m.fullName.toUpperCase().includes(needle)) ||
    items[0];

  if (!member) {
    throw new Error(`No member found for "${raw}". Try MEM-10001 or the member's name.`);
  }

  const accounts = await listAccountsByMember(member.id);
  let savings =
    accounts.find((a) => a.type === 'savings' && a.status === 'active') ??
    accounts.find((a) => a.type === 'savings') ??
    accounts[0];

  if (!savings) {
    savings = await createSavingsAccount(member.id);
  }

  return getAccountBalance(savings.id);
}
