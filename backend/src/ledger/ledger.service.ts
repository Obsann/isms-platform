import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TenantContextService } from '../common';
import type { Amount, Transaction } from '../types';
import { LedgerEntryEntity } from './ledger-entry.entity';
import type {
  FundsHold,
  HoldFundsInput,
  LedgerLine,
  LedgerTrialBalance,
  LoanMovementInput,
  MemberMovementInput,
  PostingMeta,
} from './ledger.types';
import { GL } from './ledger.types';
import {
  addAmounts,
  amountGreaterThan,
  fromCents,
  subtractAmounts,
  toCents,
} from './money';

export function assertBalanced(lines: LedgerLine[]): void {
  if (lines.length < 2) {
    throw new UnprocessableEntityException('A posting must have at least two lines');
  }

  let debit = 0n;
  let credit = 0n;
  for (const line of lines) {
    const cents = toCents(line.amount);
    if (cents <= 0n) {
      throw new UnprocessableEntityException('Each ledger line amount must be greater than zero');
    }
    if (line.side === 'debit') {
      debit += cents;
    } else {
      credit += cents;
    }
  }

  if (debit !== credit) {
    throw new UnprocessableEntityException(
      `Unbalanced posting rejected: debits ${fromCents(debit)} != credits ${fromCents(credit)}`,
    );
  }
}

@Injectable()
export class LedgerService {
  constructor(private readonly tenantContext: TenantContextService) {}

  /** Cash in: Dr CASH / Cr MEMBER_SAVINGS, member savings balance up. */
  async postDeposit(input: MemberMovementInput): Promise<Transaction> {
    return this.postMemberMovement(input, 'deposit', [
      { glCode: GL.CASH, side: 'debit', amount: input.amount },
      {
        glCode: GL.MEMBER_SAVINGS,
        side: 'credit',
        amount: input.amount,
        accountId: input.accountId,
      },
    ]);
  }

  /** Cash out: Dr MEMBER_SAVINGS / Cr CASH, member savings balance down. */
  async postWithdrawal(input: MemberMovementInput): Promise<Transaction> {
    return this.postMemberMovement(input, 'withdrawal', [
      {
        glCode: GL.MEMBER_SAVINGS,
        side: 'debit',
        amount: input.amount,
        accountId: input.accountId,
      },
      { glCode: GL.CASH, side: 'credit', amount: input.amount },
    ]);
  }

  /** Share purchase: Dr CASH / Cr SHARE_CAPITAL, share account balance up. */
  async postSharePurchase(input: MemberMovementInput): Promise<Transaction> {
    return this.postMemberMovement(input, 'share-purchase', [
      { glCode: GL.CASH, side: 'debit', amount: input.amount },
      {
        glCode: GL.SHARE_CAPITAL,
        side: 'credit',
        amount: input.amount,
        accountId: input.accountId,
      },
    ]);
  }

  /** Dr LOANS_RECEIVABLE / Cr CASH. Task 16 owns the loan row. */
  async postLoanDisbursement(input: LoanMovementInput): Promise<string> {
    return this.postGlOnly(input, 'loan-disbursement', [
      { glCode: GL.LOANS_RECEIVABLE, side: 'debit', amount: input.amount },
      { glCode: GL.CASH, side: 'credit', amount: input.amount },
    ]);
  }

  /** Dr CASH / Cr LOANS_RECEIVABLE (principal). Task 16 owns the loan row. */
  async postLoanRepayment(input: LoanMovementInput): Promise<string> {
    return this.postGlOnly(input, 'loan-repayment', [
      { glCode: GL.CASH, side: 'debit', amount: input.amount },
      { glCode: GL.LOANS_RECEIVABLE, side: 'credit', amount: input.amount },
    ]);
  }

  /**
   * Generic posting entry point. Balanced-pair check runs *before* any insert or
   * balance write, so an unbalanced set cannot be half-applied.
   */
  async postLines(lines: LedgerLine[], meta: PostingMeta): Promise<string> {
    assertBalanced(lines);

    const tenantId = this.requireTenantId();
    const postingId = randomUUID();
    const currency = meta.currency ?? 'ETB';
    const postedAt = new Date();

    const repo = this.tenantContext.repo(LedgerEntryEntity);
    const entries = lines.map((line) =>
      repo.create({
        tenantId,
        postingId,
        accountId: line.accountId ?? null,
        glCode: line.glCode,
        side: line.side,
        amount: line.amount,
        currency,
        type: meta.type,
        reference: meta.reference ?? null,
        narration: meta.narration ?? null,
        postedByStaffId: meta.postedByStaffId ?? null,
        postedAt,
      }),
    );
    await repo.save(entries);
    return postingId;
  }

