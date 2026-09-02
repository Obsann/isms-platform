import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  UnprocessableEntityException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthenticatedUser } from '../common';
import { TenantContextService } from '../common';
import { SyncConflictException } from '../common/sync-conflict.exception';
import { MemberService } from '../members';
import { SavingsSharesService } from '../savings-shares/savings-shares.service';
import { StaffAccountService } from '../security-audit';
import type { Account, Member } from '../types';
import { ChapaPaymentEntity, type ChapaPaymentStatus } from './chapa-payment.entity';
import {
  assertChapaWebhookSignature,
  buildChapaTxRef,
  chapaStatusIsFailed,
  chapaStatusIsPaid,
  clipChapaName,
  extractChapaTxRef,
  isChapaConfigured,
  isChapaTestKey,
  mapChapaCustomerEmail,
  normalizeEthiopianPhone,
  normalizeEtbAmount,
  parseTenantIdFromTxRef,
  stringifyChapaError,
  toChapaPhone,
} from './chapa.helpers';

const CHAPA_INITIALIZE_URL = 'https://api.chapa.co/v1/transaction/initialize';
const CHAPA_VERIFY_URL = 'https://api.chapa.co/v1/transaction/verify';

export type ChapaCheckoutMode = 'live' | 'mock';

export interface ChapaPaymentView {
  txRef: string;
  amount: string;
  currency: 'ETB';
  status: ChapaPaymentStatus;
  mode: ChapaCheckoutMode;
  checkoutUrl: string | null;
  ledgerTransactionId: string | null;
}

export interface ChapaInitializeResult extends ChapaPaymentView {
  checkoutUrl: string;
}

interface ChapaVerifyPayload {
  status?: unknown;
  data?: {
    status?: unknown;
    amount?: unknown;
    tx_ref?: unknown;
    reference?: unknown;
  };
}

@Injectable()
export class ChapaService {
  private readonly logger = new Logger(ChapaService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly tenantContext: TenantContextService,
    private readonly memberService: MemberService,
    private readonly staffAccounts: StaffAccountService,
    @Inject(forwardRef(() => SavingsSharesService))
    private readonly savings: SavingsSharesService,
  ) {}

  isLiveConfigured(): boolean {
    return isChapaConfigured(this.config.get<string>('CHAPA_SECRET_KEY'));
  }

  getMode(): ChapaCheckoutMode {
    return this.isLiveConfigured() ? 'live' : 'mock';
  }

  async initializeDeposit(
    user: AuthenticatedUser,
    input: { amount: string; accountId?: string; phone?: string },
  ): Promise<ChapaInitializeResult> {
    const member = await this.resolveLinkedMember(user);
    const account = await this.resolveOwnSavingsAccount(member, input.accountId);
    const amount = normalizeEtbAmount(input.amount);
    const tenantId = this.requireTenantId();
    const txRef = buildChapaTxRef(tenantId);
    const phone =
      normalizeEthiopianPhone(input.phone) ?? normalizeEthiopianPhone(member.phone);
    const live = this.isLiveConfigured();
    const email = mapChapaCustomerEmail(
      member.email,
      isChapaTestKey(this.config.get<string>('CHAPA_SECRET_KEY')),
    );
    const returnUrl = `${this.frontendOrigin()}/member/mobile-money?tx_ref=${encodeURIComponent(txRef)}`;

    const repo = this.tenantContext.repo(ChapaPaymentEntity);
    const pending = repo.create({
      tenantId,
      memberId: member.id,
      accountId: account.id,
      txRef,
      amount,
      currency: 'ETB',
      status: 'pending',
      phone,
      email,
      checkoutUrl: null,
      chapaReference: null,
      mockConfirmed: false,
      ledgerTransactionId: null,
    });
    const saved = await repo.save(pending);

    if (!live) {
      saved.checkoutUrl = returnUrl;
      await repo.save(saved);
      this.logger.log(`Chapa mock checkout ${txRef} (CHAPA_SECRET_KEY not set)`);
      return this.toView(saved, 'mock') as ChapaInitializeResult;
    }

    const checkoutUrl = await this.callChapaInitialize({
      txRef,
      amount,
      email,
      phone,
      firstName: member.firstName,
      lastName: member.lastName,
      returnUrl,
      tenantId,
      memberId: member.id,
      accountId: account.id,
    });
    saved.checkoutUrl = checkoutUrl;
    await repo.save(saved);
    return this.toView(saved, 'live') as ChapaInitializeResult;
  }

  async verifyDeposit(user: AuthenticatedUser, txRef: string): Promise<ChapaPaymentView> {
    const member = await this.resolveLinkedMember(user);
    const payment = await this.requireOwnPayment(member.id, txRef);
    return this.syncPayment(payment);
  }

