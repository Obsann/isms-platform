import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { RoleName } from '../../types';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_METADATA_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedUser } from '../types/authenticated-user';

/**
 * Enforces `@Roles(...)` against the JWT `role` claim. Registered globally,
 * after `JwtAuthGuard` (needs `request.user`) and before `TenantContextGuard`
 * so an unauthorized role never opens a tenant transaction or reaches business
 * logic. `@Public()` routes skip this, same as the other two guards.
 *
 * Missing `@Roles` on an authenticated route is a 403, not a pass — fail closed
 * so a forgotten decorator cannot ship as "any logged-in role".
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const allowed = this.reflector.getAllAndOverride<RoleName[]>(ROLES_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!allowed || allowed.length === 0) {
      throw new ForbiddenException('This endpoint is not assigned to any role');
    }

    if (!allowed.includes(user.role)) {
      throw new ForbiddenException('Insufficient role for this endpoint');
    }

    return true;
  }
}
