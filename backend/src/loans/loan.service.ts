import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import type { Repository } from 'typeorm';
import { TenantContextService } from '../common';
import { SavingsSharesService } from '../savings-shares';
import { LoanRepaymentEntity } from './entities/loan-repayment.entity';
import { LoanEntity } from './entities/loan.entity';
import type {
  ApprovalDecisionInput,
  DisbursementInput,
  EligibilityDecision,
  GuarantorPledge,
  GuarantorPledgeInput,
  LoanApplicationInput,
  LoanRepaymentRow,
  LoanRow,
  RepaymentInput,
} from './loan.types';

/**
 * Loans & Credit vertical — owner: **Abenezer** (Tasks 16–18).
 *
 * Reads savings figures through `SavingsSharesService` (injected by DI).
 * Every disbursement and repayment is posted through the ledger service
 * (Task 13, `LedgerService` — imported via `LedgerModule` once Task 13 lands
 * on `main`). Neither this service nor any migration writes a balance column.
 *
 * All entity access goes through `TenantContextService.repo(Entity)` — never
 * via `@InjectRepository`. A plain injected repository uses the untouched pool
 * connection with no `app.tenant_id` set; under `FORCE ROW LEVEL SECURITY` that
 * silently returns zero rows, which is wrong. `TenantContextService` is
 * `@Global()`, so it's injectable anywhere without extra imports.
 *
 * Loan state machine:
 *   pending → approved | rejected  (`decideApproval`)
 *   approved → disbursed           (`disburse`)
 *   disbursed → repaid             (`recordRepayment`, when fully settled)
 *   disbursed → defaulted          (future task — admin override)
 */
@Injectable()
export class LoanService {
  constructor(
    private readonly ctx: TenantContextService,
    private readonly savingsSharesService: SavingsSharesService,
    // TODO(Task 13 — Obsan): inject LedgerService here once LedgerModule is
    // merged to main. Add it as a constructor parameter and use it in disburse()
    // and recordRepayment() instead of the placeholder comment below.
    // private readonly ledger: LedgerService,
  ) {}

  // ------------------------------------------------------------------ apply

  /**
   * Creates a loan application in `pending` status.
   * Does not disburse funds — only records intent and validates eligibility.
   */
  async apply(input: LoanApplicationInput): Promise<LoanRow> {
    const eligibility = await this.checkEligibility(input);
    if (!eligibility.eligible) {
      throw new BadRequestException(
        `Loan application rejected: ${eligibility.reasons.join('; ')}`,
      );
    }

    const loanNumber = this.generateLoanNumber();
    const tenantId = this.ctx.getTenantId()!;

    const repo = this.ctx.repo(LoanEntity);
    const loan = repo.create({
      tenantId,
      memberId: input.memberId,
      loanNumber,
      requestedAmount: input.requestedAmount,
      termMonths: input.termMonths,
      purpose: input.purpose ?? null,
      status: 'pending',
      appliedAt: new Date(),
    });

    const saved = await repo.save(loan);
    return this.toRow(saved);
  }

  // ------------------------------------------------------ checkEligibility

  /**
   * Queries the Savings vertical for the member's ceiling (savings balance ×
   * multiplier). A request over the ceiling is rejected with a reason message
   * so the applicant sees exactly why.
   */
  async checkEligibility(input: LoanApplicationInput): Promise<EligibilityDecision> {
    const ceiling = await this.savingsSharesService.getLoanEligibilityCeiling(
      input.memberId,
    );

    const requested = parseFloat(input.requestedAmount);
    const max = parseFloat(ceiling.maxLoanAmount);
    const reasons: string[] = [];

    if (requested <= 0) {
      reasons.push('Requested amount must be greater than zero');
    }

    if (max <= 0) {
      reasons.push('Member has no eligible savings balance to back a loan');
    } else if (requested > max) {
      reasons.push(
        `Requested amount ${input.requestedAmount} exceeds the allowed ceiling of ${ceiling.maxLoanAmount} (savings × ${ceiling.multiplier})`,
      );
    }

    return {
      eligible: reasons.length === 0,
      maxAmount: ceiling.maxLoanAmount,
      reasons,
    };
  }

