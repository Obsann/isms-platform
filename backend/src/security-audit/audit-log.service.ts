import { Injectable, NotImplementedException } from '@nestjs/common';
import type { AuditLogEntryInput, AuditLogPage, AuditLogQuery } from './security-audit.types';

/**
 * Security & Audit vertical — owner: **Obsan** (Task 22).
 *
 * Every state-changing action across every vertical records an entry here with actor
 * and timestamp. Append-only: entries are never updated or deleted, which is the
 * whole point of an audit log.
 */
@Injectable()
export class AuditLogService {
  record(entry: AuditLogEntryInput): Promise<void> {
    throw new NotImplementedException('AuditLogService.record is not implemented (Task 22)');
  }

  query(filter: AuditLogQuery): Promise<AuditLogPage> {
    throw new NotImplementedException('AuditLogService.query is not implemented (Task 22)');
  }
}
