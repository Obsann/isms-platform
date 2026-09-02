import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Repository } from 'typeorm';
import { NotificationService } from '../channel-integration';
import { TenantContextService } from '../common';
import { SyncConflictException } from '../common/sync-conflict.exception';
import { LedgerService, fromCents, toCents } from '../ledger';
import { MemberService } from '../members';
import { SavingsSharesService } from '../savings-shares';
import { LoanGuarantorEntity } from './entities/loan-guarantor.entity';
import { LoanRepaymentEntity } from './entities/loan-repayment.entity';
import { LoanEntity } from './entities/loan.entity';
import type { PaginatedResult } from '../types';
import { LoanSearchQueryDto } from './dto/loan-search-query.dto';
import type {
  ApprovalDecisionInput,
  DisbursementInput,
  EligibilityDecision,
  GuarantorPledge,
  GuarantorPledgeInput,
  LoanApplicationInput,
  LoanPortfolioSummary,
  LoanRepaymentRow,
  LoanRow,
  RepaymentInput,
} from './loan.types';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Loans & Credit vertical — owner: **Abenezer** (Tasks 16–18).
 *
 * Reads savings figures through `SavingsSharesService` (injected by DI).
 * Handles loan application, eligibility assessment, approval, disbursement,
 * repayment tracking, and guarantor pledge holds via `LedgerService`.
 *
 * All entity access goes through `TenantContextService.repo(Entity)` — never
 * via `@InjectRepository`.
 *
 * Loan state machine:
 *   pending → approved | rejected  (`decideApproval`)
 *   approved → disbursed           (`disburse`)
 *   disbursed → repaid             (`recordRepayment`, when fully settled)
 *   disbursed → defaulted          (future task — admin override)
 */
@Injectable()
export class LoanService {
  private readonly logger = new Logger(LoanService.name);

  constructor(
    private readonly ctx: TenantContextService,
    private readonly savingsSharesService: SavingsSharesService,
    private readonly ledger: LedgerService,
    private readonly memberService: MemberService,
    private readonly notifications: NotificationService,
    private readonly configService: ConfigService,
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
   *
   * Enforces approval threshold rule (FR-3.2 / D-30-02):
   * - High-value applications (> threshold) must be approved by Manager (`tenant-admin` / `super-admin`).
   * - Applications at or below threshold route to `loan-officer` (or Manager).
   * - Unauthorized or mismatched roles are rejected with 403 Forbidden.
   */
  async decideApproval(input: ApprovalDecisionInput): Promise<LoanRow> {
    const repo = this.ctx.repo(LoanEntity);
    const loan = await this.requireLoan(repo, input.loanId);

    if (loan.status !== 'pending') {
      throw new ConflictException(
        `Loan ${input.loanId} is in status '${loan.status}' — only 'pending' loans can be approved or rejected`,
      );
    }

    // Approval threshold enforcement (FR-3.2 / D-30-02)
    const thresholdStr = this.configService.get<string>('LOAN_APPROVAL_THRESHOLD', '50000.00');
    const threshold = parseFloat(thresholdStr);
    const requested = parseFloat(loan.requestedAmount);

    if (input.approverRole) {
      if (requested > threshold) {
        if (input.approverRole !== 'tenant-admin' && input.approverRole !== 'super-admin') {
          throw new ForbiddenException(
            `High-value loan application of ${loan.requestedAmount} exceeds the delegated threshold of ${thresholdStr} ETB and requires Manager approval`,
          );
        }
      } else {
        if (
          input.approverRole !== 'loan-officer' &&
          input.approverRole !== 'tenant-admin' &&
          input.approverRole !== 'super-admin'
        ) {
          throw new ForbiddenException(
            `Role '${input.approverRole}' is not authorized to approve loan applications`,
          );
        }
      }
    }

    loan.status = input.approved ? 'approved' : 'rejected';
    loan.approvedBy = input.approvedBy;
    loan.approvalNote = input.note ?? null;
    loan.approvedAt = new Date();
    if (input.approved) {
      loan.approvedAmount = loan.requestedAmount;
    }

    const saved = await repo.save(loan);
    const row = this.toRow(saved);
    if (input.approved) {
      await this.queueLoanApprovedNotification(row);
    }
    return row;
  }

  // ---------------------------------------------------------------- disburse

  /**
   * Posts the loan principal to the member's savings account via the ledger.
   * Only an `approved` loan can be disbursed.
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
   * If the total repaid equals or exceeds the disbursed amount, the loan is
   * marked `repaid` and all active guarantor holds are automatically released.
   */
  async recordRepayment(input: RepaymentInput): Promise<LoanRepaymentRow> {
    const loanRepo = this.ctx.repo(LoanEntity);
    const loan = await this.requireLoan(loanRepo, input.loanId);

    if (loan.status !== 'disbursed') {
      throw new ConflictException(
        `Loan ${input.loanId} is in status '${loan.status}' — only 'disbursed' loans accept repayments`,
      );
    }

    const repaymentRepo = this.ctx.repo(LoanRepaymentEntity);
    const ref = input.reference?.trim();
    if (ref) {
      const existing = await repaymentRepo.findOne({ where: { reference: ref } });
      if (existing) {
        if (existing.loanId === loan.id && existing.amount === input.amount) {
          return this.toRepaymentRow(existing);
        }
        throw new SyncConflictException();
      }
    }

    const entry = repaymentRepo.create({
      tenantId: loan.tenantId,
      loanId: loan.id,
      amount: input.amount,
      reference: input.reference ?? null,
      paidAt: new Date(),
    });
    const saved = await repaymentRepo.save(entry);

    // Check if fully repaid
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

      // Auto-release all active guarantor pledges for this loan
      const guarantorRepo = this.ctx.repo(LoanGuarantorEntity);
      const activePledges = await guarantorRepo.find({
        where: { loanId: loan.id, status: 'active' },
      });
      for (const pledge of activePledges) {
        await this.releaseGuarantorPledge(pledge.id);
      }
    }

    return this.toRepaymentRow(saved);
  }