  /**
   * Mock checkout confirmation. Only when Chapa keys are absent — never a live
   * unsigned shortcut. Ledger posting still happens in `syncPayment`.
   */
  async confirmMockDeposit(user: AuthenticatedUser, txRef: string): Promise<ChapaPaymentView> {
    if (this.isLiveConfigured()) {
      throw new ForbiddenException('Mock checkout is disabled while Chapa is configured');
    }
    const member = await this.resolveLinkedMember(user);
    const payment = await this.requireOwnPayment(member.id, txRef);
    if (payment.status === 'failed') {
      throw new UnprocessableEntityException('This checkout already failed');
    }
    payment.mockConfirmed = true;
    await this.tenantContext.repo(ChapaPaymentEntity).save(payment);
    return this.syncPayment(payment);
  }

  async handleWebhook(input: {
    rawBody: Buffer | undefined;
    signature: string | null;
    body: unknown;
  }): Promise<{ status: 'RECEIVED'; eventId: string; processedAt: string }> {
    assertChapaWebhookSignature({
      secret: this.config.get<string>('CHAPA_WEBHOOK_SECRET'),
      rawBody: input.rawBody,
      parsedBody: input.body,
      signature: input.signature,
    });

    const body = asRecord(input.body);
    const txRef = extractChapaTxRef(body);
    if (!txRef) {
      throw new UnprocessableEntityException('Webhook is missing tx_ref');
    }

    const tenantId = parseTenantIdFromTxRef(txRef);
    if (!tenantId) {
      throw new UnprocessableEntityException('Webhook reference is not an ISMS checkout');
    }

    await this.tenantContext.runInTenantContext(tenantId, async () => {
      const payment = await this.tenantContext.repo(ChapaPaymentEntity).findOne({
        where: { txRef },
      });
      if (!payment) {
        this.logger.warn(`Chapa webhook for unknown tx_ref ${txRef}`);
        return;
      }
      await this.syncPayment(payment);
    });

    return {
      status: 'RECEIVED',
      eventId: txRef,
      processedAt: new Date().toISOString(),
    };
  }

  private async syncPayment(payment: ChapaPaymentEntity): Promise<ChapaPaymentView> {
    if (payment.status === 'paid') {
      return this.toView(payment);
    }

    const live = this.isLiveConfigured();
    if (live) {
      const verified = await this.callChapaVerify(payment.txRef);
      const providerStatus = verified.data?.status ?? verified.status;
      const providerAmount = verified.data?.amount;
      if (providerAmount !== undefined && providerAmount !== null) {
        const verifiedAmount = normalizeEtbAmount(providerAmount);
        if (verifiedAmount !== payment.amount) {
          throw new ConflictException(
            'This payment reference was already used for a different amount',
          );
        }
      }
      if (chapaStatusIsPaid(providerStatus)) {
        const providerRef =
          typeof verified.data?.reference === 'string' ? verified.data.reference : null;
        await this.settlePaid(payment, providerRef);
        return this.toView(payment, 'live');
      }
      if (chapaStatusIsFailed(providerStatus)) {
        payment.status = 'failed';
        await this.tenantContext.repo(ChapaPaymentEntity).save(payment);
      }
      return this.toView(payment, 'live');
    }

    if (payment.mockConfirmed) {
      await this.settlePaid(payment, `mock:${payment.txRef}`);
    }
    return this.toView(payment, 'mock');
  }

  private async settlePaid(
    payment: ChapaPaymentEntity,
    providerRef: string | null,
  ): Promise<void> {
    if (payment.status === 'paid') {
      return;
    }

    try {
      const txn = await this.savings.deposit({
        accountId: payment.accountId,
        amount: payment.amount,
        reference: payment.txRef,
        narration: 'Chapa C2B savings deposit',
        postedByStaffId: null,
      });
      payment.status = 'paid';
      payment.chapaReference = providerRef;
      payment.ledgerTransactionId = txn.id;
      await this.tenantContext.repo(ChapaPaymentEntity).save(payment);
    } catch (err) {
      if (err instanceof SyncConflictException) {
        throw new ConflictException(
          'This payment reference was already used for a different amount',
        );
      }
      throw err;
    }
  }