  // ------------------------------------------------------ decideApproval

  /**
   * Moves a `pending` loan to `approved` or `rejected`.
   * Only a loan in `pending` status can be acted on; anything else is a 409.
   */
  async decideApproval(input: ApprovalDecisionInput): Promise<LoanRow> {
    const repo = this.ctx.repo(LoanEntity);
    const loan = await this.requireLoan(repo, input.loanId);

    if (loan.status !== 'pending') {
      throw new ConflictException(
        `Loan ${input.loanId} is in status '${loan.status}' — only 'pending' loans can be approved or rejected`,
      );
    }

    loan.status = input.approved ? 'approved' : 'rejected';
    loan.approvedBy = input.approvedBy;
    loan.approvalNote = input.note ?? null;
    loan.approvedAt = new Date();
    if (input.approved) {
      // When approving, set approvedAmount to match the requested amount unless
      // the approver passes a different figure (partial approval — future enhancement).
      loan.approvedAmount = loan.requestedAmount;
    }

    const saved = await repo.save(loan);
    return this.toRow(saved);
  }

  // ---------------------------------------------------------------- disburse

  /**
   * Posts the loan principal to the member's savings account via the ledger.
   * Only an `approved` loan can be disbursed.
   *
   * TODO(Task 13 — Obsan): replace the placeholder comment with an actual
   * `this.ledger.post(...)` call once `LedgerModule` is merged. The ledger
   * entry should debit the SACCO's loan fund account and credit
   * `input.destinationAccountId` for `input.amount`.
   */
  async disburse(input: DisbursementInput): Promise<LoanRepaymentRow> {
    const repo = this.ctx.repo(LoanEntity);
    const loan = await this.requireLoan(repo, input.loanId);

    if (loan.status !== 'approved') {
      throw new ConflictException(
        `Loan ${input.loanId} is in status '${loan.status}' — only 'approved' loans can be disbursed`,
      );
    }

    const disbursedAmount = parseFloat(input.amount);
    const approvedAmount = parseFloat(loan.approvedAmount ?? '0');

    if (disbursedAmount > approvedAmount) {
      throw new BadRequestException(
        `Disbursement amount ${input.amount} exceeds approved amount ${loan.approvedAmount}`,
      );
    }

    // TODO(Task 13): this.ledger.post({ ... debit fund account, credit destinationAccountId ... })

    loan.status = 'disbursed';
    loan.disbursedAmount = input.amount;
    loan.disbursedToAccountId = input.destinationAccountId;
    loan.disbursedAt = new Date();
    await repo.save(loan);

    // Record disbursement as a synthetic repayment row for audit trail
    const repaymentRepo = this.ctx.repo(LoanRepaymentEntity);
    const entry = repaymentRepo.create({
      tenantId: loan.tenantId,
      loanId: loan.id,
      amount: input.amount,
      reference: `DISBURSEMENT:${loan.loanNumber}`,
      paidAt: new Date(),
    });
    const saved = await repaymentRepo.save(entry);
    return this.toRepaymentRow(saved);
  }

  // -------------------------------------------------------- recordRepayment

