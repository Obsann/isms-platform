import { Controller, Get, Param, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles, type AuthenticatedUser } from '../common';
import { MemberStatementQueryDto } from './dto/member-statement-query.dto';
import { MemberSelfServiceService } from './member-self-service.service';
import type {
  MemberBalanceView,
  MemberLoansView,
  MemberStatementView,
} from './member-self-service.types';

/**
 * Member Self-Service endpoints — owner: **Liya** (Task 23).
 *
 * All routes are scoped under `/members/:id` so they sit alongside the existing
 * `MemberController` routes without conflicting (NestJS routes each controller
 * independently; path conflicts within the same module are prevented by route
 * ordering, but these controllers live in separate modules so there is no risk).
 *
 * Route overview:
 *   GET /members/:id/balance   → account balances (real data via SavingsSharesService)
 *   GET /members/:id/statement → transaction history (real data via SavingsSharesService)
 *   GET /members/:id/loans     → loan portfolio (dependency_unavailable until Task 18 is merged)
 */
@Controller('members/:id')
export class MemberSelfServiceController {
  constructor(private readonly memberSelfService: MemberSelfServiceService) {}

  /**
   * `GET /members/:id/balance`
   *
   * Returns all savings & share accounts for the member with live balance figures.
   * Throws 404 if the member does not exist (propagated from MemberService).
   * Throws 403 if role is 'member' and requested ID does not match the authenticated user.
   */
  @Get('balance')
  @Roles('member', 'teller', 'tenant-admin', 'loan-officer')
  async getBalance(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MemberBalanceView> {
    await this.memberSelfService.assertCallerOwnsMember(user, id);
    return this.memberSelfService.getBalance(id);
  }

  /**
   * `GET /members/:id/statement`
   *
   * Returns transaction history across all accounts, newest-first.
   * Optional query params: `from` (YYYY-MM-DD), `to` (YYYY-MM-DD), `limit`, `offset`.
   * Throws 404 if the member does not exist (propagated from MemberService).
   * Throws 403 if role is 'member' and requested ID does not match the authenticated user.
   */
  @Get('statement')
  @Roles('member', 'teller', 'tenant-admin', 'loan-officer')
  async getStatement(
    @Param('id') id: string,
    @Query() query: MemberStatementQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MemberStatementView> {
    await this.memberSelfService.assertCallerOwnsMember(user, id);
    return this.memberSelfService.getStatement(id, query);
  }

  /**
   * `GET /members/:id/loans`
   *
   * Returns 200 with a typed `MemberLoansView`.
   * When `LoanService.findByMemberId()` is not yet available, `status` is
   * `'dependency_unavailable'` and `loans` is `[]`.
   * The frontend should use the `status` field to decide what to render.
   *
   * Always HTTP 200 — do NOT return 503 merely because the loan dependency is
   * unavailable; the `status` field carries that signal at the application layer.
   *
   * Throws 404 if the member does not exist (propagated from MemberService).
   * Throws 403 if role is 'member' and requested ID does not match the authenticated user.
   */
  @Get('loans')
  @Roles('member', 'teller', 'tenant-admin', 'loan-officer')
  async getLoans(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MemberLoansView> {
    await this.memberSelfService.assertCallerOwnsMember(user, id);
    return this.memberSelfService.getLoans(id);
  }
}
