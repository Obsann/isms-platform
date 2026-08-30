import { Injectable } from '@nestjs/common';
import { TenantContextService } from '../common';
import { AuditLogEntity } from './audit-log.entity';
import type { AuditLogEntry, AuditLogEntryInput, AuditLogPage, AuditLogQuery } from './security-audit.types';

/**
 * Append-only audit trail. Every state-changing request is recorded with actor
 * and timestamp (Task 22). There is no update or delete method on purpose.
 */
@Injectable()
export class AuditLogService {
  constructor(private readonly tenantContext: TenantContextService) {}

  async record(entry: AuditLogEntryInput): Promise<void> {
    const repo = this.tenantContext.repo(AuditLogEntity);
    const row = repo.create({
      tenantId: this.tenantContext.getTenantId(),
      actorStaffId: entry.actorStaffId,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      before: entry.before ?? null,
      after: entry.after ?? null,
    });
    await repo.save(row);
  }

  async query(filter: AuditLogQuery): Promise<AuditLogPage> {
    const repo = this.tenantContext.repo(AuditLogEntity);
    const qb = repo.createQueryBuilder('audit');

    if (filter.actorStaffId) {
      qb.andWhere('audit.actorStaffId = :actorStaffId', { actorStaffId: filter.actorStaffId });
    }
    if (filter.action) {
      qb.andWhere('audit.action = :action', { action: filter.action });
    }
    if (filter.entityId) {
      qb.andWhere('audit.entityId = :entityId', { entityId: filter.entityId });
    }
    if (filter.from) {
      qb.andWhere('audit.occurredAt >= :from', { from: filter.from });
    }
    if (filter.to) {
      qb.andWhere('audit.occurredAt <= :to', { to: filter.to });
    }

    const limit = filter.limit ?? 50;
    const offset = filter.offset ?? 0;
    qb.orderBy('audit.occurredAt', 'DESC').take(limit).skip(offset);

    const [rows, total] = await qb.getManyAndCount();
    return { items: rows.map(toEntry), total };
  }
}

function toEntry(row: AuditLogEntity): AuditLogEntry {
  return {
    id: row.id,
    actorStaffId: row.actorStaffId,
    action: row.action,
    entity: row.entity,
    entityId: row.entityId,
    before: row.before ?? undefined,
    after: row.after ?? undefined,
    occurredAt: row.occurredAt.toISOString(),
  };
}
