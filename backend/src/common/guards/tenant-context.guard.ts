import { Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TenantContextService } from '../tenant-context/tenant-context.service';
import type { AuthenticatedUser } from '../types/authenticated-user';

/**
 * Resolves the tenant for the request from the JWT (set on `request.user` by
 * `JwtAuthGuard`, which must run first) and opens the Postgres transaction that sets
 * the RLS session variable, so no query anywhere ever needs a hand-written
 * `WHERE tenant_id = ?`. `TenantContextInterceptor` commits/rolls back and releases
 * once the handler has run.
 *
 * `@Public()` routes (health, login) skip this entirely. Everything else fails
 * closed: no authenticated user on the request is a bug in guard ordering, not a
 * case to quietly allow through.
 */
@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    await this.tenantContext.attachForRequest(user.tenantId);
    return true;
  }
}
