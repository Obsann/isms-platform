/**
 * Shape of `request.user`, set by `JwtAuthGuard` from the JWT claims and read by
 * `TenantContextGuard` to resolve tenant context. `tenantId: null` is a
 * platform-level (Super Admin) staff account — see `staff_accounts.tenant_id`.
 */
export interface AuthenticatedUser {
  staffId: string;
  tenantId: string | null;
  role: string;
}
