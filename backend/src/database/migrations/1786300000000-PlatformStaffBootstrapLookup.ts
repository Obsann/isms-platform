import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Same bootstrap deadlock as `resolve_tenant_by_code`, but for platform staff:
 * `staff_accounts` is fail-closed under RLS (`tenant_id = app_current_tenant_id()`),
 * and platform super-admins have `tenant_id IS NULL`, so they are invisible to every
 * tenant-scoped session — including the login lookup that would have to see them
 * before any JWT exists.
 *
 * Narrow `SECURITY DEFINER` function, owned by `postgres`: returns credential
 * columns for one active platform staff row by email. `isms_app` gets EXECUTE on
 * this function only — not BYPASSRLS, not SELECT on `staff_accounts`.
 */
export class PlatformStaffBootstrapLookup1786300000000 implements MigrationInterface {
  name = 'PlatformStaffBootstrapLookup1786300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE FUNCTION resolve_platform_staff_by_email(p_email varchar)
        RETURNS TABLE(
          "id" uuid,
          "email" varchar,
          "password_hash" varchar,
          "full_name" varchar,
          "role" varchar,
          "is_active" boolean
        )
        LANGUAGE sql
        STABLE
        SECURITY DEFINER
        SET search_path = public
      AS $fn$
        SELECT "id", "email", "password_hash", "full_name", "role", "is_active"
        FROM "staff_accounts"
        WHERE "tenant_id" IS NULL
          AND "email" = p_email
          AND "is_active" = true
      $fn$
    `);

    await queryRunner.query(
      `ALTER FUNCTION resolve_platform_staff_by_email(varchar) OWNER TO postgres`,
    );
    await queryRunner.query(
      `REVOKE ALL ON FUNCTION resolve_platform_staff_by_email(varchar) FROM PUBLIC`,
    );
    await queryRunner.query(
      `GRANT EXECUTE ON FUNCTION resolve_platform_staff_by_email(varchar) TO isms_app`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP FUNCTION IF EXISTS resolve_platform_staff_by_email(varchar)`);
  }
}
