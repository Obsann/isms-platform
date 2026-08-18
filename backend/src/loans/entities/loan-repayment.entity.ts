import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from '../../common/entities/tenant-scoped.entity';

/**
 * Task 16 (Abenezer): records each repayment event against a loan.
 *
 * `tenant_id` is denormalised here so the RLS policy works the same as on every
 * other tenant-scoped table — a query against repayments for a loan from another
 * tenant returns zero rows before the join even resolves.
 *
 * The actual money movement is posted through the ledger service; this row is the
 * audit trail of *what was repaid* (amount, reference, timestamp).
 */
@Entity('loan_repayments')
@Index('idx_loan_repayments_tenant_id', ['tenantId'])
@Index('idx_loan_repayments_loan_id', ['loanId'])
export class LoanRepaymentEntity extends TenantScopedEntity {
  @Column({ name: 'loan_id', type: 'uuid' })
  loanId!: string;

  /** `numeric` returns as a decimal string — same as `Amount` in `src/types`. */
  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount!: string;

  /** Teller-supplied reference; also the idempotency anchor for offline sync (Task 15). */
  @Column({ type: 'varchar', length: 120, nullable: true })
  reference!: string | null;

  @Column({ name: 'paid_at', type: 'timestamptz', default: () => 'now()' })
  paidAt!: Date;
}
