import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import { TenantContextService } from '../common';
import type { RoleName, StaffId } from '../types';
import { StaffAccountEntity } from './staff-account.entity';
import type { StaffAccountSummary, StaffCredential } from './security-audit.types';

interface PlatformStaffRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: RoleName;
  is_active: boolean;
}

/**
 * The only way `AuthModule` (Task 3) reaches `staff_accounts` — per the module
 * boundary rule, it never imports `StaffAccountEntity` directly. Tenant-scoped
 * methods must run inside an active tenant context (`TenantContextService`).
 * Platform super-admin login is the exception: those rows have `tenant_id` NULL,
 * so they are looked up through `resolve_platform_staff_by_email` instead.
 */
@Injectable()
export class StaffAccountService {
  constructor(
    private readonly tenantContext: TenantContextService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /** Used by `AuthService.login` inside the tenant context resolved from `tenantCode`. */
  async findActiveByTenantAndEmail(tenantId: string, email: string): Promise<StaffCredential | null> {
    const staff = await this.tenantContext
      .repo(StaffAccountEntity)
      .findOne({ where: { tenantId, email, isActive: true } });
    return staff ? toCredential(staff) : null;
  }

  /**
   * Platform super-admin bootstrap — same idea as `resolve_tenant_by_code`.
   * Must not run inside tenant context: RLS would hide `tenant_id IS NULL` rows.
   */
  async findActivePlatformByEmail(email: string): Promise<StaffCredential | null> {
    const rows = await this.dataSource.query<PlatformStaffRow[]>(
      `SELECT * FROM resolve_platform_staff_by_email($1)`,
      [email],
    );
    const row = rows[0];
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      tenantId: null,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      isActive: row.is_active,
      passwordHash: row.password_hash,
    };
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
