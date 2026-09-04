import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { IsNull } from 'typeorm';
import { TenantContextService } from '../common';
import { toCents } from '../ledger';
import { OtpChallengeEntity } from './otp-challenge.entity';
import {
  HIGH_VALUE_OTP_THRESHOLD_DEFAULT,
  OTP_CODE_LENGTH,
  OTP_EXPIRY_SECONDS_DEFAULT,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  type IssueOtpInput,
  type IssueOtpResult,
  type OtpContext,
  type OtpPurpose,
  type VerifyOtpInput,
} from './otp.types';

@Injectable()
export class OtpService {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly config: ConfigService,
  ) {}

  expirySeconds(): number {
    const raw = Number(this.config.get<string>('OTP_EXPIRY_SECONDS', String(OTP_EXPIRY_SECONDS_DEFAULT)));
    return Number.isFinite(raw) && raw > 0 ? raw : OTP_EXPIRY_SECONDS_DEFAULT;
  }

  highValueThreshold(): string {
    return this.config.get<string>('HIGH_VALUE_OTP_THRESHOLD', HIGH_VALUE_OTP_THRESHOLD_DEFAULT) ??
      HIGH_VALUE_OTP_THRESHOLD_DEFAULT;
  }

  amountRequiresOtp(amount: string): boolean {
    return toCents(amount) >= toCents(this.highValueThreshold());
  }

  /**
   * Persist a new challenge and return the plaintext code so the caller can email it.
   * Previous unused codes for the same staff + purpose are invalidated.
   */
  async issue(input: IssueOtpInput): Promise<{ challenge: IssueOtpResult; code: string }> {
    return this.withTenant(input.tenantId, async () => {
      const repo = this.tenantContext.repo(OtpChallengeEntity);
      const latest = await repo.findOne({
        where: { staffId: input.staffId, purpose: input.purpose, consumedAt: IsNull() },
        order: { createdAt: 'DESC' },
      });

      if (latest && !latest.consumedAt && Date.now() - latest.createdAt.getTime() < OTP_RESEND_COOLDOWN_SECONDS * 1000) {
        throw new HttpException(
          `Wait ${OTP_RESEND_COOLDOWN_SECONDS} seconds before requesting another code`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      await repo.update(
        { staffId: input.staffId, purpose: input.purpose, consumedAt: IsNull() },
        { consumedAt: new Date() },
      );

      const code = String(randomInt(0, 10 ** OTP_CODE_LENGTH)).padStart(OTP_CODE_LENGTH, '0');
      const expiresInSeconds = this.expirySeconds();
      const row = repo.create({
        tenantId: input.tenantId,
        staffId: input.staffId,
        email: input.email,
        purpose: input.purpose,
        codeHash: await bcrypt.hash(code, 10),
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
        consumedAt: null,
        attempts: 0,
        context: input.context ?? null,
      });
      await repo.save(row);

      return {
        code,
        challenge: {
          expiresInSeconds,
          maskedEmail: maskEmail(input.email),
          purpose: input.purpose,
        },
      };
    });
  }

  async verifyAndConsume(input: VerifyOtpInput): Promise<void> {
    const repo = this.tenantContext.repo(OtpChallengeEntity);
    const challenge = await repo.findOne({
      where: { staffId: input.staffId, purpose: input.purpose, consumedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });

    if (!challenge || challenge.consumedAt) {
      throw new UnprocessableEntityException('No active verification code. Request a new one.');
    }
    if (challenge.expiresAt.getTime() <= Date.now()) {
      challenge.consumedAt = new Date();
      await repo.save(challenge);
      throw new UnprocessableEntityException('Verification code expired. Request a new one.');
    }
    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      challenge.consumedAt = new Date();
      await repo.save(challenge);
      throw new UnprocessableEntityException('Too many incorrect attempts. Request a new code.');
    }

    const matches = await bcrypt.compare(input.code.trim(), challenge.codeHash);
    if (!matches) {
      challenge.attempts += 1;
      await repo.save(challenge);
      throw new UnprocessableEntityException('Invalid verification code');
    }

    if (!contextMatches(challenge.context, input.context)) {
      challenge.attempts += 1;
      await repo.save(challenge);
      throw new UnprocessableEntityException(
        'Verification code does not match this transaction. Request a new code.',
      );
    }

    challenge.consumedAt = new Date();
    await repo.save(challenge);
  }

  /**
   * High-value cash / disbursement gate. No-op below the threshold.
   * Missing code is 403 so a forgotten field is not confused with a bad password (401).
   */
  async requireForHighValue(input: {
    staffId: string | null | undefined;
    purpose: Extract<OtpPurpose, 'large-withdrawal' | 'loan-disbursement'>;
    code?: string;
    amount: string;
    accountId?: string;
    loanId?: string;
  }): Promise<void> {
    if (!this.amountRequiresOtp(input.amount)) {
      return;
    }
    if (!input.staffId) {
      throw new ForbiddenException('Authentication required for this amount');
    }
    const code = input.code?.trim();
    if (!code) {
      throw new ForbiddenException(
        `Amounts of ${this.highValueThreshold()} ETB or more require an email verification code`,
      );
    }
    await this.verifyAndConsume({
      staffId: input.staffId,
      purpose: input.purpose,
      code,
      context: {
        amount: input.amount,
        accountId: input.accountId,
        loanId: input.loanId,
      },
    });
  }

  private async withTenant<T>(tenantId: string | null, work: () => Promise<T>): Promise<T> {
    if (this.tenantContext.peekStore()) {
      return work();
    }
    return this.tenantContext.runInTenantContext(tenantId, work);
  }
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) {
    return '***';
  }
  const visible = local.slice(0, 1) || '*';
  return `${visible}***@${domain}`;
}

function contextMatches(stored: OtpContext | null, expected?: OtpContext): boolean {
  if (!stored) {
    return true;
  }
  if (stored.amount && expected?.amount && stored.amount !== expected.amount) {
    return false;
  }
  if (stored.accountId && expected?.accountId && stored.accountId !== expected.accountId) {
    return false;
  }
  if (stored.loanId && expected?.loanId && stored.loanId !== expected.loanId) {
    return false;
  }
  return true;
}
