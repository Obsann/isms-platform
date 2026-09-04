import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from '../common/entities/tenant-scoped.entity';

export type ChapaPaymentStatus = 'pending' | 'paid' | 'failed';
export type ChapaPaymentKind = 'deposit' | 'withdrawal';
export type ChapaPayoutChannel = 'telebirr' | 'mpesa';

@Entity('chapa_payments')
@Index('idx_chapa_payments_tenant_id', ['tenantId'])
@Index('idx_chapa_payments_tenant_member', ['tenantId', 'memberId'])
@Index('idx_chapa_payments_tenant_kind', ['tenantId', 'kind'])
@Index('uq_chapa_payments_tx_ref', ['txRef'], { unique: true })
export class ChapaPaymentEntity extends TenantScopedEntity {
  @Column({ name: 'member_id', type: 'uuid' })
  memberId!: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ name: 'tx_ref', type: 'varchar', length: 128 })
  txRef!: string;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount!: string;

  @Column({ type: 'char', length: 3, default: 'ETB' })
  currency!: string;

  @Column({ type: 'varchar', length: 16, default: 'deposit' })
  kind!: ChapaPaymentKind;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status!: ChapaPaymentStatus;

  @Column({ name: 'payout_channel', type: 'varchar', length: 16, nullable: true })
  payoutChannel!: ChapaPayoutChannel | null;

  @Column({ name: 'bank_code', type: 'varchar', length: 16, nullable: true })
  bankCode!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  email!: string | null;

  @Column({ name: 'checkout_url', type: 'text', nullable: true })
  checkoutUrl!: string | null;

  /** Chapa's own `reference` id, not our `tx_ref`. */
  @Column({ name: 'chapa_reference', type: 'varchar', length: 128, nullable: true })
  chapaReference!: string | null;

  /**
   * Set only in mock mode after the member confirms the mock checkout.
   * Live payments ignore this flag and require Chapa verify.
   */
  @Column({ name: 'mock_confirmed', type: 'boolean', default: false })
  mockConfirmed!: boolean;

  @Column({ name: 'ledger_transaction_id', type: 'uuid', nullable: true })
  ledgerTransactionId!: string | null;

  /** Savings hold that reserves the withdrawal until Chapa transfer verify. */
  @Column({ name: 'hold_id', type: 'uuid', nullable: true })
  holdId!: string | null;
}
