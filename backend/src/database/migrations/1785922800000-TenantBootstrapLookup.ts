import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fixes a bootstrap deadlock left open by schema v1 (Task 2): `tenants` has
 * `FORCE ROW LEVEL SECURITY` with policy `"id" = app_current_tenant_id()`, but
 * `app.tenant_id` isn't set until *after* a tenant is resolved from the `tenantCode`
 * submitted at login. There is no session state that lets a fresh connection read
 * the one row it needs to bootstrap itself — the tenant-isolation policy blocks the
 * very lookup that would establish tenant context in the first place.
 *
 * Fix: a narrow `SECURITY DEFINER` function, owned by the migration role (`postgres`,
 * which created it), that runs with the *owner's* privileges rather than the caller's
 * — bypassing RLS only for this one lookup, returning only `id` and `status` (never
 * `name` or any other column) for a given `code`. This is deliberately not a general
 * RLS exemption on `tenants`: `isms_app` gets EXECUTE on this one function, nothing
 * more, so every other read of `tenants` stays exactly as scoped as Task 2 left it.
 */
export class TenantBootstrapLookup1785922800000 implements MigrationInterface {
  name = 'TenantBootstrapLookup1785922800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE FUNCTION resolve_tenant_by_code(p_code varchar)
        RETURNS TABLE("id" uuid, "status" varchar)
        LANGUAGE sql
        STABLE
        SECURITY DEFINER
        SET search_path = public
      AS $fn$
        SELECT "id", "status" FROM "tenants" WHERE "code" = p_code
      $fn$
    `);

    // Ownership determines whose privileges SECURITY DEFINER runs with. Local
    // docker connects as `postgres`. Render's owner is not that role and cannot
    // reassign ownership — keep the creating role in that case.
    await queryRunner.query(`
      DO $owner$
      BEGIN
        ALTER FUNCTION resolve_tenant_by_code(varchar) OWNER TO postgres;
      EXCEPTION
        WHEN undefined_object OR insufficient_privilege THEN
          NULL;
      END
      $owner$;
    `);

    // Only EXECUTE, and only on this one narrow function — not BYPASSRLS, not
    // SELECT on the table itself. `isms_app` may be missing on managed Postgres
    // that cannot CREATE ROLE; GRANT to the current (owner) role instead.
    await queryRunner.query(`REVOKE ALL ON FUNCTION resolve_tenant_by_code(varchar) FROM PUBLIC`);
    await queryRunner.query(`
      DO $grant$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'isms_app') THEN
          EXECUTE 'GRANT EXECUTE ON FUNCTION resolve_tenant_by_code(varchar) TO isms_app';
        ELSE
          GRANT EXECUTE ON FUNCTION resolve_tenant_by_code(varchar) TO CURRENT_USER;
        END IF;
      END
      $grant$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP FUNCTION IF EXISTS resolve_tenant_by_code(varchar)`);
  }
}
