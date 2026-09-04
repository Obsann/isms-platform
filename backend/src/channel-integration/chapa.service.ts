import {
  BadRequestException,
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
import { OtpService, StaffAccountService } from '../security-audit';
import type { Account, Member } from '../types';
import { ChapaPaymentEntity, type ChapaPaymentKind, type ChapaPaymentStatus, type ChapaPayoutChannel } from './chapa-payment.entity';
import {
  assertChapaWebhookSignature,
  buildChapaTxRef,
  chapaStatusIsFailed,
  chapaStatusIsPaid,
  clipChapaName,
  etbGreaterThan,
  extractChapaTxRef,
  isChapaConfigured,
  isChapaTestKey,
  readChapaSecret,
  mapChapaCustomerEmail,
  normalizeEthiopianPhone,
  normalizeEtbAmount,
  parseTenantIdFromTxRef,
  stringifyChapaError,
  toChapaPhone,
} from './chapa.helpers';

const CHAPA_INITIALIZE_URL = 'https://api.chapa.co/v1/transaction/initialize';
const CHAPA_VERIFY_URL = 'https://api.chapa.co/v1/transaction/verify';
const CHAPA_TRANSFER_URL = 'https://api.chapa.co/v1/transfers';
const CHAPA_TRANSFER_VERIFY_URL = 'https://api.chapa.co/v1/transfers/verify';
const CHAPA_BANKS_URL = 'https://api.chapa.co/v1/banks';
const FALLBACK_BANK_CODES: Record<ChapaPayoutChannel, string> = {
  telebirr: '855',
  mpesa: '266',
};

export type ChapaCheckoutMode = 'live' | 'mock';

export interface ChapaPaymentView {
  txRef: string;
  amount: string;
  currency: 'ETB';
  status: ChapaPaymentStatus;
  kind: ChapaPaymentKind;
  mode: ChapaCheckoutMode;
  checkoutUrl: string | null;
  payoutChannel: ChapaPayoutChannel | null;
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
    id?: unknown;
  };
}

interface ChapaBankRow {
  id?: unknown;
  name?: unknown;
  slug?: unknown;
  is_mobilemoney?: unknown;
}

