import { Injectable } from '@nestjs/common';
import { TenantContextService } from '../common';
import type { StaffId } from '../types';
import { StaffAccountEntity } from './staff-account.entity';
import type { StaffAccountSummary, StaffCredential } from './security-audit.types';

/**
 * The only way `AuthModule` (Task 3) reaches `staff_accounts` — per the module
 * boundary rule, it never imports `StaffAccountEntity` directly. Every method here
 * must run inside an active tenant context (`TenantContextService`), since
 * `staff_accounts` carries the same `FORCE ROW LEVEL SECURITY` as every other
 * tenant-scoped table.
 */
@Injectable()
export class StaffAccountService {
  constructor(private readonly tenantContext: TenantContextService) {}

  /** Used by `AuthService.login` inside the tenant context resolved from `tenantCode`. */
  async findActiveByTenantAndEmail(tenantId: string, email: string): Promise<StaffCredential | null> {
    const staff = await this.tenantContext
      .repo(StaffAccountEntity)
      .findOne({ where: { tenantId, email, isActive: true } });
    return staff ? toCredential(staff) : null;
  }

  /** Used by `GET /api/auth/me` inside the tenant context resolved from the JWT. */
  async findSummaryById(staffId: StaffId): Promise<StaffAccountSummary | null> {
    const staff = await this.tenantContext.repo(StaffAccountEntity).findOne({ where: { id: staffId } });
    return staff ? toSummary(staff) : null;
  }

  async touchLastLogin(staffId: StaffId): Promise<void> {
    await this.tenantContext
      .repo(StaffAccountEntity)
      .update({ id: staffId }, { lastLoginAt: new Date() });
  }
}

function toSummary(staff: StaffAccountEntity): StaffAccountSummary {
  return {
    id: staff.id,
    tenantId: staff.tenantId,
    email: staff.email,
    fullName: staff.fullName,
    role: staff.role,
    isActive: staff.isActive,
  };
}

function toCredential(staff: StaffAccountEntity): StaffCredential {
  return { ...toSummary(staff), passwordHash: staff.passwordHash };
}