  async holdFunds(input: HoldFundsInput): Promise<FundsHold> {
    const tenantId = this.requireTenantId();
    const account = await this.loadAccount(input.accountId);
    this.assertActiveAccount(account);
    if (account.type !== 'savings') {
      throw new UnprocessableEntityException('Holds can only be placed on savings accounts');
    }
    const available = subtractAmounts(account.balance, account.heldAmount);
    if (amountGreaterThan(input.amount, available)) {
      throw new UnprocessableEntityException(
        `Insufficient available funds to place hold. Requested: ${input.amount} ETB, Available: ${available} ETB`,
      );
    }

    const nextHeld = addAmounts(account.heldAmount, input.amount);
    await this.tenantContext.getManager().query(
      `UPDATE "accounts" SET "held_amount" = $1::numeric, "updated_at" = now() WHERE "id" = $2`,
      [nextHeld, input.accountId],
    );

    const rows = await this.tenantContext.getManager().query<Array<{ id: string }>>(
      `
        INSERT INTO "funds_holds" ("tenant_id", "account_id", "amount", "reason")
        VALUES ($1, $2, $3::numeric, $4)
        RETURNING "id"
      `,
      [tenantId, input.accountId, input.amount, input.reason],
    );

    return {
      holdId: rows[0].id,
      accountId: input.accountId,
      amount: input.amount,
      releasedAt: null,
    };
  }

  async releaseHold(holdId: string): Promise<FundsHold> {
    this.requireTenantId();
    const holds = await this.tenantContext.getManager().query<
      Array<{ id: string; account_id: string; amount: string; released_at: Date | null }>
    >(
      `SELECT "id", "account_id", "amount", "released_at" FROM "funds_holds" WHERE "id" = $1`,
      [holdId],
    );
    const hold = holds[0];
    if (!hold) {
      throw new NotFoundException(`Funds hold with ID "${holdId}" not found`);
    }
    if (hold.released_at !== null) {
      throw new ConflictException(`Funds hold with ID "${holdId}" has already been released`);
    }

    const account = await this.loadAccount(hold.account_id);
    const nextHeld = subtractAmounts(account.heldAmount, hold.amount);

    await this.tenantContext.getManager().query(
      `UPDATE "funds_holds" SET "released_at" = now(), "updated_at" = now() WHERE "id" = $1`,
      [holdId],
    );
    await this.tenantContext.getManager().query(
      `UPDATE "accounts" SET "held_amount" = $1::numeric, "updated_at" = now() WHERE "id" = $2`,
      [nextHeld, hold.account_id],
    );

    return {
      holdId: hold.id,
      accountId: hold.account_id,
      amount: hold.amount,
      releasedAt: new Date().toISOString(),
    };
  }

