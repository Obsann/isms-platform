import { Injectable, NotImplementedException, type CanActivate } from '@nestjs/common';

/**
 * Resolves the tenant for the request from the JWT and sets the Postgres RLS
 * session variable, so no query ever needs a hand-written `WHERE tenant_id = ?`.
 *
 * TODO(Task 3 — Obsan): implement against the JWT `tenant_id` claim and wire it as
 * a global guard, with the health route and `POST /api/auth/login` exempted.
 *
 * Deliberately unwired and fail-closed until then: a half-built tenant guard that
 * returns `true` is worse than no guard, because it looks like protection.
 */
@Injectable()
export class TenantContextGuard implements CanActivate {
  canActivate(): boolean {
    throw new NotImplementedException('Tenant context resolution is not implemented yet');
  }
}
