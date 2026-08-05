import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import type { TenantStatus } from './tenant.entity';

export interface ResolvedTenant {
  id: string;
  status: TenantStatus;
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
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

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
}
