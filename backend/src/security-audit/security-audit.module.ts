import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogService } from './audit-log.service';
import { RolePermissionEntity } from './role-permission.entity';
import { StaffAccountEntity } from './staff-account.entity';

/**
 * Holds the two identity/authorization tables from schema v1: `staff_accounts` and
 * `roles_permissions`.
 *
 * TODO(Task 3 — Obsan): the auth module reads `staff_accounts` through this module's
 * exported service rather than reaching for the repository directly.
 * TODO(Task 22 — Obsan): add the `RolesGuard` enforcing `@Roles(...)` against the RBAC
 * matrix, plus the audit-log entity.
 */
@Module({
  imports: [TypeOrmModule.forFeature([StaffAccountEntity, RolePermissionEntity])],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class SecurityAuditModule {}
