import { Injectable, ForbiddenException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../types/authenticated-user';
import { ROLES_METADATA_KEY, type RoleName } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Enforces the `@Roles()` decorator. Must run **after** `JwtAuthGuard` because it
 * reads `request.user.role` set by the JWT strategy.
 *
 * Routes with no `@Roles()` decoration allow any authenticated user.
 * Routes tagged `@Public()` bypass this guard entirely.
 *
 * Registered as a global APP_GUARD so no controller needs to import or declare it;
 * only the `@Roles(...)` decorator is needed on each protected resource.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No authenticated user on request');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Role '${ user.role }' is not permitted for this resource. Required: [${ requiredRoles.join(', ') }]`,
      );
    }

    return true;
  }
}
