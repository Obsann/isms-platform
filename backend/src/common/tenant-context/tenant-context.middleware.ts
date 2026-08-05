import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { TenantContextService } from './tenant-context.service';

/**
 * Opens the `AsyncLocalStorage` scope for the whole request, before routing even
 * starts, by wrapping the real `next()` call. `TenantContextGuard` fills in the
 * tenant id and query runner once the JWT is verified; `TenantContextInterceptor`
 * closes it out after the handler runs. Applied globally in `AppModule.configure()`.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly tenantContext: TenantContextService) {}

  use(_req: Request, _res: Response, next: NextFunction): void {
    this.tenantContext.runRequestScope(() => next());
  }
}