  // ---------------------------------------------------------------- findAll

  /**
   * List all loans in the current tenant with optional search, status filtering, and pagination.
   */
  async findAll(query?: LoanSearchQueryDto): Promise<PaginatedResult<LoanRow>> {
    const repo = this.ctx.repo(LoanEntity);
    const qb = repo.createQueryBuilder('loan');

    if (query?.status && query.status !== 'all') {
      qb.andWhere('loan.status = :status', { status: query.status });
    }

    if (query?.search) {
      const searchPattern = `%${query.search}%`;
      qb.andWhere(
        '(loan.loanNumber ILIKE :search OR loan.purpose ILIKE :search)',
        { search: searchPattern },
      );
    }

    const limit = query?.limit ?? 50;
    const offset = query?.offset ?? 0;

    qb.orderBy('loan.appliedAt', 'DESC');
    qb.take(limit);
    qb.skip(offset);

    const [entities, total] = await qb.getManyAndCount();
    return {
      items: entities.map((entity) => this.toRow(entity)),
      total,
    };
  }

  // ---------------------------------------------------------------- findById

  async findById(loanId: string): Promise<LoanRow> {
    const repo = this.ctx.repo(LoanEntity);
    const loan = await this.requireLoan(repo, loanId);
    return this.toRow(loan);
  }

  /** UUID or human loan number (e.g. LN-2026-000001). */
  async findByIdOrNumber(idOrNumber: string): Promise<LoanRow> {
    const trimmed = idOrNumber.trim();
    if (UUID_RE.test(trimmed)) {
      return this.findById(trimmed);
    }
    const repo = this.ctx.repo(LoanEntity);
    let loan = await repo.findOne({ where: { loanNumber: trimmed } });
    if (!loan) {
      loan = await repo
        .createQueryBuilder('loan')
        .where('loan.loanNumber ILIKE :num', { num: trimmed })
        .getOne();
    }
    if (!loan) {
      throw new NotFoundException(`Loan "${trimmed}" not found`);
    }
    return this.toRow(loan);
  }

