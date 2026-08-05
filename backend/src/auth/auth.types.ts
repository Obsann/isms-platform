import type { RoleName, StaffId, TenantId } from '../types';

/** Claims signed into the access token issued by `POST /api/auth/login`. */
export interface JwtPayload {
  /** Standard JWT subject claim — the staff account id. */
  sub: StaffId;
  tenantId: TenantId | null;
  role: RoleName;
}
