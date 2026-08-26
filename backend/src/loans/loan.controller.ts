import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common';
import type { PaginatedResult } from '../types';
import { AddGuarantorPledgeDto } from './dto/add-guarantor-pledge.dto';
import { ApplyLoanDto } from './dto/apply-loan.dto';
import { ApproveLoanDto } from './dto/approve-loan.dto';
import { DisburseLoanDto } from './dto/disburse-loan.dto';
import { LoanSearchQueryDto } from './dto/loan-search-query.dto';
import { RepayLoanDto } from './dto/repay-loan.dto';
import { LoanService } from './loan.service';
import type { EligibilityDecision, GuarantorPledge, LoanRepaymentRow, LoanRow } from './loan.types';

/**
 * Loans & Credit REST surface — owner: **Abenezer** (Tasks 16–17).
 *
 * All routes require a valid JWT (`JwtAuthGuard` is global) and a resolved
 * tenant context (`TenantContextGuard` is global). No `@Public()` here.
 *
 * Route map:
 *   POST   /api/loans                            → apply for a loan
 *   GET    /api/loans/:id                        → fetch loan by id
 *   GET    /api/loans/:id/eligibility            → check eligibility without applying
 *   PATCH  /api/loans/:id/approve                → approve or reject (loan officer)
 *   POST   /api/loans/:id/disburse               → disburse to member account
 *   POST   /api/loans/:id/repayments             → record a repayment
 *   POST   /api/loans/:id/guarantors             → record a guarantor pledge (holds funds)
 *   GET    /api/loans/:id/guarantors             → list guarantor pledges for loan
 *   POST   /api/loans/guarantors/:pledgeId/release → release a guarantor pledge hold
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

  /** Fetch all loans for the current tenant with optional search, status filtering, and pagination. */
  @Get()
  findAll(@Query() query: LoanSearchQueryDto): Promise<PaginatedResult<LoanRow>> {
    return this.loanService.findAll(query);
  }

  /** Fetch all loans for a specific member by memberId (Task 23 integration). */
  @Get('member/:memberId')
  findByMemberId(@Param('memberId', ParseUUIDPipe) memberId: string): Promise<LoanRow[]> {
    return this.loanService.findByMemberId(memberId);
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
   * Posts through the ledger.
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
   * Posts through the ledger.
   * Automatically marks the loan `repaid` and releases guarantor holds when fully settled.
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

  /**
   * Record a guarantor pledge against a pending or approved loan application.
   * Places a hold on the guarantor's savings account via `LedgerService.holdFunds()`.
   */
  @Post(':id/guarantors')
  recordGuarantorPledge(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddGuarantorPledgeDto,
  ): Promise<GuarantorPledge> {
    return this.loanService.recordGuarantorPledge({
      loanId: id,
      guarantorMemberId: dto.guarantorMemberId,
      guarantorAccountId: dto.guarantorAccountId,
      pledgedAmount: dto.pledgedAmount,
    });
  }

  /**
   * List all guarantor pledges recorded for a specific loan.
   */
  @Get(':id/guarantors')
  getGuarantorPledgesForLoan(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GuarantorPledge[]> {
    return this.loanService.getGuarantorPledgesForLoan(id);
  }

  /**
   * Manually release a guarantor hold and mark pledge status as released.
   */
  @Post('guarantors/:pledgeId/release')
  releaseGuarantorPledge(
    @Param('pledgeId', ParseUUIDPipe) pledgeId: string,
  ): Promise<GuarantorPledge> {
    return this.loanService.releaseGuarantorPledge(pledgeId);
  }
}
