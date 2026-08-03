import { Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';

/**
 * TODO(Task 22 — Obsan): add the `RolesGuard` that enforces `@Roles(...)` against the
 * RBAC matrix in `docs/rbac-matrix.md`, plus the audit-log entity. This merges before
 * each vertical owner applies the decorator to their own endpoints.
 */
@Module({
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class SecurityAuditModule {}
