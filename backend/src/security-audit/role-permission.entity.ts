import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';

/**
 * One row per (role, permission) pair — the data behind the `@Roles(...)` guard built
 * in Task 22 against the RBAC matrix.
 *
 * `tenant_id` is nullable: NULL is a platform-wide default available to every tenant,
 * a value is a tenant-specific override.
 */
@Entity('roles_permissions')
@Index('idx_roles_permissions_tenant_id', ['tenantId'])
@Index('uq_roles_permissions_scope', ['tenantId', 'role', 'permission'], { unique: true })
export class RolePermissionEntity extends BaseEntity {
  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId!: string | null;

  @Column({ type: 'varchar', length: 64 })
  role!: string;

  /** Dotted `subject.action`, e.g. `member.create`, `loan.approve`. */
  @Column({ type: 'varchar', length: 120 })
  permission!: string;
}