  private async callChapaInitialize(input: {
    txRef: string;
    amount: string;
    email: string;
    phone: string | null;
    firstName: string;
    lastName: string;
    returnUrl: string;
    tenantId: string;
    memberId: string;
    accountId: string;
  }): Promise<string> {
    const secret = this.config.get<string>('CHAPA_SECRET_KEY')?.trim() ?? '';
    const callbackUrl = this.config.get<string>('CHAPA_CALLBACK_URL')?.trim();
    const payload: Record<string, unknown> = {
      amount: input.amount,
      currency: 'ETB',
      email: input.email,
      first_name: clipChapaName(input.firstName, 'Member'),
      last_name: clipChapaName(input.lastName, 'Member'),
      tx_ref: input.txRef,
      return_url: input.returnUrl,
      customization: {
        title: 'SACCO deposit',
        description: 'Member savings deposit',
      },
      meta: {
        tenant_id: input.tenantId,
        member_id: input.memberId,
        account_id: input.accountId,
      },
    };
    const phone = input.phone ? toChapaPhone(input.phone) : null;
    if (phone) {
      payload.phone_number = phone;
    }
    if (callbackUrl) {
      payload.callback_url = callbackUrl;
    }

    try {
      return await this.postChapaInitialize(secret, payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      const retry = { ...payload };
      let shouldRetry = false;
      if (phone && /phone/i.test(message)) {
        delete retry.phone_number;
        shouldRetry = true;
      }
      if (/email/i.test(message)) {
        const slug = input.txRef.replace(/[^a-z0-9]/gi, '').slice(-10) || 'member';
        retry.email = `member.${slug}@gmail.com`;
        shouldRetry = true;
      }
      if (shouldRetry) {
        return this.postChapaInitialize(secret, retry);
      }
      throw err;
    }
  }

  private async postChapaInitialize(
    secret: string,
    payload: Record<string, unknown>,
  ): Promise<string> {
    const response = await this.chapaFetch(CHAPA_INITIALIZE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({}));
    const checkoutUrl = (body as { data?: { checkout_url?: string } }).data?.checkout_url;
    if (!response.ok || !checkoutUrl) {
      throw new ServiceUnavailableException(stringifyChapaError(body));
    }
    return checkoutUrl;
  }

  private async callChapaVerify(txRef: string): Promise<ChapaVerifyPayload> {
    const secret = this.config.get<string>('CHAPA_SECRET_KEY')?.trim() ?? '';
    const url = `${CHAPA_VERIFY_URL}/${encodeURIComponent(txRef)}`;
    const response = await this.chapaFetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${secret}` },
    });
    const body = (await response.json().catch(() => ({}))) as ChapaVerifyPayload;
    if (!response.ok) {
      throw new ServiceUnavailableException('Could not verify Chapa payment');
    }
    return body;
  }

  private async chapaFetch(url: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Chapa request failed';
      this.logger.warn(`Chapa HTTP error: ${message}`);
      throw new ServiceUnavailableException('Could not reach Chapa');
    }
  }

  /**
   * Same email-link rule as `GET /self-service/me`: JWT `sub` is staff id, not
   * `members.id`.
   */
  private async resolveLinkedMember(user: AuthenticatedUser): Promise<Member> {
    const staff = await this.staffAccounts.findSummaryById(user.staffId);
    const email = staff?.email?.trim() ?? '';
    if (!email) {
      throw new NotFoundException('No member record for this login');
    }
    const member = await this.memberService.findByEmail(email);
    if (!member) {
      throw new NotFoundException('No member record for this login');
    }
    return member;
  }

  private async resolveOwnSavingsAccount(member: Member, accountId?: string): Promise<Account> {
    if (accountId) {
      const account = await this.savings.getAccountById(accountId);
      if (account.memberId !== member.id) {
        throw new ForbiddenException('Members can only deposit into their own savings account');
      }
      if (account.type !== 'savings') {
        throw new UnprocessableEntityException('Chapa deposits must go to a savings account');
      }
      if (account.status !== 'active') {
        throw new UnprocessableEntityException(
          `Account is ${account.status}; deposits require an active account`,
        );
      }
      return account;
    }

    const accounts = await this.savings.getAccountsByMember(member.id);
    const savings = accounts.find((row) => row.type === 'savings' && row.status === 'active');
    if (!savings) {
      throw new UnprocessableEntityException('You need an active savings account before depositing');
    }
    return savings;
  }

  private async requireOwnPayment(memberId: string, txRef: string): Promise<ChapaPaymentEntity> {
    const payment = await this.tenantContext.repo(ChapaPaymentEntity).findOne({
      where: { txRef: txRef.trim() },
    });
    if (!payment) {
      throw new NotFoundException('Checkout not found');
    }
    if (payment.memberId !== memberId) {
      throw new ForbiddenException('Members can only access their own checkout');
    }
    return payment;
  }

  private requireTenantId(): string {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new UnauthorizedException('No tenant context found');
    }
    return tenantId;
  }

  private frontendOrigin(): string {
    const explicit = this.config.get<string>('FRONTEND_URL')?.trim();
    if (explicit) {
      return explicit.replace(/\/$/, '');
    }
    return (this.config.get<string>('CORS_ORIGIN', 'http://localhost:3000') ?? 'http://localhost:3000').replace(
      /\/$/,
      '',
    );
  }

  private toView(payment: ChapaPaymentEntity, mode: ChapaCheckoutMode = this.getMode()): ChapaPaymentView {
    return {
      txRef: payment.txRef,
      amount: payment.amount,
      currency: 'ETB',
      status: payment.status,
      mode,
      checkoutUrl: payment.checkoutUrl,
      ledgerTransactionId: payment.ledgerTransactionId,
    };
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}
