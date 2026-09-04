import { ConflictException, Injectable, Optional } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import { TenantContextService } from '../common';
import type { TenantStatus } from './tenant.entity';
import { TenantEntity } from './tenant.entity';

export interface ResolvedTenant {
  id: string;
  status: TenantStatus;
}

export interface TenantListItem {
  id: string;
  name: string;
  code: string;
  status: TenantStatus;
  createdAt: string;
}

/**
 * `tenants` carries `FORCE ROW LEVEL SECURITY` with policy `id = app_current_tenant_id()`
 * — but resolving a `tenantCode` to an `id` has to happen *before* any tenant context
 * exists, which is exactly what that policy would otherwise block forever. This calls
 * the `resolve_tenant_by_code` SQL function (migration `TenantBootstrapLookup`), a
 * narrow `SECURITY DEFINER` function that returns only `id` and `status` for a given
 * code, bypassing RLS for this one safe lookup without weakening the general policy
 * or granting the app role `BYPASSRLS`.
 */
@Injectable()
export class TenantsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Optional() private readonly tenantContext?: TenantContextService,
  ) {}

  /**
   * Use the request query runner when one is open so RLS sees `app.tenant_id`
   * and we do not borrow a second pool client mid-transaction (pg deprecation).
   */
  private repo() {
    if (this.tenantContext?.peekStore()) {
      return this.tenantContext.repo(TenantEntity);
    }
    return this.dataSource.getRepository(TenantEntity);
  }

  async resolveActiveByCode(code: string): Promise<ResolvedTenant | null> {
    const rows = await this.dataSource.query<ResolvedTenant[]>(
      `SELECT * FROM resolve_tenant_by_code($1)`,
      [code],
    );
    const tenant = rows[0];
    if (!tenant || tenant.status !== 'active') {
      return null;
    }
    return tenant;
  }

  async list(statusFilter?: TenantStatus): Promise<TenantListItem[]> {
    const repo = this.repo();
    const where: any = {};
    if (statusFilter) {
      where.status = statusFilter;
    }
    const rows = await repo.find({ where, order: { createdAt: 'DESC' } });
    return rows.map((r) => ({ id: r.id, name: r.name, code: r.code, status: r.status, createdAt: r.createdAt.toISOString() }));
  }

  async create(payload: { name: string; code: string; status?: TenantStatus }): Promise<TenantListItem> {
    const repo = this.repo();
    const code = payload.code.trim().toLowerCase();
    const name = payload.name.trim();

    const existing = await repo.findOneBy({ code });
    if (existing) {
      throw new ConflictException(`Tenant code '${code}' is already in use`);
    }

    try {
      const entity = repo.create({ name, code, status: payload.status ?? 'active' });
      const saved = await repo.save(entity);
      return { id: saved.id, name: saved.name, code: saved.code, status: saved.status, createdAt: saved.createdAt.toISOString() };
    } catch (error: any) {
      if (error?.code === '23505' || error?.message?.includes('uq_tenants_code')) {
        throw new ConflictException(`Tenant code '${code}' is already in use`);
      }
      throw error;
    }
  }

  async provision(payload: { name: string; code: string; status?: TenantStatus }): Promise<TenantListItem> {
    return this.create(payload);
  }

  async get(id: string): Promise<TenantListItem | null> {
    const repo = this.repo();
    const r = await repo.findOneBy({ id });
    if (!r) return null;
    return { id: r.id, name: r.name, code: r.code, status: r.status, createdAt: r.createdAt.toISOString() };
  }

  async update(id: string, patch: { name?: string; status?: TenantStatus }): Promise<TenantListItem | null> {
    const repo = this.repo();
    const r = await repo.findOneBy({ id });
    if (!r) return null;
    if (patch.name !== undefined) r.name = patch.name;
    if (patch.status !== undefined) r.status = patch.status;
    const saved = await repo.save(r);
    return { id: saved.id, name: saved.name, code: saved.code, status: saved.status, createdAt: saved.createdAt.toISOString() };
  }

  async remove(id: string): Promise<void> {
    const repo = this.repo();
    await repo.delete({ id });
  }
}