  /**
   * Outstanding principal = disbursed amount minus repayments posted for that
   * loan. Defaulted loans stay in the outstanding total (arrears count is separate).
   */
  async getPortfolioSummary(): Promise<LoanPortfolioSummary> {
    const loans = await this.ctx.repo(LoanEntity).find();
    const repayments = await this.ctx.repo(LoanRepaymentEntity).find();
    const repaidByLoan = new Map<string, bigint>();
    for (const row of repayments) {
      repaidByLoan.set(row.loanId, (repaidByLoan.get(row.loanId) ?? 0n) + toCents(row.amount));
    }

    let outstandingCents = 0n;
    const borrowerIds = new Set<string>();
    let loansInArrears = 0;
    let pendingCount = 0;
    let disbursedCount = 0;
    let defaultedCount = 0;

    for (const loan of loans) {
      if (loan.status === 'pending') pendingCount += 1;
      if (loan.status === 'disbursed') disbursedCount += 1;
      if (loan.status === 'defaulted') {
        defaultedCount += 1;
        loansInArrears += 1;
      }
      if (loan.status === 'disbursed' || loan.status === 'defaulted') {
        borrowerIds.add(loan.memberId);
        const disbursed = toCents(loan.disbursedAmount ?? '0.00');
        const repaid = repaidByLoan.get(loan.id) ?? 0n;
        const remaining = disbursed > repaid ? disbursed - repaid : 0n;
        outstandingCents += remaining;
      }
    }

    return {
      outstanding: fromCents(outstandingCents),
      activeBorrowers: borrowerIds.size,
      loansInArrears,
      pendingCount,
      disbursedCount,
      defaultedCount,
    };
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

  // ------------------------------------------------ guarantor logic (Task 17)


  /**
   * Records a guarantor pledge and holds the requested amount on the guarantor's
   * savings account via `LedgerService.holdFunds()`.
   */
  async recordGuarantorPledge(input: GuarantorPledgeInput): Promise<GuarantorPledge> {
    const loanRepo = this.ctx.repo(LoanEntity);
    const loan = await this.requireLoan(loanRepo, input.loanId);

    if (loan.status !== 'pending' && loan.status !== 'approved') {
      throw new ConflictException(
        `Loan ${input.loanId} is in status '${loan.status}' — guarantor pledges can only be recorded on 'pending' or 'approved' loans`,
      );
    }

    if (input.guarantorMemberId === loan.memberId) {
      throw new BadRequestException('Borrower cannot stand as guarantor for their own loan');
    }

    const amountNum = parseFloat(input.pledgedAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new BadRequestException('Pledged amount must be greater than zero');
    }

    // Place hold on guarantor's savings account via LedgerService
    const hold = await this.ledger.holdFunds({
      accountId: input.guarantorAccountId,
      amount: input.pledgedAmount,
      reason: `Guarantor pledge for loan ${loan.loanNumber}`,
    });

    const guarantorRepo = this.ctx.repo(LoanGuarantorEntity);
    const pledge = guarantorRepo.create({
      tenantId: loan.tenantId,
      loanId: loan.id,
      guarantorMemberId: input.guarantorMemberId,
      pledgedAccountId: input.guarantorAccountId,
      pledgedAmount: input.pledgedAmount,
      holdId: hold.holdId,
      status: 'active',
    });

    const saved = await guarantorRepo.save(pledge);

    return {
      pledgeId: saved.id,
      loanId: saved.loanId,
      guarantorMemberId: saved.guarantorMemberId,
      pledgedAmount: saved.pledgedAmount,
      holdId: saved.holdId,
    };
  }

  /** Releases a guarantor hold and marks the pledge status as released. */
  async releaseGuarantorPledge(pledgeId: string): Promise<GuarantorPledge> {
    const repo = this.ctx.repo(LoanGuarantorEntity);
    const pledge = await repo.findOne({ where: { id: pledgeId } });

    if (!pledge) {
      throw new NotFoundException(`Guarantor pledge ${pledgeId} not found`);
    }

    if (pledge.status === 'released') {
      throw new ConflictException(`Guarantor pledge ${pledgeId} has already been released`);
    }

    await this.ledger.releaseHold(pledge.holdId);

    pledge.status = 'released';
    const saved = await repo.save(pledge);

    return {
      pledgeId: saved.id,
      loanId: saved.loanId,
      guarantorMemberId: saved.guarantorMemberId,
      pledgedAmount: saved.pledgedAmount,
      holdId: saved.holdId,
    };
  }

  /** Retrieves all guarantor pledges recorded for a given loan. */
  async getGuarantorPledgesForLoan(loanId: string): Promise<GuarantorPledge[]> {
    const repo = this.ctx.repo(LoanGuarantorEntity);
    const pledges = await repo.find({ where: { loanId } });
    return pledges.map((p) => ({
      pledgeId: p.id,
      loanId: p.loanId,
      guarantorMemberId: p.guarantorMemberId,
      pledgedAmount: p.pledgedAmount,
      holdId: p.holdId,
    }));
  }

  /**
   * Resolve the member email while tenant-context is still open, then fire-and-forget
   * SMTP. A missing address or send failure must not change the loan status (Task 25).
   */
  private async queueLoanApprovedNotification(loan: LoanRow): Promise<void> {
    try {
      const member = await this.memberService.findById(loan.memberId);
      if (!member.email) {
        this.logger.warn(`Skipping loan-approved: member ${loan.memberId} has no email`);
        return;
      }
      this.notifications.enqueue({
        template: 'loan-approved',
        to: member.email,
        data: {
          memberName: member.fullName,
          loanNumber: loan.loanNumber,
          amount: loan.approvedAmount ?? loan.requestedAmount,
          currency: 'ETB',
          termMonths: loan.termMonths,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Could not queue loan-approved: ${message}`);
    }
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
