import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogController } from './audit-log.controller';
import { AuditLogEntity } from './audit-log.entity';
import { AuditLogService } from './audit-log.service';
import { OtpChallengeEntity } from './otp-challenge.entity';
import { OtpService } from './otp.service';
import { RolePermissionEntity } from './role-permission.entity';
import { StaffAccountEntity } from './staff-account.entity';
import { StaffAccountService } from './staff-account.service';

/**
 * Holds identity/authorization tables (`staff_accounts`, `roles_permissions`)
 * plus the Task 22 audit log. `AuthModule` reads staff through
 * `StaffAccountService` only — never `StaffAccountEntity` directly.
 *
 * `RolesGuard` lives in `common/` next to the `@Roles` decorator and is
 * registered globally from `AppModule`. `AuditLogInterceptor` is exported as a
 * class so `AppModule` can register it after `TenantContextInterceptor`.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([StaffAccountEntity, RolePermissionEntity, AuditLogEntity, OtpChallengeEntity]),
  ],
  controllers: [AuditLogController],
  providers: [AuditLogService, StaffAccountService, OtpService],
  exports: [AuditLogService, StaffAccountService, OtpService],
})
export class SecurityAuditModule {}
