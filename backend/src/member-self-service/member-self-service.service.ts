import { Injectable } from '@nestjs/common';
import { MemberService } from '../members';
import { SavingsSharesService } from '../savings-shares';
import type { MemberId } from '../types';
import type { MemberStatementQueryDto } from './dto/member-statement-query.dto';
import type {
  MemberBalanceView,
  MemberLoansView,
  MemberStatementView,
} from './member-self-service.types';

/**
 * Member Self-Service vertical — owner: **Liya** (Task 23).
 *
 * Aggregates data from the Savings & Shares vertical (via `SavingsSharesService`)
 * and the Members vertical (via `MemberService`) into member-facing views. This
 * service never accesses entity repositories directly; all persistence goes through
 * the injected services following the project's module-boundary convention.
 *
 * Loan data is **not yet available**: `LoanService.findByMemberId()` has not been
 * implemented by Abenezer (Task 18 / dependency for Task 23). Once that method is
 * merged to main, inject `LoanService` here, import `LoanModule` in the module
 * file, and replace the `getLoans()` implementation below.
 */
@Injectable()
export class MemberSelfServiceService {
  constructor(
    private readonly memberService: MemberService,
    private readonly savingsSharesService: SavingsSharesService,
  ) {}

  // ----------------------------------------------------------------- getBalance

  /**
   * Returns all savings & share accounts for a member.
   *
   * Uses:
   *   - `MemberService.findById(memberId)`            → validates member existence
   *   - `SavingsSharesService.getAccountsByMember(memberId)` → real account data
   */
  async getBalance(memberId: MemberId): Promise<MemberBalanceView> {
    const member = await this.memberService.findById(memberId);
    const accounts = await this.savingsSharesService.getAccountsByMember(memberId);

    return {
      memberId: member.id,
      memberNumber: member.memberNumber,
      fullName: member.fullName,
      accounts,
      asOf: new Date().toISOString(),
    };
  }

  // --------------------------------------------------------------- getStatement

  /**
   * Returns the transaction history across all accounts of a member.
   *
   * Uses:
   *   - `MemberService.findById(memberId)`                          → validates member
   *   - `SavingsSharesService.getTransactionsByMember(memberId, filter)` → real ledger data
   *
   * Optional filter fields (`from`, `to`, `limit`, `offset`) map directly to
   * `TransactionHistoryFilter` in the Savings & Shares module.
   */
  async getStatement(
    memberId: MemberId,
    query: MemberStatementQueryDto,
  ): Promise<MemberStatementView> {
    const member = await this.memberService.findById(memberId);
    const transactions = await this.savingsSharesService.getTransactionsByMember(memberId, {
      fromDate: query.from,
      toDate: query.to,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      memberId: member.id,
      memberNumber: member.memberNumber,
      fullName: member.fullName,
      transactions,
      asOf: new Date().toISOString(),
    };
  }

  // ------------------------------------------------------------------ getLoans

  /**
   * Returns the member's loan portfolio.
   *
   * ⚠️  DEPENDENCY UNAVAILABLE — blocked on Abenezer (Task 18).
   *
   * `LoanService.findByMemberId()` does not yet exist on `main` (verified
   * 2026-08-25: loan.service.ts only exposes `findById(loanId: string)`).
   * Until that method is merged:
   *   - Member existence is still validated via `MemberService.findById()`.
   *   - No mock loan data is returned.
   *   - `status` is set to `'dependency_unavailable'` so the frontend can show
   *     an appropriate "not yet available" state rather than an empty table.
   *   - `loans` is always `[]`.
   *
   * TODO(Task 23 → wire loans): When Abenezer merges `findByMemberId` (or its
   * equivalent), do the following:
   *   1. Import `LoanService` from `'../loans'`.
   *   2. Add `LoanModule` to the imports array in `member-self-service.module.ts`.
   *   3. Inject `private readonly loanService: LoanService` in this constructor.
   *   4. Replace the body below with a real call and set `status: 'available'`.
   */
  async getLoans(memberId: MemberId): Promise<MemberLoansView> {
    const member = await this.memberService.findById(memberId);

    return {
      memberId: member.id,
      memberNumber: member.memberNumber,
      fullName: member.fullName,
      status: 'dependency_unavailable',
      loans: [],
    };
  }
}