@Injectable()
export class ChapaService {
  private readonly logger = new Logger(ChapaService.name);
  private banksCache: { at: number; rows: ChapaBankRow[] } | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly tenantContext: TenantContextService,
    private readonly memberService: MemberService,
    private readonly staffAccounts: StaffAccountService,
    @Inject(forwardRef(() => SavingsSharesService))
    private readonly savings: SavingsSharesService,
    private readonly otp: OtpService,
  ) {
    this.logger.log(
      this.isLiveConfigured()
        ? 'Chapa checkout mode: live'
        : 'Chapa checkout mode: mock (CHAPA_SECRET_KEY empty or placeholder)',
    );
  }

  private secretKey(): string {
    return readChapaSecret(
      this.config.get<string>('CHAPA_SECRET_KEY') ?? process.env.CHAPA_SECRET_KEY,
    );
  }

  isLiveConfigured(): boolean {
    return isChapaConfigured(this.secretKey());
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
      isChapaTestKey(this.secretKey()),
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
      kind: 'deposit',
      status: 'pending',
      payoutChannel: null,
      bankCode: null,
      phone,
      email,
      checkoutUrl: null,
      chapaReference: null,
      mockConfirmed: false,
      ledgerTransactionId: null,
      holdId: null,
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
    if (payment.kind === 'withdrawal') {
      throw new UnprocessableEntityException('This reference is a withdrawal, not a deposit');
    }
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
    if (payment.kind === 'withdrawal') {
      throw new UnprocessableEntityException('This reference is a withdrawal, not a deposit');
    }
    if (payment.status === 'failed') {
      throw new UnprocessableEntityException('This checkout already failed');
    }
    payment.mockConfirmed = true;
    await this.tenantContext.repo(ChapaPaymentEntity).save(payment);
    return this.syncPayment(payment);
  }

  async initializeWithdrawal(
    user: AuthenticatedUser,
    input: { amount: string; accountId?: string; phone: string; channel: ChapaPayoutChannel; otp?: string },
  ): Promise<ChapaPaymentView> {
    const member = await this.resolveLinkedMember(user);
    const account = await this.resolveOwnSavingsAccount(member, input.accountId, 'withdrawal');
    const amount = normalizeEtbAmount(input.amount);
    const phone = normalizeEthiopianPhone(input.phone) ?? normalizeEthiopianPhone(member.phone);
    if (!phone) {
      throw new UnprocessableEntityException(
        'Enter a valid Ethiopian mobile number such as 0900123456',
      );
    }

    const balance = await this.savings.getBalance(account.id);
    if (etbGreaterThan(amount, balance.availableBalance)) {
      throw new UnprocessableEntityException(
        `Insufficient available funds. Requested: ${amount} ETB, Available: ${balance.availableBalance} ETB`,
      );
    }

    await this.otp.requireForHighValue({
      staffId: user.staffId,
      purpose: 'large-withdrawal',
      code: input.otp,
      amount,
      accountId: account.id,
    });

    const tenantId = this.requireTenantId();
    const txRef = buildChapaTxRef(tenantId);
    const bankCode = await this.resolvePayoutBankCode(input.channel);
    const repo = this.tenantContext.repo(ChapaPaymentEntity);
    const pending = repo.create({
      tenantId,
      memberId: member.id,
      accountId: account.id,
      txRef,
      amount,
      currency: 'ETB',
      kind: 'withdrawal',
      status: 'pending',
      payoutChannel: input.channel,
      bankCode,
      phone,
      email: member.email ?? null,
      checkoutUrl: null,
      chapaReference: null,
      mockConfirmed: false,
      ledgerTransactionId: null,
      holdId: null,
    });
    const saved = await repo.save(pending);

    const hold = await this.savings.holdFunds({
      accountId: account.id,
      amount,
      reason: `chapa-withdrawal:${txRef}`,
    });
    saved.holdId = hold.holdId;
    await repo.save(saved);

    if (!this.isLiveConfigured()) {
      this.logger.log(`Chapa mock withdrawal ${txRef} (CHAPA_SECRET_KEY not set)`);
      return this.toView(saved, 'mock');
    }

    const providerRef = await this.callChapaTransfer({
      txRef,
      amount,
      phone,
      accountName: `${member.firstName} ${member.lastName}`.trim() || 'Member',
      bankCode,
    });
    saved.chapaReference = providerRef;
    await repo.save(saved);
    return this.toView(saved, 'live');
  }

  async verifyWithdrawal(user: AuthenticatedUser, txRef: string): Promise<ChapaPaymentView> {
    const member = await this.resolveLinkedMember(user);
    const payment = await this.requireOwnPayment(member.id, txRef);
    if ((payment.kind ?? 'deposit') !== 'withdrawal') {
      throw new UnprocessableEntityException('This reference is a deposit, not a withdrawal');
    }
    return this.syncPayment(payment);
  }

  async confirmMockWithdrawal(user: AuthenticatedUser, txRef: string): Promise<ChapaPaymentView> {
    if (this.isLiveConfigured()) {
      throw new ForbiddenException('Mock payout is disabled while Chapa is configured');
    }
    const member = await this.resolveLinkedMember(user);
    const payment = await this.requireOwnPayment(member.id, txRef);
    if ((payment.kind ?? 'deposit') !== 'withdrawal') {
      throw new UnprocessableEntityException('This reference is a deposit, not a withdrawal');
    }
    if (payment.status === 'failed') {
      throw new UnprocessableEntityException('This payout already failed');
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

  /**
   * Chapa Transfer approval URL. 200 approves the payout; 400 rejects it.
   * Dashboard setting, not the C2B callback. HMAC uses
   * `CHAPA_TRANSFER_APPROVAL_SECRET` when set, otherwise `CHAPA_WEBHOOK_SECRET`.
   */
  async approveTransfer(input: {
    rawBody: Buffer | undefined;
    signature: string | null;
    body: unknown;
  }): Promise<{ status: 'APPROVED' }> {
    assertChapaWebhookSignature({
      secret:
        this.config.get<string>('CHAPA_TRANSFER_APPROVAL_SECRET')?.trim() ||
        this.config.get<string>('CHAPA_WEBHOOK_SECRET'),
      rawBody: input.rawBody,
      parsedBody: input.body,
      signature: input.signature,
    });

    const body = asRecord(input.body);
    const txRef = extractChapaTxRef(body);
    if (!txRef) {
      throw new BadRequestException('Transfer approval is missing reference');
    }
    const tenantId = parseTenantIdFromTxRef(txRef);
    if (!tenantId) {
      throw new BadRequestException('Transfer reference is not an ISMS payout');
    }

    await this.tenantContext.runInTenantContext(tenantId, async () => {
      const payment = await this.tenantContext.repo(ChapaPaymentEntity).findOne({
        where: { txRef },
      });
      if (!payment || (payment.kind ?? 'deposit') !== 'withdrawal' || payment.status === 'failed') {
        throw new BadRequestException('Unknown or ineligible transfer');
      }
      const amountRaw = body.amount;
      if (amountRaw !== undefined && amountRaw !== null) {
        if (normalizeEtbAmount(amountRaw) !== payment.amount) {
          throw new BadRequestException('Transfer amount does not match');
        }
      }
      const accountNumber =
        typeof body.account_number === 'string' ? body.account_number : null;
      const expectedPhone = payment.phone ? toChapaPhone(payment.phone) : null;
      const providedPhone = accountNumber ? normalizeEthiopianPhone(accountNumber) : null;
      if (expectedPhone && providedPhone && toChapaPhone(providedPhone) !== expectedPhone) {
        throw new BadRequestException('Transfer destination does not match');
      }
    });

    return { status: 'APPROVED' };
  }

  private async syncPayment(payment: ChapaPaymentEntity): Promise<ChapaPaymentView> {
    if ((payment.kind ?? 'deposit') === 'withdrawal') {
      return this.syncWithdrawal(payment);
    }

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

  private async syncWithdrawal(payment: ChapaPaymentEntity): Promise<ChapaPaymentView> {
    if (payment.status === 'paid') {
      return this.toView(payment);
    }

    const live = this.isLiveConfigured();
    if (live) {
      const verified = await this.callChapaTransferVerify(payment.txRef);
      const providerStatus = verified.data?.status ?? verified.status;
      const providerAmount = verified.data?.amount;
      if (providerAmount !== undefined && providerAmount !== null) {
        const verifiedAmount = normalizeEtbAmount(providerAmount);
        if (verifiedAmount !== payment.amount) {
          throw new ConflictException(
            'This payout reference was already used for a different amount',
          );
        }
      }
      if (chapaStatusIsPaid(providerStatus)) {
        const providerRef = readProviderRef(verified.data);
        await this.settleWithdrawal(payment, providerRef);
        return this.toView(payment, 'live');
      }
      if (chapaStatusIsFailed(providerStatus)) {
        await this.failWithdrawal(payment);
      }
      return this.toView(payment, 'live');
    }

    if (payment.mockConfirmed) {
      await this.settleWithdrawal(payment, `mock:${payment.txRef}`);
    }
    return this.toView(payment, 'mock');
  }

  private async settleWithdrawal(
    payment: ChapaPaymentEntity,
    providerRef: string | null,
  ): Promise<void> {
    if (payment.status === 'paid') {
      return;
    }
    if (!payment.holdId) {
      throw new UnprocessableEntityException('This payout has no reserved hold');
    }

    try {
      const txn = await this.savings.withdrawAgainstHold({
        accountId: payment.accountId,
        amount: payment.amount,
        holdId: payment.holdId,
        reference: payment.txRef,
        narration: `Chapa B2C ${payment.payoutChannel ?? 'wallet'} withdrawal`,
        postedByStaffId: null,
      });
      payment.status = 'paid';
      payment.chapaReference = providerRef ?? payment.chapaReference;
      payment.ledgerTransactionId = txn.id;
      await this.tenantContext.repo(ChapaPaymentEntity).save(payment);
    } catch (err) {
      if (err instanceof SyncConflictException) {
        throw new ConflictException(
          'This payout reference was already used for a different amount',
        );
      }
      throw err;
    }
  }

  private async failWithdrawal(payment: ChapaPaymentEntity): Promise<void> {
    if (payment.status === 'failed') {
      return;
    }
    if (payment.holdId) {
      try {
        await this.savings.releaseHold(payment.holdId);
      } catch (err) {
        if (!(err instanceof ConflictException) && !(err instanceof NotFoundException)) {
          throw err;
        }
      }
    }
    payment.status = 'failed';
    await this.tenantContext.repo(ChapaPaymentEntity).save(payment);
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
    const secret = this.secretKey();
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
      const txRef = typeof payload.tx_ref === 'string' ? payload.tx_ref : '';
      this.logger.warn(
        `Chapa initialize ${response.status} tx_ref_len=${txRef.length}: ${stringifyChapaError(body)}`,
      );
      throw new ServiceUnavailableException(stringifyChapaError(body));
    }
    return checkoutUrl;
  }

  private async callChapaVerify(txRef: string): Promise<ChapaVerifyPayload> {
    const secret = this.secretKey();
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

  private async callChapaTransfer(input: {
    txRef: string;
    amount: string;
    phone: string;
    accountName: string;
    bankCode: string;
  }): Promise<string | null> {
    const secret = this.secretKey();
    const payload: Record<string, unknown> = {
      account_name: clipChapaName(input.accountName, 'Member'),
      account_number: toChapaPhone(input.phone),
      amount: input.amount,
      currency: 'ETB',
      reference: input.txRef,
      bank_code: Number(input.bankCode) || input.bankCode,
    };
    if (isChapaTestKey(secret)) {
      payload.status = 'success';
    }

    const response = await this.chapaFetch(CHAPA_TRANSFER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => ({}))) as {
      status?: unknown;
      data?: { id?: unknown; reference?: unknown; status?: unknown } | string;
      message?: unknown;
    };
    if (!response.ok) {
      this.logger.warn(`Chapa transfer ${response.status}: ${stringifyChapaError(body)}`);
      throw new ServiceUnavailableException(stringifyChapaError(body, 'Could not start Chapa payout'));
    }
    const data = body.data && typeof body.data === 'object' ? body.data : {};
    if (typeof data.reference === 'string' && data.reference.trim()) {
      return data.reference.trim();
    }
    if (typeof data.id === 'string' || typeof data.id === 'number') {
      return String(data.id);
    }
    return null;
  }

  private async callChapaTransferVerify(txRef: string): Promise<ChapaVerifyPayload> {
    const secret = this.secretKey();
    const url = `${CHAPA_TRANSFER_VERIFY_URL}/${encodeURIComponent(txRef)}`;
    const response = await this.chapaFetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${secret}` },
    });
    const body = (await response.json().catch(() => ({}))) as ChapaVerifyPayload;
    if (!response.ok) {
      throw new ServiceUnavailableException('Could not verify Chapa payout');
    }
    return body;
  }

  private async resolvePayoutBankCode(channel: ChapaPayoutChannel): Promise<string> {
    const envKey = channel === 'telebirr' ? 'CHAPA_TELEBIRR_BANK_CODE' : 'CHAPA_MPESA_BANK_CODE';
    const fromEnv = this.config.get<string>(envKey)?.trim();
    if (fromEnv) {
      return fromEnv;
    }
    if (this.isLiveConfigured()) {
      const matched = matchBankCode(await this.loadChapaBanks(), channel);
      if (matched) {
        return matched;
      }
    }
    return FALLBACK_BANK_CODES[channel];
  }

  private async loadChapaBanks(): Promise<ChapaBankRow[]> {
    const now = Date.now();
    if (this.banksCache && now - this.banksCache.at < 10 * 60 * 1000) {
      return this.banksCache.rows;
    }
    const secret = this.secretKey();
    const response = await this.chapaFetch(CHAPA_BANKS_URL, {
      method: 'GET',
      headers: { Authorization: `Bearer ${secret}` },
    });
    const body = (await response.json().catch(() => ({}))) as { data?: unknown };
    const rows = Array.isArray(body.data) ? (body.data as ChapaBankRow[]) : [];
    this.banksCache = { at: now, rows };
    return rows;
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

  private async resolveOwnSavingsAccount(
    member: Member,
    accountId?: string,
    purpose: 'deposit' | 'withdrawal' = 'deposit',
  ): Promise<Account> {
    const action = purpose === 'withdrawal' ? 'withdraw from' : 'deposit into';
    const noun = purpose === 'withdrawal' ? 'withdrawals' : 'deposits';
    if (accountId) {
      const account = await this.savings.getAccountById(accountId);
      if (account.memberId !== member.id) {
        throw new ForbiddenException(`Members can only ${action} their own savings account`);
      }
      if (account.type !== 'savings') {
        throw new UnprocessableEntityException(`Chapa ${noun} must use a savings account`);
      }
      if (account.status !== 'active') {
        throw new UnprocessableEntityException(
          `Account is ${account.status}; ${noun} require an active account`,
        );
      }
      return account;
    }

    const accounts = await this.savings.getAccountsByMember(member.id);
    const savings = accounts.find((row) => row.type === 'savings' && row.status === 'active');
    if (!savings) {
      throw new UnprocessableEntityException(
        `You need an active savings account before ${purpose === 'withdrawal' ? 'withdrawing' : 'depositing'}`,
      );
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
      kind: payment.kind ?? 'deposit',
      mode,
      checkoutUrl: payment.checkoutUrl,
      payoutChannel: payment.payoutChannel ?? null,
      ledgerTransactionId: payment.ledgerTransactionId,
    };
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function readProviderRef(data: ChapaVerifyPayload['data'] | undefined): string | null {
  if (!data) {
    return null;
  }
  if (typeof data.reference === 'string' && data.reference.trim()) {
    return data.reference.trim();
  }
  if (typeof data.id === 'string' || typeof data.id === 'number') {
    return String(data.id);
  }
  return null;
}

function matchBankCode(banks: ChapaBankRow[], channel: ChapaPayoutChannel): string | null {
  const needles =
    channel === 'mpesa' ? ['mpesa', 'm-pesa', 'safaricom'] : ['telebirr', 'tele birr'];
  for (const bank of banks) {
    const hay = `${String(bank.slug ?? '')} ${String(bank.name ?? '')}`.toLowerCase();
    if (!needles.some((needle) => hay.includes(needle))) {
      continue;
    }
    if (typeof bank.id === 'number' || typeof bank.id === 'string') {
      return String(bank.id);
    }
  }
  return null;
}
