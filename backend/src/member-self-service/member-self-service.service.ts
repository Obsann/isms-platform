import { Injectable } from '@nestjs/common';
import { LoanService } from '../loans';
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
 * Aggregates data from the Savings & Shares vertical (via `SavingsSharesService`),
 * the Members vertical (via `MemberService`), and the Loans vertical (via `LoanService`)
 * into member-facing views.
 */
@Injectable()
export class MemberSelfServiceService {
  constructor(
    private readonly memberService: MemberService,
    private readonly savingsSharesService: SavingsSharesService,
    private readonly loanService: LoanService,
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
   * Uses:
   *   - `MemberService.findById(memberId)`           → validates member existence
   *   - `LoanService.findByMemberId(memberId)`       → real loan data
   */
  async getLoans(memberId: MemberId): Promise<MemberLoansView> {
    const member = await this.memberService.findById(memberId);
    const loans = await this.loanService.findByMemberId(memberId);

    const mappedLoans = loans.map((loan) => ({
      loanId: loan.id,
      loanNumber: loan.loanNumber,
      requestedAmount: loan.requestedAmount,
      approvedAmount: loan.approvedAmount,
      disbursedAmount: loan.disbursedAmount,
      termMonths: loan.termMonths,
      purpose: loan.purpose,
      status: loan.status,
      appliedAt: loan.appliedAt.toISOString(),
    }));

    return {
      memberId: member.id,
      memberNumber: member.memberNumber,
      fullName: member.fullName,
      status: 'available',
      loans: mappedLoans,
    };
  }
}
