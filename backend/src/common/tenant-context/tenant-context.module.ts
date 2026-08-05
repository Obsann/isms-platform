import { Global, Module } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';

/**
 * `@Global()` because tenant context is cross-cutting infrastructure needed by
 * nearly every module (the guard/interceptor pair, `AuthService`, `TenantsService`,
 * every future vertical's data access) — importing it once here, in `AppModule`,
 * makes `TenantContextService` injectable everywhere without every module having to
 * import this one explicitly.
 */
@Global()
@Module({
  providers: [TenantContextService],
  exports: [TenantContextService],
})
export class TenantContextModule {}
