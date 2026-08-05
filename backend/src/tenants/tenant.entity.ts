import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import type { TenantStatus } from '../types';

// Canonical definition lives in `src/types` (Task 5) so the CHECK constraint, the
// entity, and the API contract can't drift apart. Re-exported for existing importers.
export type { TenantStatus };

/**
 * The one platform-global table: a tenant is a SACCO. Its `id` *is* the tenant scope,
 * so it has no `tenant_id` of its own, and cross-tenant reads here (the Super Admin
 * console, Task 19) run outside per-tenant RLS.
 */
@Entity('tenants')
@Index('uq_tenants_code', ['code'], { unique: true })
export class TenantEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 160 })
  name!: string;

  /** Stable short identifier, submitted at login to resolve tenant context. */
  @Column({ type: 'varchar', length: 64 })
  code!: string;

  @Column({ type: 'varchar', length: 32, default: 'provisioning' })
  status!: TenantStatus;
}
