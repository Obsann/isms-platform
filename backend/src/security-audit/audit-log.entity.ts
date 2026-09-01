import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Append-only audit trail (Task 22). No `updated_at` — rows are never mutated.
 *
 * `tenant_id` is nullable like `staff_accounts`: NULL is a platform-level entry
 * (super-admin acting outside a SACCO). RLS uses `IS NOT DISTINCT FROM` so NULL
 * sessions see only NULL-scoped rows.
 */
@Entity('audit_logs')
@Index('idx_audit_logs_tenant_id', ['tenantId'])
@Index('idx_audit_logs_tenant_occurred', ['tenantId', 'occurredAt'])
@Index('idx_audit_logs_tenant_actor', ['tenantId', 'actorStaffId'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId!: string | null;

  @Column({ name: 'actor_staff_id', type: 'uuid', nullable: true })
  actorStaffId!: string | null;

  /** Verb plus subject, e.g. `POST /members`, `PATCH /loans/:id/approve`. */
  @Column({ type: 'varchar', length: 160 })
  action!: string;

  @Column({ type: 'varchar', length: 64 })
  entity!: string;

  @Column({ name: 'entity_id', type: 'varchar', length: 128 })
  entityId!: string;

  @Column({ type: 'jsonb', nullable: true })
  before!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  after!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt!: Date;
}