  private async postMemberMovement(
    input: MemberMovementInput,
    type: 'deposit' | 'withdrawal' | 'share-purchase',
    lines: LedgerLine[],
  ): Promise<Transaction> {
    const account = await this.loadAccount(input.accountId);
    this.assertActiveAccount(account);
    const expectedType = type === 'share-purchase' ? 'share' : 'savings';
    if (account.type !== expectedType) {
      throw new UnprocessableEntityException(
        type === 'share-purchase'
          ? 'Share purchases require a share account'
          : 'This movement requires a savings account',
      );
    }

    const nextBalance =
      type === 'withdrawal'
        ? subtractAmounts(account.balance, input.amount)
        : addAmounts(account.balance, input.amount);

    if (type === 'withdrawal') {
      const available = subtractAmounts(account.balance, account.heldAmount);
      if (amountGreaterThan(input.amount, available)) {
        throw new UnprocessableEntityException(
          `Insufficient available funds. Requested: ${input.amount} ETB, Available: ${available} ETB`,
        );
      }
    }

    await this.postLines(lines, {
      type,
      currency: account.currency,
      reference: input.reference,
      narration: input.narration,
      postedByStaffId: input.postedByStaffId,
    });

    await this.applyBalance(input.accountId, nextBalance);

    const txnRows = await this.tenantContext.getManager().query<Array<{ id: string; posted_at: Date }>>(
      `
        INSERT INTO "savings_transactions"
          ("tenant_id", "account_id", "type", "amount", "balance_after", "currency",
           "reference", "narration", "posted_by_staff_id")
        VALUES ($1, $2, $3, $4::numeric, $5::numeric, $6, $7, $8, $9)
        RETURNING "id", "posted_at"
      `,
      [
        this.requireTenantId(),
        input.accountId,
        type,
        input.amount,
        nextBalance,
        account.currency,
        input.reference ?? null,
        input.narration ?? null,
        input.postedByStaffId ?? null,
      ],
    );

    const txn = txnRows[0];
    return {
      id: txn.id,
      tenantId: this.requireTenantId(),
      accountId: input.accountId,
      type,
      amount: input.amount,
      currency: account.currency,
      balanceAfter: nextBalance,
      reference: input.reference ?? null,
      narration: input.narration ?? null,
      postedByStaffId: input.postedByStaffId ?? null,
      postedAt: new Date(txn.posted_at).toISOString(),
    };
  }

  private async postGlOnly(
    input: LoanMovementInput,
    type: 'loan-disbursement' | 'loan-repayment',
    lines: LedgerLine[],
  ): Promise<string> {
    return this.postLines(lines, {
      type,
      currency: input.currency ?? 'ETB',
      reference: input.reference,
      narration: input.narration,
      postedByStaffId: input.postedByStaffId,
    });
  }

  private async applyBalance(accountId: string, nextBalance: Amount): Promise<void> {
    await this.tenantContext.getManager().query(
      `UPDATE "accounts" SET "balance" = $1::numeric, "updated_at" = now() WHERE "id" = $2`,
      [nextBalance, accountId],
    );
  }

  private assertActiveAccount(account: { status: string }): void {
    if (account.status !== 'active') {
      throw new UnprocessableEntityException(
        `Account is ${account.status}; this movement requires an active account`,
      );
    }
  }

  private async loadAccount(accountId: string): Promise<{
    id: string;
    balance: Amount;
    heldAmount: Amount;
    status: string;
    type: string;
    currency: string;
  }> {
    const rows = await this.tenantContext.getManager().query<
      Array<{
        id: string;
        balance: string;
        held_amount: string;
        status: string;
        type: string;
        currency: string;
      }>
    >(
      `SELECT "id", "balance", "held_amount", "status", "type", "currency" FROM "accounts" WHERE "id" = $1`,
      [accountId],
    );
    const row = rows[0];
    if (!row) {
      throw new NotFoundException(`Account with ID "${accountId}" not found`);
    }
    return {
      id: row.id,
      balance: row.balance,
      heldAmount: row.held_amount,
      status: row.status,
      type: row.type,
      currency: row.currency.trim(),
    };
  }

  /**
   * Tenant trial balance grouped by hard-coded GL code (D2). Debits must equal
   * credits when every posting went through `postLines`.
   */
  async getTrialBalance(): Promise<LedgerTrialBalance> {
    const entries = await this.tenantContext.repo(LedgerEntryEntity).find();
    const byGl = new Map<string, { debit: bigint; credit: bigint }>();

    for (const entry of entries) {
      const current = byGl.get(entry.glCode) ?? { debit: 0n, credit: 0n };
      const cents = toCents(entry.amount);
      if (entry.side === 'debit') {
        current.debit += cents;
      } else {
        current.credit += cents;
      }
      byGl.set(entry.glCode, current);
    }

    let totalDebit = 0n;
    let totalCredit = 0n;
    const lines = [...byGl.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([glCode, totals]) => {
        totalDebit += totals.debit;
        totalCredit += totals.credit;
        return {
          glCode: glCode as LedgerTrialBalance['lines'][number]['glCode'],
          debit: fromCents(totals.debit),
          credit: fromCents(totals.credit),
        };
      });

    return {
      lines,
      totalDebits: fromCents(totalDebit),
      totalCredits: fromCents(totalCredit),
      balanced: totalDebit === totalCredit,
    };
  }

  private requireTenantId(): string {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new UnauthorizedException('No tenant context found');
    }
    return tenantId;
  }
}
