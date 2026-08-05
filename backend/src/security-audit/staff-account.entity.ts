import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import type { RoleName } from '../types';

/**
 * A staff login. Doesn't extend `TenantScopedEntity` because `tenant_id` is nullable
 * here: NULL means platform-level (Super Admin) staff, who operate outside per-tenant
 * scoping. The column is still indexed, and RLS still applies.
 */
@Entity('staff_accounts')
@Index('idx_staff_accounts_tenant_id', ['tenantId'])
@Index('uq_staff_accounts_tenant_email', ['tenantId', 'email'], { unique: true })
export class StaffAccountEntity extends BaseEntity {
  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId!: string | null;

  @Column({ type: 'varchar', length: 180 })
  email!: string;

  /** Hash only. Task 3 chooses the algorithm; nothing ever stores a plaintext password. */
  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 160 })
  fullName!: string;

  /** Matches `role` in `roles_permissions` and the JWT `role` claim issued by Task 3. */
  @Column({ type: 'varchar', length: 64 })
  role!: RoleName;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;
}
