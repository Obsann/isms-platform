import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChannelIntegrationModule } from './channel-integration';
import { DatabaseModule } from './database/database.module';
import { DocumentsReportingModule } from './documents-reporting';
import { HealthModule } from './health/health.module';
import { LoanModule } from './loans';
import { MemberModule } from './members';
import { SavingsSharesModule } from './savings-shares';
import { SecurityAuditModule } from './security-audit';
import { TenantsModule } from './tenants';

/**
 * Composition root. This is the one place that references every module — modules
 * themselves never import each other's folders, only each other's exported services
 * through DI.
 *
 * TODO(Task 3 — Obsan): add `AuthModule` and register `TenantContextGuard` globally,
 * exempting the health route and the login endpoint.
 * TODO(Task 13 — Obsan): add `LedgerModule`, which Savings and Loans both post through.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    DatabaseModule,
    HealthModule,
    TenantsModule,
    MemberModule,
    SavingsSharesModule,
    LoanModule,
    DocumentsReportingModule,
    SecurityAuditModule,
    ChannelIntegrationModule,
  ],
})
export class AppModule {}
