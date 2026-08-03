import type { AccountId, Amount, LoanId, MemberId, StaffId } from '../types';

export interface LoanApplicationInput {
  memberId: MemberId;
  requestedAmount: Amount;
  termMonths: number;
  purpose?: string;
}

export interface EligibilityDecision {
  eligible: boolean;
  /** Ceiling from the savings multiplier plus accepted guarantor pledges. */
  maxAmount: Amount;
  /** Every failed rule, so the applicant sees why — not just "rejected". */
  reasons: string[];
}

export interface ApprovalDecisionInput {
  loanId: LoanId;
  approvedBy: StaffId;
  approved: boolean;
  note?: string;
}

export interface DisbursementInput {
  loanId: LoanId;
  /** Savings account the funds are credited to. */
  destinationAccountId: AccountId;
  amount: Amount;
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
