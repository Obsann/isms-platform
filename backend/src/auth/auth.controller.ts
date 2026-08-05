import { Body, Controller, Get, NotFoundException, Post } from '@nestjs/common';
import { Public, type AuthenticatedUser } from '../common';
import { StaffAccountService } from '../security-audit';
import type { AuthUser, LoginResponse } from '../types';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';

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

  /**
   * Authenticated + tenant-scoped. Exercising this is the concrete way to prove the
   * whole guard/interceptor pipeline: it re-queries `staff_accounts` through the
   * tenant context resolved from the caller's own JWT, so it can only ever resolve
   * that caller's own tenant's row.
   */
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser): Promise<AuthUser> {
    const summary = await this.staffAccountService.findSummaryById(user.staffId);
    if (!summary) {
      throw new NotFoundException('Staff account not found');
    }
    return summary;
  }
}
