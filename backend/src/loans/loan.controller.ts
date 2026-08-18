import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common';
import { ApplyLoanDto } from './dto/apply-loan.dto';
import { ApproveLoanDto } from './dto/approve-loan.dto';
import { DisburseLoanDto } from './dto/disburse-loan.dto';
import { RepayLoanDto } from './dto/repay-loan.dto';
import { LoanService } from './loan.service';
import type { EligibilityDecision, LoanRepaymentRow, LoanRow } from './loan.types';

/**
 * Loans & Credit REST surface — owner: **Abenezer** (Task 16).
 *
 * All routes require a valid JWT (`JwtAuthGuard` is global) and a resolved
 * tenant context (`TenantContextGuard` is global). No `@Public()` here.
 *
 * Route map:
 *   POST   /api/loans                  → apply for a loan
 *   GET    /api/loans/:id              → fetch loan by id
 *   GET    /api/loans/:id/eligibility  → check eligibility without applying
 *   PATCH  /api/loans/:id/approve      → approve or reject (loan officer)
 *   POST   /api/loans/:id/disburse     → disburse to member account
 *   POST   /api/loans/:id/repayments   → record a repayment
 */
@Controller('loans')
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  /** Submit a new loan application. Returns the created loan in `pending` status. */
  @Post()
  apply(@Body() dto: ApplyLoanDto): Promise<LoanRow> {
    return this.loanService.apply({
      memberId: dto.memberId,
      requestedAmount: dto.requestedAmount,
      termMonths: dto.termMonths,
      purpose: dto.purpose,
    });
  }

  /** Fetch a single loan by its id. 404 if not found or belongs to another tenant (RLS). */
  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string): Promise<LoanRow> {
    return this.loanService.findById(id);
  }

  /**
   * Check eligibility without creating an application.
   * Useful for a loan-calculator screen before the member formally applies.
   */
  @Get(':id/eligibility')
  async checkEligibility(@Param('id', ParseUUIDPipe) id: string): Promise<EligibilityDecision> {
    const loan = await this.loanService.findById(id);
    return this.loanService.checkEligibility({
      memberId: loan.memberId,
      requestedAmount: loan.requestedAmount,
      termMonths: loan.termMonths,
      purpose: loan.purpose ?? undefined,
    });
  }

  /**
   * Approve or reject a pending loan.
   * `approved: true` → moves to `approved`; `false` → moves to `rejected`.
   * The caller's staff id is taken from the JWT (no need to pass it in the body).
   */
  @Patch(':id/approve')
  decideApproval(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveLoanDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LoanRow> {
    return this.loanService.decideApproval({
      loanId: id,
      approvedBy: user.staffId,
      approved: dto.approved,
      note: dto.note,
    });
  }

  /**
   * Disburse an approved loan to the member's savings account.
   * Amount must not exceed the `approvedAmount`.
   * Posts through the ledger (Task 13 TODO).
   */
  @Post(':id/disburse')
  disburse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DisburseLoanDto,
  ): Promise<LoanRepaymentRow> {
    return this.loanService.disburse({
      loanId: id,
      destinationAccountId: dto.destinationAccountId,
      amount: dto.amount,
    });
  }

  /**
   * Record a repayment against a disbursed loan.
   * Posts through the ledger (Task 13 TODO).
   * Automatically marks the loan `repaid` when fully settled.
   */
  @Post(':id/repayments')
  recordRepayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RepayLoanDto,
  ): Promise<LoanRepaymentRow> {
    return this.loanService.recordRepayment({
      loanId: id,
      amount: dto.amount,
      reference: dto.reference,
    });
  }
}
