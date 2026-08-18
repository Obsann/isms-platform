import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from '../common/entities/tenant-scoped.entity';
import type { TransactionType } from '../types';
import type { GlCode, LedgerSide } from './ledger.types';

/**
 * One side of a balanced posting. Rows that share `postingId` are one atomic journal
 * entry — Task 13 rejects the whole posting if those sides do not sum equal.
 */
@Entity('ledger_entries')
@Index('idx_ledger_entries_tenant_id', ['tenantId'])
@Index('idx_ledger_entries_tenant_posting', ['tenantId', 'postingId'])
export class LedgerEntryEntity extends TenantScopedEntity {
  /** Groups the debit/credit pair (or more lines) of a single posting. */
  @Column({ name: 'posting_id', type: 'uuid' })
  postingId!: string;

  @Column({ name: 'account_id', type: 'uuid', nullable: true })
  accountId!: string | null;

  @Column({ name: 'gl_code', type: 'varchar', length: 64 })
  glCode!: GlCode;

  @Column({ type: 'varchar', length: 8 })
  side!: LedgerSide;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount!: string;

  @Column({ type: 'char', length: 3, default: 'ETB' })
  currency!: string;

  @Column({ type: 'varchar', length: 32 })
  type!: TransactionType;

  @Column({ type: 'varchar', length: 128, nullable: true })
  reference!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  narration!: string | null;

  @Column({ name: 'posted_by_staff_id', type: 'uuid', nullable: true })
  postedByStaffId!: string | null;

  @Column({ name: 'posted_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  postedAt!: Date;
}
