import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from '../common/entities/tenant-scoped.entity';

export type MemberStatus = 'pending' | 'active' | 'inactive';

/**
 * Schema v1 (Task 2) — deliberately the minimum a SACCO member needs. Task 8 adds
 * whatever registration turns out to require; Task 5's `Member` contract in
 * `src/types` is the API shape and is not the same thing as this row.
 */
@Entity('members')
@Index('idx_members_tenant_id', ['tenantId'])
@Index('uq_members_tenant_member_number', ['tenantId', 'memberNumber'], { unique: true })
@Index('idx_members_tenant_national_id', ['tenantId', 'nationalId'])
// Target of the composite FK from `accounts`, which is what keeps an account from
// referencing a member in another tenant.
@Index('uq_members_tenant_id_id', ['tenantId', 'id'], { unique: true })
export class MemberEntity extends TenantScopedEntity {
  /** Human-facing membership number, unique within the tenant. */
  @Column({ name: 'member_number', type: 'varchar', length: 32 })
  memberNumber!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 80 })
  firstName!: string;

  @Column({ name: 'middle_name', type: 'varchar', length: 80, nullable: true })
  middleName!: string | null;

  @Column({ name: 'last_name', type: 'varchar', length: 80 })
  lastName!: string;

  /** Fayda National ID. Verification itself is Task 9. */
  @Column({ name: 'national_id', type: 'varchar', length: 32, nullable: true })
  nationalId!: string | null;

  @Column({ name: 'national_id_verified', type: 'boolean', default: false })
  nationalIdVerified!: boolean;

  @Column({ name: 'national_id_verified_at', type: 'timestamptz', nullable: true })
  nationalIdVerifiedAt!: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  email!: string | null;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth!: string | null;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status!: MemberStatus;

  @Column({ name: 'joined_at', type: 'date', nullable: true })
  joinedAt!: string | null;
}
