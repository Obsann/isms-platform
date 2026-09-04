import { Body, Controller, Get, NotFoundException, Post } from '@nestjs/common';
import { Public, Roles, type AuthenticatedUser } from '../common';
import { StaffAccountService, type IssueOtpResult } from '../security-audit';
import type { AuthUser, LoginResponse } from '../types';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly staffAccountService: StaffAccountService,
  ) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.authService.forgotPassword(dto.tenantCode.trim(), dto.email.trim());
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto): Promise<{ success: boolean; message: string }> {
    return this.authService.resetPassword({
      tenantCode: dto.tenantCode.trim(),
      email: dto.email.trim(),
      otp: dto.otp,
      newPassword: dto.newPassword,
    });
  }

  /**
   * Authenticated + tenant-scoped. Exercising this is the concrete way to prove the
   * whole guard/interceptor pipeline: it re-queries `staff_accounts` through the
   * tenant context resolved from the caller's own JWT, so it can only ever resolve
   * that caller's own tenant's row.
   */
  @Get('me')
  @Roles('super-admin', 'tenant-admin', 'teller', 'loan-officer', 'member')
  async me(@CurrentUser() user: AuthenticatedUser): Promise<AuthUser> {
    const summary = await this.staffAccountService.findSummaryById(user.staffId);
    if (!summary) {
      throw new NotFoundException('Staff account not found');
    }
    return summary;
  }

  @Post('otp/request')
  @Roles('super-admin', 'tenant-admin', 'teller', 'loan-officer', 'member')
  requestOtp(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestOtpDto,
  ): Promise<IssueOtpResult> {
    return this.authService.requestOtp(user.staffId, dto.purpose, {
      amount: dto.amount,
      accountId: dto.accountId,
      loanId: dto.loanId,
    });
  }

  @Post('change-password')
  @Roles('super-admin', 'tenant-admin', 'teller', 'loan-officer', 'member')
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.authService.changePassword(
      user.staffId,
      user.tenantId,
      dto.currentPassword,
      dto.newPassword,
      dto.otp,
    );
  }
}
