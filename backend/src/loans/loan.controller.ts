import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles, type AuthenticatedUser } from '../common';
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
 * Loans & Credit REST surface — owner: **Abenezer** (Tasks 16–18).
 *
 * All routes require a valid JWT (`JwtAuthGuard` is global) and a resolved
 * tenant context (`TenantContextGuard` is global). Protected by `@Roles(...)` (Task 22).
 *
 * Route map:
 *   POST   /api/loans                            → apply for a loan (teller, loan-officer, tenant-admin, member)
 *   GET    /api/loans                            → list loans (teller, loan-officer, tenant-admin, super-admin)
 *   GET    /api/loans/member/:memberId           → loans by member (teller, loan-officer, tenant-admin, member)
 *   GET    /api/loans/:id                        → fetch loan by id (teller, loan-officer, tenant-admin, member)
 *   GET    /api/loans/:id/eligibility            → check eligibility (teller, loan-officer, tenant-admin, member)
 *   PATCH  /api/loans/:id/approve                → approve/reject (loan-officer, tenant-admin, super-admin)
 *   POST   /api/loans/:id/disburse               → disburse to member account (loan-officer, tenant-admin)
 *   POST   /api/loans/:id/repayments             → record a repayment (teller, tenant-admin, loan-officer)
 *   POST   /api/loans/:id/guarantors             → record guarantor pledge (teller, loan-officer, tenant-admin)
 *   GET    /api/loans/:id/guarantors             → list guarantor pledges (teller, loan-officer, tenant-admin, member)
 *   POST   /api/loans/guarantors/:pledgeId/release → release guarantor hold (loan-officer, tenant-admin)
 */
@Controller('loans')
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  /** Submit a new loan application. Returns the created loan in `pending` status. */
  @Post()
  @Roles('teller', 'loan-officer', 'tenant-admin', 'member')
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
  @Roles('teller', 'loan-officer', 'tenant-admin', 'super-admin')
  findAll(@Query() query: LoanSearchQueryDto): Promise<PaginatedResult<LoanRow>> {
    return this.loanService.findAll(query);
  }

  /** Fetch all loans for a specific member by memberId (Task 23 integration). */
  @Get('member/:memberId')
  @Roles('teller', 'loan-officer', 'tenant-admin', 'member')
  findByMemberId(@Param('memberId', ParseUUIDPipe) memberId: string): Promise<LoanRow[]> {
    return this.loanService.findByMemberId(memberId);
  }

  /** Fetch a single loan by its id or human loan number. 404 if not found or belongs to another tenant (RLS). */
  @Get(':id')
  @Roles('teller', 'loan-officer', 'tenant-admin', 'member')
  findById(@Param('id') id: string): Promise<LoanRow> {
    return this.loanService.findByIdOrNumber(id);
  }

  /**
   * Check eligibility without creating an application.
   * Useful for a loan-calculator screen before the member formally applies.
   */
  @Get(':id/eligibility')
  @Roles('teller', 'loan-officer', 'tenant-admin', 'member')
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
   * Enforces the approval threshold routing rule (FR-3.2 / D-30-02).
   */
  @Patch(':id/approve')
  @Roles('loan-officer', 'tenant-admin', 'super-admin')
  decideApproval(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveLoanDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LoanRow> {
    return this.loanService.decideApproval({
      loanId: id,
      approvedBy: user.staffId,
      approverRole: user.role,
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
  @Roles('loan-officer', 'tenant-admin')
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
  @Roles('teller', 'tenant-admin', 'loan-officer')
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
  @Roles('teller', 'loan-officer', 'tenant-admin')
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
  @Roles('teller', 'loan-officer', 'tenant-admin', 'member')
  getGuarantorPledgesForLoan(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GuarantorPledge[]> {
    return this.loanService.getGuarantorPledgesForLoan(id);
  }

  /**
   * Manually release a guarantor hold and mark pledge status as released.
   */
  @Post('guarantors/:pledgeId/release')
  @Roles('loan-officer', 'tenant-admin')
  releaseGuarantorPledge(
    @Param('pledgeId', ParseUUIDPipe) pledgeId: string,
  ): Promise<GuarantorPledge> {
    return this.loanService.releaseGuarantorPledge(pledgeId);
  }
}
