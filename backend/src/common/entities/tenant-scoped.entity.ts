import { Column } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Base for every tenant-scoped table. Extending this is what guarantees the
 * `tenant_id` column exists; row visibility is then enforced by the RLS policy on
 * the table, never by a hand-written `WHERE tenant_id = ?` in a query.
 *
 * Concrete entities must also declare the index explicitly, e.g.
 * `@Index('idx_members_tenant_id', ['tenantId'])`. It can't live here: Postgres index
 * names are unique per schema, so one name in a shared base class would collide
 * across tables.
 */
export abstract class TenantScopedEntity extends BaseEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;
}
