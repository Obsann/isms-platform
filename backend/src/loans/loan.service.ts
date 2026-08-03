import { Injectable, NotImplementedException } from '@nestjs/common';
import type { Loan, LoanId, Transaction } from '../types';
import type {
  ApprovalDecisionInput,
  DisbursementInput,
  EligibilityDecision,
  GuarantorPledge,
  GuarantorPledgeInput,
  LoanApplicationInput,
  RepaymentInput,
} from './loan.types';

/**
 * Loans & Credit vertical — owner: **Abenezer** (Tasks 16–18).
 *
 * Reads savings figures and places collateral holds through the Savings vertical's
 * exported service, and posts every disbursement and repayment through the ledger
 * service (Task 13) — both by DI, never by importing their internals.
 */
@Injectable()
export class LoanService {
  apply(input: LoanApplicationInput): Promise<Loan> {
    throw new NotImplementedException('LoanService.apply is not implemented (Task 16)');
  }

  /** Savings multiplier plus guarantor pledge rules; a request over the ceiling is rejected. */
  checkEligibility(input: LoanApplicationInput): Promise<EligibilityDecision> {
    throw new NotImplementedException('LoanService.checkEligibility is not implemented (Task 16)');
  }

  decideApproval(input: ApprovalDecisionInput): Promise<Loan> {
    throw new NotImplementedException('LoanService.decideApproval is not implemented (Task 16)');
  }

  disburse(input: DisbursementInput): Promise<Transaction> {
    throw new NotImplementedException('LoanService.disburse is not implemented (Task 16)');
  }

  recordRepayment(input: RepaymentInput): Promise<Transaction> {
    throw new NotImplementedException('LoanService.recordRepayment is not implemented (Task 16)');
  }

  findById(loanId: LoanId): Promise<Loan> {
    throw new NotImplementedException('LoanService.findById is not implemented (Task 16)');
  }

  /** Records the pledge and holds the amount on the guarantor's own savings account. */
  recordGuarantorPledge(input: GuarantorPledgeInput): Promise<GuarantorPledge> {
    throw new NotImplementedException(
      'LoanService.recordGuarantorPledge is not implemented (Task 17)',
    );
  }

  releaseGuarantorPledge(pledgeId: string): Promise<GuarantorPledge> {
    throw new NotImplementedException(
      'LoanService.releaseGuarantorPledge is not implemented (Task 17)',
    );
  }
}
