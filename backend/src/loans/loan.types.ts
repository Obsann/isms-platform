import type { AccountId, Amount, LoanId, MemberId, RoleName, StaffId } from '../types';
import type { LoanStatus } from './entities/loan.entity';

// ------------------------------------------------------------------ inputs

export interface LoanApplicationInput {
  memberId: MemberId;
  requestedAmount: Amount;
  termMonths: number;
  purpose?: string;
}

export interface EligibilityDecision {
  eligible: boolean;
  /**
   * Ceiling strictly determined by the borrower's savings multiplier (D-30-01).
   * Guarantor pledges provide collateral security but never raise the borrower's ceiling.
   */
  maxAmount: Amount;
  /** Every failed rule, so the applicant sees why — not just "rejected". */
  reasons: string[];
}

export interface ApprovalDecisionInput {
  loanId: LoanId;
  approvedBy: StaffId;
  approverRole?: RoleName;
  approved: boolean;
  note?: string;
}

export interface DisbursementInput {
  loanId: LoanId;
  /** Savings account the funds are credited to. */
  destinationAccountId: AccountId;
  amount: Amount;
  initiatedByStaffId?: StaffId;
  otp?: string;
}

export interface RepaymentInput {
  loanId: LoanId;
  amount: Amount;
  reference?: string;
}

export interface GuarantorPledgeInput {
  loanId: LoanId;
  guarantorMemberId: MemberId;
  guarantorAccountId: AccountId;
  pledgedAmount: Amount;
}

export interface GuarantorPledge {
  pledgeId: string;
  loanId: LoanId;
  guarantorMemberId: MemberId;
  pledgedAmount: Amount;
  /** Hold id returned by the Savings vertical, needed to release the pledge. */
  holdId: string;
}

// ------------------------------------------------------------------ shapes returned to callers

/**
 * The public representation of a loan row — the shape `LoanService` methods return.
 * `src/types` defines `Loan = Record<string, unknown>` as a placeholder until
 * Task 5 fills in the shared contract; this interface is used internally and
 * satisfies that placeholder at runtime.
 */
export interface LoanRow {
  id: LoanId;
  tenantId: string;
  memberId: MemberId;
  loanNumber: string;
  requestedAmount: Amount;
  approvedAmount: Amount | null;
  disbursedAmount: Amount | null;
  termMonths: number;
  purpose: string | null;
  status: LoanStatus;
  appliedBy: StaffId | null;
  approvedBy: StaffId | null;
  approvalNote: string | null;
  disbursedToAccountId: AccountId | null;
  appliedAt: Date;
  approvedAt: Date | null;
  disbursedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * The public representation of one repayment — returned by `recordRepayment`.
 * `src/types` defines `Transaction = Record<string, unknown>` as placeholder.
 */
export interface LoanRepaymentRow {
  id: string;
  tenantId: string;
  loanId: LoanId;
  amount: Amount;
  reference: string | null;
  paidAt: Date;
}

/** Tenant-wide loan figures for reporting (Task 20). */
export interface LoanPortfolioSummary {
  outstanding: Amount;
  activeBorrowers: number;
  loansInArrears: number;
  pendingCount: number;
  disbursedCount: number;
  defaultedCount: number;
}
