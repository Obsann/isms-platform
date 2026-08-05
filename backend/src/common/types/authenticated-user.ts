import type { RoleName, StaffId, TenantId } from '../../types';

/**
 * Shape of `request.user`, set by `JwtAuthGuard` from the JWT claims and read by
 * `TenantContextGuard` to resolve tenant context. `tenantId: null` is a
 * platform-level (Super Admin) staff account — see `staff_accounts.tenant_id`.
 */
export interface AuthenticatedUser {
  staffId: StaffId;
  tenantId: TenantId | null;
  role: RoleName;
}
