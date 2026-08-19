import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from '../../common/entities/tenant-scoped.entity';

export type LoanStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'disbursed'
  | 'repaid'
  | 'defaulted';

/**
 * Task 16 (Abenezer): persists one loan application through its lifecycle.
 *
 * State machine:
 *   pending → approved | rejected  (decideApproval)
 *   approved → disbursed           (disburse)
 *   disbursed → repaid             (recordRepayment, once fully paid)
 *   disbursed → defaulted          (future task — admin action)
 *
 * `balance` and `held_amount` live on `accounts` and are written only by the
 * ledger service. This entity never stores a running balance.
 */
@Entity('loans')
@Index('idx_loans_tenant_id', ['tenantId'])
@Index('idx_loans_tenant_member', ['tenantId', 'memberId'])
@Index('idx_loans_status', ['tenantId', 'status'])
@Index('uq_loans_tenant_loan_number', ['tenantId', 'loanNumber'], { unique: true })
export class LoanEntity extends TenantScopedEntity {
  /** Human-facing reference — auto-generated on application (e.g. LN-2026-000001). */
  @Column({ name: 'loan_number', type: 'varchar', length: 32 })
  loanNumber!: string;

  /** References `members (tenant_id, id)` — composite FK enforced in migration. */
  @Column({ name: 'member_id', type: 'uuid' })
  memberId!: string;

  /** Amount the member asked for. `numeric` returns as a decimal string — same as `Amount` in `src/types`. */
  @Column({ name: 'requested_amount', type: 'numeric', precision: 18, scale: 2 })
  requestedAmount!: string;

  /** Set by `decideApproval`; may differ from `requestedAmount`. */
  @Column({ name: 'approved_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  approvedAmount!: string | null;

  /** Set by `disburse`; echoes the ledger posting amount for audit. */
  @Column({ name: 'disbursed_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  disbursedAmount!: string | null;

  @Column({ name: 'term_months', type: 'integer' })
  termMonths!: number;

  @Column({ type: 'text', nullable: true })
  purpose!: string | null;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status!: LoanStatus;

  /** Staff id of the loan officer who submitted the application. */
  @Column({ name: 'applied_by', type: 'uuid', nullable: true })
  appliedBy!: string | null;

  /** Staff id of the approver or rejector. */
  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy!: string | null;

  /** Free-text note from the approver, surfaced to the member. */
  @Column({ name: 'approval_note', type: 'text', nullable: true })
  approvalNote!: string | null;

  /** The `accounts.id` the disbursement was credited to. */
  @Column({ name: 'disbursed_to_account_id', type: 'uuid', nullable: true })
  disbursedToAccountId!: string | null;

  @Column({ name: 'applied_at', type: 'timestamptz', default: () => 'now()' })
  appliedAt!: Date;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt!: Date | null;

  @Column({ name: 'disbursed_at', type: 'timestamptz', nullable: true })
  disbursedAt!: Date | null;
}
