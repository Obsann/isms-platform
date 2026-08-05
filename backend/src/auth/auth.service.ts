import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { TenantContextService } from '../common';
import { StaffAccountService } from '../security-audit';
import { TenantsService } from '../tenants';
import type { LoginResponse } from '../types';
import type { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './auth.types';

const INVALID_CREDENTIALS = 'Invalid tenant code, email, or password';

@Injectable()
export class AuthService {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly staffAccountService: StaffAccountService,
    private readonly tenantContext: TenantContextService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponse> {
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

    const passwordMatches = await bcrypt.compare(dto.password, staff.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    await this.tenantContext.runInTenantContext(tenant.id, () =>
      this.staffAccountService.touchLastLogin(staff.id),
    );

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