  /**
   * Records a repayment event and posts it through the ledger.
   * If the total repaid equals or exceeds the disbursed amount the loan is
   * marked `repaid`. Partial repayments are allowed.
   *
   * TODO(Task 13 — Obsan): replace the placeholder with a real ledger posting
   * that debits the member's savings account and credits the SACCO's loan
   * collections account.
   */
  async recordRepayment(input: RepaymentInput): Promise<LoanRepaymentRow> {
    const loanRepo = this.ctx.repo(LoanEntity);
    const loan = await this.requireLoan(loanRepo, input.loanId);

    if (loan.status !== 'disbursed') {
      throw new ConflictException(
        `Loan ${input.loanId} is in status '${loan.status}' — only 'disbursed' loans accept repayments`,
      );
    }

    // TODO(Task 13): this.ledger.post({ ... debit member account, credit SACCO collections ... })

    const repaymentRepo = this.ctx.repo(LoanRepaymentEntity);
    const entry = repaymentRepo.create({
      tenantId: loan.tenantId,
      loanId: loan.id,
      amount: input.amount,
      reference: input.reference ?? null,
      paidAt: new Date(),
    });
    const saved = await repaymentRepo.save(entry);

    // Check if fully repaid: sum all repayments (excluding the synthetic disbursement row)
    const allRepayments = await repaymentRepo.find({ where: { loanId: loan.id } });
    const realRepayments = allRepayments.filter(
      (r) => !r.reference?.startsWith('DISBURSEMENT:'),
    );
    const totalRepaid = realRepayments.reduce(
      (sum, r) => sum + parseFloat(r.amount),
      0,
    );
    const disbursed = parseFloat(loan.disbursedAmount ?? '0');

    if (totalRepaid >= disbursed) {
      loan.status = 'repaid';
      await loanRepo.save(loan);
    }

    return this.toRepaymentRow(saved);
  }

  // ---------------------------------------------------------------- findById

  async findById(loanId: string): Promise<LoanRow> {
    const repo = this.ctx.repo(LoanEntity);
    const loan = await this.requireLoan(repo, loanId);
    return this.toRow(loan);
  }

  // ---------------------------------------------------------- findByMemberId

  /**
   * Fetches all loans associated with a specific member.
   * Required for Member Self-Service API (Task 23).
   */
  async findByMemberId(memberId: string): Promise<LoanRow[]> {
    const repo = this.ctx.repo(LoanEntity);
    const loans = await repo.find({
      where: { memberId },
      order: { appliedAt: 'DESC' },
    });
    return loans.map((loan) => this.toRow(loan));
  }


  // ------------------------------------------------ guarantor stubs (Task 17)

  /** Records the pledge and holds the amount on the guarantor's own savings account. */
  recordGuarantorPledge(_input: GuarantorPledgeInput): Promise<GuarantorPledge> {
    throw new NotImplementedException(
      'LoanService.recordGuarantorPledge is not implemented (Task 17)',
    );
  }

  releaseGuarantorPledge(_pledgeId: string): Promise<GuarantorPledge> {
    throw new NotImplementedException(
      'LoanService.releaseGuarantorPledge is not implemented (Task 17)',
    );
  }

  // ---------------------------------------------------------------- helpers

  private async requireLoan(
    repo: Repository<LoanEntity>,
    loanId: string,
  ): Promise<LoanEntity> {
    const loan = await repo.findOne({ where: { id: loanId } });
    if (!loan) {
      throw new NotFoundException(`Loan ${loanId} not found`);
    }
    return loan;
  }

  private generateLoanNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 900_000) + 100_000; // 6-digit
    return `LN-${year}-${random}`;
  }

  private toRow(entity: LoanEntity): LoanRow {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      memberId: entity.memberId,
      loanNumber: entity.loanNumber,
      requestedAmount: entity.requestedAmount,
      approvedAmount: entity.approvedAmount,
      disbursedAmount: entity.disbursedAmount,
      termMonths: entity.termMonths,
      purpose: entity.purpose,
      status: entity.status,
      appliedBy: entity.appliedBy,
      approvedBy: entity.approvedBy,
      approvalNote: entity.approvalNote,
      disbursedToAccountId: entity.disbursedToAccountId,
      appliedAt: entity.appliedAt,
      approvedAt: entity.approvedAt,
      disbursedAt: entity.disbursedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toRepaymentRow(entity: LoanRepaymentEntity): LoanRepaymentRow {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      loanId: entity.loanId,
      amount: entity.amount,
      reference: entity.reference,
      paidAt: entity.paidAt,
    };
  }
}
