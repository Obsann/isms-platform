import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule, JwtAuthGuard } from './auth';
import { ChannelIntegrationModule } from './channel-integration';
import {
  RolesGuard,
  TenantContextGuard,
  TenantContextInterceptor,
  TenantContextMiddleware,
  TenantContextModule,
  RolesGuard,
} from './common';
import { DatabaseModule } from './database/database.module';
import { DocumentsReportingModule } from './documents-reporting';
import { HealthModule } from './health/health.module';
import { LedgerModule } from './ledger';
import { LoanModule } from './loans';
import { MemberSelfServiceModule } from './member-self-service';
import { MemberModule } from './members';
import { SavingsSharesModule } from './savings-shares';
import { AuditLogInterceptor, SecurityAuditModule } from './security-audit';
import { TenantsModule } from './tenants';

/**
 * Composition root. This is the one place that references every module — modules
 * themselves never import each other's folders, only each other's exported services
 * through DI.
 *
 * Global request pipeline: `TenantContextMiddleware` opens the `AsyncLocalStorage`
 * scope for the whole request first (middleware wraps the real `next()` call, which
 * is what makes the scope reliably reach guards, interceptors, and the handler as
 * one continuous async chain — attempting this from inside a guard instead does not
 * survive Nest's RxJS-based pipeline). Then `JwtAuthGuard` verifies the token and
 * populates `request.user`, then `RolesGuard` (Task 22) rejects an unauthorized
 * role before any tenant transaction opens, then `TenantContextGuard` opens the
 * per-request Postgres transaction and sets the RLS session variable from it.
 * `AuditLogInterceptor` records successful state-changing handlers inside that
 * transaction; `TenantContextInterceptor` commits/rolls back and releases once
 * the handler (and audit write) have run. `@Public()` (health, login) skips the
 * guards, but still runs through the middleware — it's a no-op for them since
 * nothing ever attaches a query runner.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    DatabaseModule,
    TenantContextModule,
    AuthModule,
    HealthModule,
    TenantsModule,
    MemberModule,
    LedgerModule,
    SavingsSharesModule,
    LoanModule,
    MemberSelfServiceModule,
    DocumentsReportingModule,
    SecurityAuditModule,
    ChannelIntegrationModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: TenantContextGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantContextMiddleware).forRoutes('*path');
  }
}
