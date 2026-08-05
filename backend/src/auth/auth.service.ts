import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { TenantContextService } from '../common';
import { StaffAccountService } from '../security-audit';
import { TenantsService } from '../tenants';
import type { LoginDto } from './dto/login.dto';
import type { JwtPayload, LoginResult } from './auth.types';

const INVALID_CREDENTIALS = 'Invalid tenant code, email, or password';

@Injectable()
export class AuthService {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly staffAccountService: StaffAccountService,
    private readonly tenantContext: TenantContextService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResult> {
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
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '8h'),
      staff: {
        id: staff.id,
        tenantId: staff.tenantId,
        email: staff.email,
        fullName: staff.fullName,
        role: staff.role,
      },
    };
  }
}
