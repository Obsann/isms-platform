import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from '../channel-integration';
import { SyncConflictException } from '../common/sync-conflict.exception';
import { TenantContextService } from '../common';
import {
  LedgerService,
  addAmounts,
  fromCents,
  subtractAmounts,
  toCents,
} from '../ledger';
import { MemberService } from '../members';
import type { Account, AccountId, Amount, MemberId, Transaction } from '../types';
import { AccountEntity } from './account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { SavingsTransactionEntity } from './savings-transaction.entity';
import type {
  AccountBalance,
  DepositInput,
  FundsHold,
  HoldFundsInput,
  LoanEligibilityCeiling,
  SharePurchaseInput,
  TransactionHistoryFilter,
  WithdrawalInput,
} from './savings-shares.types';

/**
 * Savings & Shares vertical — owner: **Jerry** (Task 12).
 *
 * Account records live here; every balance and hold change is posted through
 * `LedgerService` (Task 13), never written in this module.
 */
@Injectable()
export class SavingsSharesService {
  private readonly logger = new Logger(SavingsSharesService.name);

  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly configService: ConfigService,
    private readonly memberService: MemberService,
    private readonly ledger: LedgerService,
    private readonly notifications: NotificationService,
  ) {}

  /** Create a new savings or share account for a member. */
  async createAccount(dto: CreateAccountDto): Promise<Account> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new UnauthorizedException('No tenant context found');
    }

    // Check member existence using MemberService via NestJS DI (module boundary compliant)
    await this.memberService.findById(dto.memberId);

    const accountRepo = this.tenantContext.repo(AccountEntity);
    const accountNumber = this.generateAccountNumber(dto.type);

    const account = accountRepo.create({
      tenantId,
      memberId: dto.memberId,
      accountNumber,
      type: dto.type,
      status: 'active',
      balance: '0.00',
      heldAmount: '0.00',
      currency: 'ETB',
      openedAt: dto.openedAt ?? new Date().toISOString().split('T')[0],
    });

    const saved = await accountRepo.save(account);
    return this.mapAccountToContract(saved);
  }

  /** Deposit funds into an active savings account. */
  async deposit(input: DepositInput): Promise<Transaction> {
    const accountRepo = this.tenantContext.repo(AccountEntity);
    const account = await accountRepo.findOne({ where: { id: input.accountId } });
    if (!account) {
      throw new NotFoundException(`Account with ID "${input.accountId}" not found`);
    }
    if (account.status !== 'active') {
      throw new UnprocessableEntityException(`Account is ${account.status}; deposits require an active account`);
    }

    this.validatePositiveAmount(input.amount);

    const replay = await this.resolveIdempotentSavingsTransaction(input.reference, {
      accountId: input.accountId,
      type: 'deposit',
      amount: input.amount,
    });
    if (replay) {
      return replay;
    }

    const txn = await this.ledger.postDeposit({
      accountId: account.id,
      amount: input.amount,
      currency: account.currency,
      reference: input.reference ?? null,
      narration: input.narration ?? null,
      postedByStaffId: input.postedByStaffId ?? null,
    });
    await this.queueAccountNotification(account.memberId, 'deposit-posted', txn, account.accountNumber);
    return txn;
  }

  /** Withdraw available funds from an active savings account. */
  async withdraw(input: WithdrawalInput): Promise<Transaction> {
    const accountRepo = this.tenantContext.repo(AccountEntity);
    const account = await accountRepo.findOne({ where: { id: input.accountId } });
    if (!account) {
      throw new NotFoundException(`Account with ID "${input.accountId}" not found`);
    }
    if (account.status !== 'active') {
      throw new UnprocessableEntityException(`Account is ${account.status}; withdrawals require an active account`);
    }

    this.validatePositiveAmount(input.amount);

    const replay = await this.resolveIdempotentSavingsTransaction(input.reference, {
      accountId: input.accountId,
      type: 'withdrawal',
      amount: input.amount,
    });
    if (replay) {
      return replay;
    }

    const txn = await this.ledger.postWithdrawal({
      accountId: account.id,
      amount: input.amount,
      currency: account.currency,
      reference: input.reference ?? null,
      narration: input.narration ?? null,
      postedByStaffId: input.postedByStaffId ?? null,
    });
    await this.queueAccountNotification(account.memberId, 'withdrawal-posted', txn, account.accountNumber);
    return txn;
  }

  /** Purchase shares for a member. */
  async purchaseShares(input: SharePurchaseInput): Promise<Transaction> {
    const accountRepo = this.tenantContext.repo(AccountEntity);
    let shareAccount = await accountRepo.findOne({
      where: { memberId: input.memberId, type: 'share' },
    });

    if (!shareAccount) {
      const created = await this.createAccount({
        memberId: input.memberId,
        type: 'share',
      });
      shareAccount = await accountRepo.findOneOrFail({ where: { id: created.id } });
    }

    if (shareAccount.status !== 'active') {
      throw new UnprocessableEntityException(`Share account is ${shareAccount.status}; share purchases require active status`);
    }

    this.validatePositiveAmount(input.amount);

    return this.ledger.postSharePurchase({
      accountId: shareAccount.id,
      amount: input.amount,
      currency: shareAccount.currency,
      reference: input.reference ?? null,
      postedByStaffId: input.postedByStaffId ?? null,
    });
  }

  /** Read account balance details (balance, heldAmount, availableBalance). */
  async getBalance(accountId: AccountId): Promise<AccountBalance> {
    const accountRepo = this.tenantContext.repo(AccountEntity);
    const account = await accountRepo.findOne({ where: { id: accountId } });
    if (!account) {
      throw new NotFoundException(`Account with ID "${accountId}" not found`);
    }

    const availableBalance = this.calculateAvailableBalance(account.balance, account.heldAmount);
    return {
      accountId: account.id,
      balance: account.balance,
      heldAmount: account.heldAmount,
      availableBalance,
    };
  }

  /** Place a collateral hold on an account's funds (Task 17 Loans integration). */
  async holdFunds(input: HoldFundsInput): Promise<FundsHold> {
    const accountRepo = this.tenantContext.repo(AccountEntity);
    const account = await accountRepo.findOne({ where: { id: input.accountId } });
    if (!account) {
      throw new NotFoundException(`Account with ID "${input.accountId}" not found`);
    }

    this.validatePositiveAmount(input.amount);

    return this.ledger.holdFunds({
      accountId: account.id,
      amount: input.amount,
      reason: input.reason,
    });
  }

  /** Release a previously placed collateral hold. */
  async releaseHold(holdId: string): Promise<FundsHold> {
    return this.ledger.releaseHold(holdId);
  }

  /** Calculate loan eligibility ceiling based on member's savings balance multiplier. */
  async getLoanEligibilityCeiling(memberId: MemberId): Promise<LoanEligibilityCeiling> {
    const accountRepo = this.tenantContext.repo(AccountEntity);
    const accounts = await accountRepo.find({
      where: { memberId, type: 'savings', status: 'active' },
    });

    const savingsBalance = accounts.reduce(
      (sum, acc) => addAmounts(sum, this.calculateAvailableBalance(acc.balance, acc.heldAmount)),
      '0.00',
    );

    const multiplierStr = this.configService.get<string>('SAVINGS_LOAN_MULTIPLIER', '3');
    const multiplier = Number(multiplierStr);
    if (!Number.isInteger(multiplier) || multiplier < 0) {
      throw new UnprocessableEntityException(
        'SAVINGS_LOAN_MULTIPLIER must be a non-negative integer',
      );
    }

    const maxLoanAmount = fromCents(toCents(savingsBalance) * BigInt(multiplier));

    return {
      memberId,
      savingsBalance,
      multiplier,
      maxLoanAmount,
    };
  }

  /** Get all accounts (savings & share) for a specific member. */
  async getAccountsByMember(memberId: MemberId): Promise<Account[]> {
    await this.memberService.findById(memberId);
    const accountRepo = this.tenantContext.repo(AccountEntity);
    const accounts = await accountRepo.find({
      where: { memberId },
      order: { createdAt: 'ASC' },
    });
    return accounts.map((acc) => this.mapAccountToContract(acc));
  }

  /** Get single account details including computed available balance. */
  async getAccountById(accountId: AccountId): Promise<Account> {
    const accountRepo = this.tenantContext.repo(AccountEntity);
    const account = await accountRepo.findOne({ where: { id: accountId } });
    if (!account) {
      throw new NotFoundException(`Account with ID "${accountId}" not found`);
    }
    return this.mapAccountToContract(account);
  }

  /** Get transaction history / statement for a specific account. */
  async getTransactionsByAccount(
    accountId: AccountId,
    filter?: TransactionHistoryFilter,
  ): Promise<Transaction[]> {
    const accountRepo = this.tenantContext.repo(AccountEntity);
    const account = await accountRepo.findOne({ where: { id: accountId } });
    if (!account) {
      throw new NotFoundException(`Account with ID "${accountId}" not found`);
    }

    const txnRepo = this.tenantContext.repo(SavingsTransactionEntity);
    const qb = txnRepo
      .createQueryBuilder('txn')
      .where('txn.accountId = :accountId', { accountId });

    if (filter?.fromDate) {
      const fromDate = this.parseDateBound(filter.fromDate, false);
      qb.andWhere('txn.postedAt >= :fromDate', { fromDate });
    }
    if (filter?.toDate) {
      const toDate = this.parseDateBound(filter.toDate, true);
      qb.andWhere('txn.postedAt <= :toDate', { toDate });
    }

    qb.orderBy('txn.postedAt', 'DESC').addOrderBy('txn.id', 'DESC');

    if (filter?.limit !== undefined) {
      const limit = Math.min(Math.max(1, filter.limit), 100);
      qb.take(limit);
    }
    if (filter?.offset !== undefined && filter.offset > 0) {
      qb.skip(filter.offset);
    }

    const txns = await qb.getMany();
    return txns.map((t) => this.mapTransactionToContract(t));
  }

  /** Get transaction history / statement across all accounts of a member. */
  async getTransactionsByMember(
    memberId: MemberId,
    filter?: TransactionHistoryFilter,
  ): Promise<Transaction[]> {
    const accounts = await this.getAccountsByMember(memberId);
    if (accounts.length === 0) {
      return [];
    }

    const accountIds = accounts.map((a) => a.id);
    const txnRepo = this.tenantContext.repo(SavingsTransactionEntity);
    const qb = txnRepo
      .createQueryBuilder('txn')
      .where('txn.accountId IN (:...accountIds)', { accountIds });

    if (filter?.fromDate) {
      const fromDate = this.parseDateBound(filter.fromDate, false);
      qb.andWhere('txn.postedAt >= :fromDate', { fromDate });
    }
    if (filter?.toDate) {
      const toDate = this.parseDateBound(filter.toDate, true);
      qb.andWhere('txn.postedAt <= :toDate', { toDate });
    }

    qb.orderBy('txn.postedAt', 'DESC').addOrderBy('txn.id', 'DESC');

    if (filter?.limit !== undefined) {
      const limit = Math.min(Math.max(1, filter.limit), 100);
      qb.take(limit);
    }
    if (filter?.offset !== undefined && filter.offset > 0) {
      qb.skip(filter.offset);
    }

    const txns = await qb.getMany();
    return txns.map((t) => this.mapTransactionToContract(t));
  }

  /**
   * Resolve the member email while the request tenant-context is still open, then
   * hand SMTP off to `enqueue`. Looking the member up in a detached promise races
   * `TenantContextInterceptor` releasing the query runner — the verify step
   * (deposit → real email) would randomly never send.
   *
   * SMTP itself stays fire-and-forget so a slow mailbox cannot fail the posting
   * or hold the tenant transaction open.
   */
  private async queueAccountNotification(
    memberId: MemberId,
    template: 'deposit-posted' | 'withdrawal-posted',
    txn: Transaction,
    accountNumber: string,
  ): Promise<void> {
    try {
      const member = await this.memberService.findById(memberId);
      if (!member.email) {
        this.logger.warn(`Skipping ${template}: member ${memberId} has no email`);
        return;
      }
      this.notifications.enqueue({
        template,
        to: member.email,
        data: {
          memberName: member.fullName,
          amount: txn.amount,
          currency: txn.currency,
          balanceAfter: txn.balanceAfter,
          accountNumber,
          ...(txn.reference ? { reference: txn.reference } : {}),
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Could not queue ${template}: ${message}`);
    }
  }

  private validatePositiveAmount(amount: Amount): void {
    if (toCents(amount) <= 0n) {
      throw new UnprocessableEntityException('Amount must be a positive decimal figure');
    }
  }

  private calculateAvailableBalance(balance: Amount, heldAmount: Amount): Amount {
    return subtractAmounts(balance, heldAmount);
  }

  private generateAccountNumber(type: 'savings' | 'share'): string {
    const prefix = type === 'savings' ? 'SAV' : 'SHR';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${timestamp}-${random}`;
  }

  private parseDateBound(dateStr: string, isEndOfDay: boolean): Date {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const time = isEndOfDay ? '23:59:59.999Z' : '00:00:00.000Z';
      return new Date(`${dateStr}T${time}`);
    }
    return new Date(dateStr);
  }

  private mapAccountToContract(entity: AccountEntity): Account {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      memberId: entity.memberId,
      accountNumber: entity.accountNumber,
      type: entity.type,
      status: entity.status,
      balance: entity.balance,
      heldAmount: entity.heldAmount,
      availableBalance: this.calculateAvailableBalance(entity.balance, entity.heldAmount),
      currency: entity.currency,
      openedAt: entity.openedAt,
    };
  }

  private async resolveIdempotentSavingsTransaction(
    reference: string | undefined | null,
    expected: { accountId: string; type: Transaction['type']; amount: string },
  ): Promise<Transaction | null> {
    const ref = reference?.trim();
    if (!ref) {
      return null;
    }

    const txnRepo = this.tenantContext.repo(SavingsTransactionEntity);
    const existing = await txnRepo.findOne({ where: { reference: ref } });
    if (!existing) {
      return null;
    }

    const samePayload =
      existing.accountId === expected.accountId &&
      existing.type === expected.type &&
      existing.amount === expected.amount;

    if (samePayload) {
      return this.mapTransactionToContract(existing);
    }

    throw new SyncConflictException();
  }

  private mapTransactionToContract(entity: SavingsTransactionEntity): Transaction {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      accountId: entity.accountId,
      type: entity.type,
      amount: entity.amount,
      currency: entity.currency,
      balanceAfter: entity.balanceAfter,
      reference: entity.reference ?? null,
      narration: entity.narration ?? null,
      postedByStaffId: entity.postedByStaffId ?? null,
      postedAt:
        entity.postedAt instanceof Date
          ? entity.postedAt.toISOString()
          : new Date(entity.postedAt).toISOString(),
    };
  }
}
