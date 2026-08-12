import {
  ConflictException,
  Injectable,
  NotFoundException,
  NotImplementedException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';
import { MemberService } from '../members';
import type { Account, AccountId, Amount, MemberId, Transaction } from '../types';
import { AccountEntity } from './account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { FundsHoldEntity } from './funds-hold.entity';
import type {
  AccountBalance,
  DepositInput,
  FundsHold,
  HoldFundsInput,
  LoanEligibilityCeiling,
  SharePurchaseInput,
  WithdrawalInput,
} from './savings-shares.types';

/**
 * Savings & Shares vertical — owner: **Jerry** (Task 12).
 *
 * Provides core account management, deposits, withdrawals, share purchases,
 * collateral fund holds, and loan eligibility calculations.
 */
@Injectable()
export class SavingsSharesService {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly configService: ConfigService,
    private readonly memberService: MemberService,
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

    // Ledger posting integration seam (Task 13 — Obsan).
    // Ledger service will post balanced entry pair and update accounts.balance atomically.
    throw new NotImplementedException(
      `Ledger posting required (Task 13). Deposit validation passed for amount ${input.amount} ETB on account ${input.accountId}.`,
    );
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

    const available = this.calculateAvailableBalance(account.balance, account.heldAmount);
    if (parseFloat(input.amount) > parseFloat(available)) {
      throw new UnprocessableEntityException(
        `Insufficient available funds. Requested: ${input.amount} ETB, Available: ${available} ETB`,
      );
    }

    // Ledger posting integration seam (Task 13 — Obsan).
    // Ledger service will post balanced entry pair and update accounts.balance atomically.
    throw new NotImplementedException(
      `Ledger posting required (Task 13). Withdrawal validation passed for amount ${input.amount} ETB on account ${input.accountId}.`,
    );
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

    // Ledger posting integration seam (Task 13 — Obsan).
    // Ledger service will post balanced entry pair and update accounts.balance atomically.
    throw new NotImplementedException(
      `Ledger posting required (Task 13). Share purchase validation passed for amount ${input.amount} ETB on account ${shareAccount.id}.`,
    );
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

    const available = this.calculateAvailableBalance(account.balance, account.heldAmount);
    if (parseFloat(input.amount) > parseFloat(available)) {
      throw new UnprocessableEntityException(
        `Insufficient available funds to place hold. Requested: ${input.amount} ETB, Available: ${available} ETB`,
      );
    }

    // Ledger posting integration seam (Task 13 — Obsan).
    // Ledger service will manage accounts.held_amount updates and hold recording.
    throw new NotImplementedException(
      `Ledger integration required (Task 13). Hold funds validation passed for amount ${input.amount} ETB on account ${input.accountId}.`,
    );
  }

  /** Release a previously placed collateral hold. */
  async releaseHold(holdId: string): Promise<FundsHold> {
    const holdRepo = this.tenantContext.repo(FundsHoldEntity);
    const hold = await holdRepo.findOne({ where: { id: holdId } });
    if (!hold) {
      throw new NotFoundException(`Funds hold with ID "${holdId}" not found`);
    }
    if (hold.releasedAt !== null) {
      throw new ConflictException(`Funds hold with ID "${holdId}" has already been released`);
    }

    // Ledger posting integration seam (Task 13 — Obsan).
    // Ledger service will manage accounts.held_amount updates and release recording.
    throw new NotImplementedException(
      `Ledger integration required (Task 13). Release hold validation passed for hold ID ${holdId}.`,
    );
  }

  /** Calculate loan eligibility ceiling based on member's savings balance multiplier. */
  async getLoanEligibilityCeiling(memberId: MemberId): Promise<LoanEligibilityCeiling> {
    const accountRepo = this.tenantContext.repo(AccountEntity);
    const accounts = await accountRepo.find({
      where: { memberId, type: 'savings', status: 'active' },
    });

    const totalSavingsFloat = accounts.reduce(
      (sum, acc) => sum + parseFloat(acc.balance),
      0,
    );
    const savingsBalance = totalSavingsFloat.toFixed(2);

    const multiplierStr = this.configService.get<string>('SAVINGS_LOAN_MULTIPLIER', '3');
    const multiplier = parseFloat(multiplierStr);

    const maxLoanFloat = totalSavingsFloat * multiplier;
    const maxLoanAmount = maxLoanFloat.toFixed(2);

    return {
      memberId,
      savingsBalance,
      multiplier,
      maxLoanAmount,
    };
  }

  private validatePositiveAmount(amount: Amount): void {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      throw new UnprocessableEntityException('Amount must be a positive decimal figure');
    }
  }

  private calculateAvailableBalance(balance: Amount, heldAmount: Amount): Amount {
    const bal = parseFloat(balance);
    const held = parseFloat(heldAmount);
    const avail = Math.max(0, bal - held);
    return avail.toFixed(2);
  }

  private generateAccountNumber(type: 'savings' | 'share'): string {
    const prefix = type === 'savings' ? 'SAV' : 'SHR';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${timestamp}-${random}`;
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
}
