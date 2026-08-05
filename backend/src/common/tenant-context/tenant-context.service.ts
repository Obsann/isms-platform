import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource, EntityManager, EntityTarget, ObjectLiteral, QueryRunner, Repository } from 'typeorm';

export interface TenantContextStore {
  queryRunner?: QueryRunner;
  tenantId?: string | null;
}

interface OpenedTenantContextStore extends TenantContextStore {
  queryRunner: QueryRunner;
  tenantId: string | null;
}

/**
 * The one place that knows how to make Postgres RLS see a tenant. Connections come
 * from a shared pool, so a plain `SET app.tenant_id` on a borrowed connection would
 * leak into whichever unrelated request borrows that same connection next. Instead,
 * every tenant-scoped unit of work gets its own dedicated connection + transaction,
 * with `set_config(..., is_local => true)` — transactional, and reset automatically
 * on commit or rollback, so nothing can leak across requests even under load.
 *
 * Every RLS-scoped table access — in this task and every task after it — must go
 * through `repo(Entity)` or `getManager()` here, never a plain `@InjectRepository`.
 * An injected repository uses the untouched pool connection with no `app.tenant_id`
 * set: under `FORCE ROW LEVEL SECURITY` that silently returns zero rows, and if the
 * app ever connects as a superuser it silently returns *every* tenant's rows instead.
 * Neither failure mode raises an error, which is exactly why this is a hard rule.
 */
@Injectable()
export class TenantContextService {
  private readonly als = new AsyncLocalStorage<TenantContextStore>();

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Self-contained tenant-scoped unit of work: opens a transaction, sets tenant
   * context, runs `work`, then commits (or rolls back on error) and always releases.
   * Used for one-off scoped work outside the request/guard lifecycle — the login
   * flow's staff lookup, seed scripts, background jobs.
   */
  async runInTenantContext<T>(
    tenantId: string | null,
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.setSessionTenant(queryRunner, tenantId);
      const result = await this.als.run({ queryRunner, tenantId }, () => work(queryRunner.manager));
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Called once per request by `TenantContextMiddleware`, before routing even
   * starts, so the `AsyncLocalStorage` scope covers guards, interceptors, and the
   * handler as one continuous async chain. `AsyncLocalStorage.enterWith()` called
   * later, from inside a guard, does not reliably survive Nest's RxJS-based
   * guard/interceptor pipeline in practice — establishing the scope from middleware,
   * around the real `next()` call, is the pattern that actually holds.
   */
  runRequestScope<T>(work: () => T): T {
    return this.als.run({}, work);
  }

  /**
   * Fills in the context that `TenantContextMiddleware` already opened, once
   * `TenantContextGuard` knows the tenant from the verified JWT. Mutates the same
   * store object the middleware's `als.run()` is scoped to, rather than creating a
   * new one, which is what makes it visible further down the same request.
   * Commit/rollback/release is `TenantContextInterceptor`'s job — a `CanActivate`
   * guard runs before the handler and can't wrap what happens after it.
   */
  async attachForRequest(tenantId: string | null): Promise<QueryRunner> {
    const store = this.als.getStore();
    if (!store) {
      throw new Error(
        'TenantContextMiddleware did not run for this request. It must be applied ' +
          'globally in AppModule so it wraps every route, including this one.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    await this.setSessionTenant(queryRunner, tenantId);
    store.queryRunner = queryRunner;
    store.tenantId = tenantId;
    return queryRunner;
  }

  /** Non-throwing lookup, for the interceptor: public routes never attach a queryRunner. */
  peekStore(): OpenedTenantContextStore | undefined {
    const store = this.als.getStore();
    return store?.queryRunner ? (store as OpenedTenantContextStore) : undefined;
  }

  getManager(): EntityManager {
    return this.requireStore().queryRunner.manager;
  }

  getTenantId(): string | null {
    return this.requireStore().tenantId;
  }

  repo<Entity extends ObjectLiteral>(entity: EntityTarget<Entity>): Repository<Entity> {
    return this.getManager().getRepository(entity);
  }

  private requireStore(): OpenedTenantContextStore {
    const store = this.peekStore();
    if (!store) {
      throw new Error(
        'No tenant context is active. Wrap this call in TenantContextService.runInTenantContext(...), ' +
          'or call it only from a request that passed through TenantContextGuard.',
      );
    }
    return store;
  }

  private async setSessionTenant(queryRunner: QueryRunner, tenantId: string | null): Promise<void> {
    // set_config's third argument (is_local) makes this transaction-scoped, exactly
    // like `SET LOCAL` but parameterized — `SET LOCAL` itself can't take a bound
    // parameter, and string-interpolating a tenant id into SQL is a habit worth not
    // starting even though it's a UUID from a signed JWT.
    await queryRunner.query(`SELECT set_config('app.tenant_id', $1, true)`, [tenantId ?? '']);
  }
}
