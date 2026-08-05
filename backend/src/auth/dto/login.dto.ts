import { IsString, MinLength } from 'class-validator';
import type { LoginRequest } from '../../types';

/**
 * Runtime-validated form of the shared `LoginRequest` contract — `implements` is what
 * keeps the two from drifting.
 *
 * `tenantCode` is required, not optional: `staff_accounts` is RLS-scoped and its
 * policy is fail-closed, so there is no "look up the user first, then figure out
 * the tenant" path. See `resolve_tenant_by_code` in the `TenantBootstrapLookup`
 * migration for how the code is resolved before any tenant context exists.
 */
export class LoginDto implements LoginRequest {
  @IsString()
  @MinLength(1)
  tenantCode!: string;

  @IsString()
  @MinLength(1)
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
