import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from '../common/entities/tenant-scoped.entity';
import type { TransactionType } from '../types';

@Entity('savings_transactions')
@Index('idx_savings_transactions_tenant_id', ['tenantId'])
@Index('idx_savings_transactions_tenant_account', ['tenantId', 'accountId'])
export class SavingsTransactionEntity extends TenantScopedEntity {
  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ type: 'varchar', length: 32 })
  type!: TransactionType;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount!: string;

  @Column({ name: 'balance_after', type: 'numeric', precision: 18, scale: 2 })
  balanceAfter!: string;

  @Column({ type: 'char', length: 3, default: 'ETB' })
  currency!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  reference!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  narration!: string | null;

  @Column({ name: 'posted_by_staff_id', type: 'uuid', nullable: true })
  postedByStaffId!: string | null;

  @Column({ name: 'posted_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  postedAt!: Date;
}
