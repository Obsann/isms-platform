import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogService } from './audit-log.service';
import { RolePermissionEntity } from './role-permission.entity';
import { StaffAccountEntity } from './staff-account.entity';
import { StaffAccountService } from './staff-account.service';

/**
 * Holds the two identity/authorization tables from schema v1: `staff_accounts` and
 * `roles_permissions`.
 *
 * `AuthModule` (Task 3) reads `staff_accounts` through `StaffAccountService` — the
 * exported service — never through `StaffAccountEntity` directly.
 *
 * TODO(Task 22 — Obsan): add the `RolesGuard` enforcing `@Roles(...)` against the RBAC
 * matrix, plus the audit-log entity.
 */
@Module({
  imports: [TypeOrmModule.forFeature([StaffAccountEntity, RolePermissionEntity])],
  providers: [AuditLogService, StaffAccountService],
  exports: [AuditLogService, StaffAccountService],
})
export class SecurityAuditModule {}
