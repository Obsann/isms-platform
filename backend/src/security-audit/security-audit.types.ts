import type { StaffId } from '../types';

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

export interface AuditLogEntry extends AuditLogEntryInput {
  id: string;
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
