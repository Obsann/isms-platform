import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from '../../common/entities/tenant-scoped.entity';

export type GuarantorPledgeStatus = 'active' | 'released';

/**
 * Task 17 (Abenezer): persists one guarantor pledge recorded against a loan application.
 * Holds placed on the guarantor's savings account via `LedgerService.holdFunds()`.
 */
@Entity('loan_guarantors')
@Index('idx_loan_guarantors_tenant_id', ['tenantId'])
@Index('idx_loan_guarantors_tenant_loan', ['tenantId', 'loanId'])
@Index('idx_loan_guarantors_tenant_guarantor', ['tenantId', 'guarantorMemberId'])
export class LoanGuarantorEntity extends TenantScopedEntity {
  /** References `loans(id)` */
  @Column({ name: 'loan_id', type: 'uuid' })
  loanId!: string;

  /** References `members(id)` — the member acting as guarantor */
  @Column({ name: 'guarantor_member_id', type: 'uuid' })
  guarantorMemberId!: string;

  /** References `accounts(id)` — the guarantor's savings account */
  @Column({ name: 'pledged_account_id', type: 'uuid' })
  pledgedAccountId!: string;

  /** Pledged amount in minor currency units / decimal string */
  @Column({ name: 'pledged_amount', type: 'numeric', precision: 18, scale: 2 })
  pledgedAmount!: string;

  /** References `funds_holds(id)` returned by LedgerService */
  @Column({ name: 'hold_id', type: 'uuid' })
  holdId!: string;

  @Column({ type: 'varchar', length: 32, default: 'active' })
  status!: GuarantorPledgeStatus;
}
