import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { NotificationService } from '../channel-integration';
import { TenantContextService } from '../common';
import {
  OTP_PURPOSE_LABEL,
  OtpService,
  StaffAccountService,
  type IssueOtpResult,
  type OtpPurpose,
  type StaffCredential,
} from '../security-audit';
import { TenantsService } from '../tenants';
import { PLATFORM_TENANT_CODE, type LoginResponse } from '../types';
import type { JwtPayload } from './auth.types';
import type { LoginDto } from './dto/login.dto';

const INVALID_CREDENTIALS = 'Invalid tenant code, email, or password';
const FORGOT_PASSWORD_ACK =
  'If an account exists for that tenant and email, a verification code has been sent.';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly tenantsService: TenantsService,
    private readonly staffAccountService: StaffAccountService,
    private readonly tenantContext: TenantContextService,
    private readonly jwtService: JwtService,
    private readonly otp: OtpService,
    private readonly notifications: NotificationService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponse> {
    const staff =
      dto.tenantCode === PLATFORM_TENANT_CODE
        ? await this.authenticatePlatformStaff(dto)
        : await this.authenticateTenantStaff(dto);

    const payload: JwtPayload = { sub: staff.id, tenantId: staff.tenantId, role: staff.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      expiresIn: this.secondsUntilExpiry(accessToken),
      user: {
        id: staff.id,
        tenantId: staff.tenantId,
        email: staff.email,
        fullName: staff.fullName,
        role: staff.role,
        isActive: staff.isActive,
      },
    };
  }

  async requestOtp(
    staffId: string,
    purpose: OtpPurpose,
    extras?: { amount?: string; accountId?: string; loanId?: string },
  ): Promise<IssueOtpResult> {
    if (purpose === 'password-reset') {
      throw new BadRequestException('Use the forgot-password form to reset a password');
    }

    const summary = await this.staffAccountService.findSummaryById(staffId);
    if (!summary?.email) {
      throw new UnauthorizedException('Account not found');
    }

    if (purpose === 'large-withdrawal') {
      if (!extras?.amount || !extras.accountId) {
        throw new BadRequestException('amount and accountId are required for a large-withdrawal code');
      }
      if (!this.otp.amountRequiresOtp(extras.amount)) {
        throw new BadRequestException(
          `OTP is only required for withdrawals of ${this.otp.highValueThreshold()} ETB or more`,
        );
      }
    }

    if (purpose === 'loan-disbursement') {
      if (!extras?.amount || !extras.loanId) {
        throw new BadRequestException('amount and loanId are required for a loan-disbursement code');
      }
      if (!this.otp.amountRequiresOtp(extras.amount)) {
        throw new BadRequestException(
          `OTP is only required for disbursements of ${this.otp.highValueThreshold()} ETB or more`,
        );
      }
    }

    const { challenge, code } = await this.otp.issue({
      tenantId: summary.tenantId,
      staffId,
      email: summary.email,
      purpose,
      context:
        purpose === 'password-change'
          ? undefined
          : { amount: extras?.amount, accountId: extras?.accountId, loanId: extras?.loanId },
    });

    await this.deliverOtp(summary.email, code, purpose, challenge.expiresInSeconds);
    return challenge;
  }

  async forgotPassword(tenantCode: string, email: string): Promise<{ message: string }> {
    const staff = await this.lookupActiveStaff(tenantCode, email);
    if (staff) {
      try {
        const { challenge, code } = await this.otp.issue({
          tenantId: staff.tenantId,
          staffId: staff.id,
          email: staff.email,
          purpose: 'password-reset',
        });
        await this.deliverOtp(staff.email, code, 'password-reset', challenge.expiresInSeconds);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Forgot-password OTP failed for ${email}: ${message}`);
      }
    }
    return { message: FORGOT_PASSWORD_ACK };
  }

  async resetPassword(input: {
    tenantCode: string;
    email: string;
    otp: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const staff = await this.lookupActiveStaff(input.tenantCode, input.email);
    if (!staff) {
      throw new UnauthorizedException('Invalid reset request');
    }

    await this.tenantContext.runInTenantContext(staff.tenantId, async () => {
      await this.otp.verifyAndConsume({
        staffId: staff.id,
        purpose: 'password-reset',
        code: input.otp,
      });
      const newHash = await bcrypt.hash(input.newPassword, 10);
      await this.staffAccountService.updatePassword(staff.id, newHash);
    });

    return { success: true, message: 'Password reset successfully. You can sign in now.' };
  }

  async changePassword(
    staffId: string,
    tenantId: string | null,
    currentPass: string,
    newPass: string,
    otp: string,
  ): Promise<{ success: boolean; message: string }> {
    let credential: StaffCredential | null = null;

    if (!tenantId) {
      const summary = await this.staffAccountService.findSummaryById(staffId);
      if (summary) {
        credential = await this.staffAccountService.findActivePlatformByEmail(summary.email);
      }
    } else {
      credential = await this.staffAccountService.findCredentialById(staffId);
    }

    if (!credential) {
      throw new UnauthorizedException('Account not found');
    }

    await this.assertPassword(currentPass, credential.passwordHash);
    await this.otp.verifyAndConsume({
      staffId,
      purpose: 'password-change',
      code: otp,
    });

    const newHash = await bcrypt.hash(newPass, 10);
    await this.staffAccountService.updatePassword(staffId, newHash);

    return { success: true, message: 'Password updated successfully' };
  }

  private async lookupActiveStaff(tenantCode: string, email: string): Promise<StaffCredential | null> {
    if (tenantCode === PLATFORM_TENANT_CODE) {
      return this.staffAccountService.findActivePlatformByEmail(email);
    }
    const tenant = await this.tenantsService.resolveActiveByCode(tenantCode);
    if (!tenant) {
      return null;
    }
    return this.tenantContext.runInTenantContext(tenant.id, () =>
      this.staffAccountService.findActiveByTenantAndEmail(tenant.id, email),
    );
  }

  private async deliverOtp(
    to: string,
    code: string,
    purpose: OtpPurpose,
    expirySeconds: number,
  ): Promise<void> {
    try {
      await this.notifications.send({
        template: 'otp',
        to,
        data: {
          code,
          expirySeconds,
          purpose: OTP_PURPOSE_LABEL[purpose],
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isProd = this.config.get<string>('NODE_ENV') === 'production';
      if (isProd) {
        throw new UnprocessableEntityException('Could not send the verification email. Try again shortly.');
      }
      this.logger.warn(`OTP email not sent (${message}). Development code for ${purpose}: ${code}`);
    }
  }

  private async authenticateTenantStaff(dto: LoginDto): Promise<StaffCredential> {
    // Resolves via the SECURITY DEFINER function — bypasses RLS for this one lookup
    // only, since no tenant context can exist yet at this point in the flow.
    const tenant = await this.tenantsService.resolveActiveByCode(dto.tenantCode);
    if (!tenant) {
      // Same message as a bad password: don't let login responses reveal whether a
      // tenant code exists at all.
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const staff = await this.tenantContext.runInTenantContext(tenant.id, () =>
      this.staffAccountService.findActiveByTenantAndEmail(tenant.id, dto.email),
    );
    if (!staff) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    await this.assertPassword(dto.password, staff.passwordHash);

    await this.tenantContext.runInTenantContext(tenant.id, () =>
      this.staffAccountService.touchLastLogin(staff.id),
    );

    return staff;
  }

  private async authenticatePlatformStaff(dto: LoginDto): Promise<StaffCredential> {
    const staff = await this.staffAccountService.findActivePlatformByEmail(dto.email);
    if (!staff) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    await this.assertPassword(dto.password, staff.passwordHash);
    // last_login_at is skipped: touching it would need another SECURITY DEFINER
    // write. The JWT is enough for Task 4 portal routing.
    return staff;
  }

  private async assertPassword(plain: string, passwordHash: string): Promise<void> {
    const passwordMatches = await bcrypt.compare(plain, passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
  }

  /**
   * Read back off the token's own claims rather than parsing `JWT_EXPIRES_IN`. The
   * config value is a duration string like `8h`, the client wants a number of seconds
   * to schedule against, and deriving it from `exp - iat` means the two can never
   * disagree about when the token actually dies.
   */
  private secondsUntilExpiry(accessToken: string): number {
    const decoded = this.jwtService.decode<JwtPayload & { exp?: number; iat?: number }>(
      accessToken,
    );
    if (!decoded?.exp || !decoded.iat) {
      return 0;
    }
    return decoded.exp - decoded.iat;
  }
}
