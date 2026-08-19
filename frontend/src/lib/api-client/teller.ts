import { apiClient } from './index';
import type {
  AccountBalance,
  DepositDto,
  LoanRepaymentRow,
  LoanRow,
  Member,
  RepayLoanDto,
  Transaction,
  WithdrawDto,
} from '@/types';

/**
 * Account balance query
 * GET /api/accounts/:id
 */
export async function getAccountBalance(accountId: string): Promise<AccountBalance> {
  return apiClient.get<AccountBalance>(`/accounts/${encodeURIComponent(accountId)}`);
}

/**
 * Deposit funds
 * POST /api/accounts/:id/deposits
 */
export async function createDeposit(accountId: string, dto: DepositDto): Promise<Transaction> {
  return apiClient.post<Transaction>(`/accounts/${encodeURIComponent(accountId)}/deposits`, dto);
}

/**
 * Withdraw funds
 * POST /api/accounts/:id/withdrawals
 */
export async function createWithdrawal(accountId: string, dto: WithdrawDto): Promise<Transaction> {
  return apiClient.post<Transaction>(`/accounts/${encodeURIComponent(accountId)}/withdrawals`, dto);
}

/**
 * Loan lookup by ID
 * GET /api/loans/:id
 */
export async function getLoan(loanId: string): Promise<LoanRow> {
  return apiClient.get<LoanRow>(`/loans/${encodeURIComponent(loanId)}`);
}

/**
 * Post loan repayment
 * POST /api/loans/:id/repayments
 */
export async function createLoanRepayment(loanId: string, dto: RepayLoanDto): Promise<LoanRepaymentRow> {
  return apiClient.post<LoanRepaymentRow>(`/loans/${encodeURIComponent(loanId)}/repayments`, dto);
}

/**
 * Member lookup by ID
 * GET /api/members/:id
 */
export async function getMember(memberId: string): Promise<Member> {
  return apiClient.get<Member>(`/members/${encodeURIComponent(memberId)}`);
}
