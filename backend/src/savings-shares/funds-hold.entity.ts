import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from '../common/entities/tenant-scoped.entity';

@Entity('funds_holds')
@Index('idx_funds_holds_tenant_id', ['tenantId'])
@Index('idx_funds_holds_tenant_account', ['tenantId', 'accountId'])
export class FundsHoldEntity extends TenantScopedEntity {
  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount!: string;

  @Column({ type: 'varchar', length: 255 })
  reason!: string;

  @Column({ name: 'released_at', type: 'timestamptz', nullable: true })
  releasedAt!: Date | null;
}
