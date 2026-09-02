import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from '../common/entities/tenant-scoped.entity';

export type MomoStagedDirection = 'c2b' | 'b2c';
export type MomoStagedProvider = 'telebirr' | 'mpesa' | 'cbe_birr';

@Entity('mobile_money_staged_requests')
@Index('idx_momo_staged_tenant_id', ['tenantId'])
@Index('idx_momo_staged_tenant_member', ['tenantId', 'memberId'])
@Index('uq_momo_staged_tenant_provider_ref', ['tenantId', 'providerReference'], { unique: true })
export class MobileMoneyStagedRequestEntity extends TenantScopedEntity {
  @Column({ name: 'member_id', type: 'uuid' })
  memberId!: string;

  @Column({ type: 'varchar', length: 8 })
  direction!: MomoStagedDirection;

  @Column({ type: 'varchar', length: 16 })
  provider!: MomoStagedProvider;

  @Column({ name: 'provider_reference', type: 'varchar', length: 64 })
  providerReference!: string;

  @Column({ name: 'account_number', type: 'varchar', length: 32, nullable: true })
  accountNumber!: string | null;

  @Column({ name: 'loan_id', type: 'varchar', length: 64, nullable: true })
  loanId!: string | null;

  @Column({ type: 'varchar', length: 20 })
  msisdn!: string;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount!: string;

  @Column({ type: 'char', length: 3, default: 'ETB' })
  currency!: string;

  @Column({ type: 'varchar', length: 16, default: 'PENDING' })
  status!: 'PENDING';

  @Column({ name: 'failure_reason', type: 'varchar', length: 255, nullable: true })
  failureReason!: string | null;

  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt!: Date;
}
