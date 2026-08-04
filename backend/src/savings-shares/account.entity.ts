import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from '../common/entities/tenant-scoped.entity';

export type AccountType = 'savings' | 'share';
export type AccountStatus = 'active' | 'dormant' | 'closed';

@Entity('accounts')
@Index('idx_accounts_tenant_id', ['tenantId'])
@Index('idx_accounts_tenant_member', ['tenantId', 'memberId'])
@Index('uq_accounts_tenant_account_number', ['tenantId', 'accountNumber'], { unique: true })
export class AccountEntity extends TenantScopedEntity {
  /** Constrained by a composite FK to `members (tenant_id, id)` — an account can't
   * point at another tenant's member even if RLS were misconfigured. */
  @Column({ name: 'member_id', type: 'uuid' })
  memberId!: string;

  @Column({ name: 'account_number', type: 'varchar', length: 32 })
  accountNumber!: string;

  @Column({ type: 'varchar', length: 16 })
  type!: AccountType;

  @Column({ type: 'varchar', length: 16, default: 'active' })
  status!: AccountStatus;

  /**
   * Written only by the ledger service's posting function (Task 13) — never by a
   * repository call, a migration, or a seed script. `numeric` comes back from pg as a
   * decimal string, which is what `Amount` in `src/types` expects.
   */
  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  balance!: string;

  /** Pledged as loan collateral: part of `balance`, excluded from what's withdrawable. */
  @Column({ name: 'held_amount', type: 'numeric', precision: 18, scale: 2, default: 0 })
  heldAmount!: string;

  @Column({ type: 'char', length: 3, default: 'ETB' })
  currency!: string;

  @Column({ name: 'opened_at', type: 'date', nullable: true })
  openedAt!: string | null;
}
