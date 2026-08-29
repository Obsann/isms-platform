import type { AuthUser, StaffId } from '../types';

/**
 * Safe to return to a client — never includes `passwordHash`. Structurally the
 * shared `AuthUser` contract; the alias keeps the module's own vocabulary while
 * guaranteeing the two can't drift.
 */
export type StaffAccountSummary = AuthUser;

/**
 * For `AuthService`'s own credential check only. Crossing the module boundary with
 * this is deliberate — it's still a plain DTO, never the `StaffAccountEntity` itself.
 */
export interface StaffCredential extends StaffAccountSummary {
  passwordHash: string;
}

export interface AuditLogEntryInput {
  /** Who acted. Resolved from the JWT, never accepted from the request body. */
  actorStaffId: StaffId;
  /** Verb plus subject, e.g. `member.created`, `loan.approved`, `withdrawal.posted`. */
  action: string;
  entity: string;
  entityId: string;
  /** Serializable snapshots; omit or redact anything sensitive. */
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export interface AuditLogEntry {
  id: string;
  actorStaffId: StaffId | null;
  action: string;
  entity: string;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  occurredAt: string;
}

export interface AuditLogQuery {
  actorStaffId?: StaffId;
  action?: string;
  entityId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogPage {
  items: AuditLogEntry[];
  total: number;
}
