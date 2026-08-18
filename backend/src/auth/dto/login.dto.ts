import { IsString, MinLength } from 'class-validator';
import type { LoginRequest } from '../../types';

/**
 * Runtime-validated form of the shared `LoginRequest` contract — `implements` is what
 * keeps the two from drifting.
 *
 * `tenantCode` is required, not optional: `staff_accounts` is RLS-scoped and its
 * policy is fail-closed, so there is no "look up the user first, then figure out
 * the tenant" path. Real tenants resolve via `resolve_tenant_by_code`. The reserved
 * code `platform` resolves platform super-admin via `resolve_platform_staff_by_email`.
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
