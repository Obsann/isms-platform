import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Schema v1 (Task 2): `tenants`, `members`, `staff_accounts`, `roles_permissions`,
 * `accounts`, plus an RLS policy on every table.
 *
 * Requires Postgres 13+ for the built-in `gen_random_uuid()`.
 *
 * Written by hand rather than generated, because `migration:generate` needs a live
 * database to diff against and RLS policies aren't part of TypeORM's model at all —
 * it would emit the tables and silently drop the policies.
 *
 * Two things about RLS that decide whether any of this actually holds:
 *
 * 1. `FORCE ROW LEVEL SECURITY` is set so policies apply to the table owner too.
 *    Without it, connecting as the role that owns the tables bypasses RLS entirely and
 *    every isolation test passes for the wrong reason. Superusers bypass regardless, so
 *    the API must not connect as one — see the Task 3 note in backend/README.md.
 * 2. `app_current_tenant_id()` reads the `app.tenant_id` session variable that the
 *    tenant-context guard sets per request (Task 3). Unset means NULL, which matches no
 *    row, so an unscoped connection sees nothing rather than everything.
 */
export class InitialSchema1785801600000 implements MigrationInterface {
  name = 'InitialSchema1785801600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(160) NOT NULL,
        "code" varchar(64) NOT NULL,
        "status" varchar(32) NOT NULL DEFAULT 'provisioning',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chk_tenants_status"
          CHECK ("status" IN ('provisioning', 'active', 'suspended'))
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_tenants_code" ON "tenants" ("code")`);

    await queryRunner.query(`
      CREATE TABLE "members" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "member_number" varchar(32) NOT NULL,
        "first_name" varchar(80) NOT NULL,
        "middle_name" varchar(80),
        "last_name" varchar(80) NOT NULL,
        "national_id" varchar(32),
        "national_id_verified" boolean NOT NULL DEFAULT false,
        "national_id_verified_at" timestamptz,
        "phone" varchar(20),
        "email" varchar(180),
        "date_of_birth" date,
        "status" varchar(32) NOT NULL DEFAULT 'pending',
        "joined_at" date,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_members_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants" ("id") ON DELETE RESTRICT,
        CONSTRAINT "chk_members_status"
          CHECK ("status" IN ('pending', 'active', 'inactive'))
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_members_tenant_id" ON "members" ("tenant_id")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_members_tenant_member_number" ON "members" ("tenant_id", "member_number")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_members_tenant_national_id" ON "members" ("tenant_id", "national_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_members_tenant_id_id" ON "members" ("tenant_id", "id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "staff_accounts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid,
        "email" varchar(180) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "full_name" varchar(160) NOT NULL,
        "role" varchar(64) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "last_login_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_staff_accounts_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_staff_accounts_tenant_id" ON "staff_accounts" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_staff_accounts_tenant_email" ON "staff_accounts" ("tenant_id", "email")`,
    );
    // Postgres treats NULLs as distinct, so the index above doesn't constrain
    // platform-level staff. This partial index does.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_staff_accounts_platform_email" ON "staff_accounts" ("email") WHERE "tenant_id" IS NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE "roles_permissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid,
        "role" varchar(64) NOT NULL,
        "permission" varchar(120) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_roles_permissions_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_roles_permissions_tenant_id" ON "roles_permissions" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_roles_permissions_scope" ON "roles_permissions" ("tenant_id", "role", "permission")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_roles_permissions_platform_scope" ON "roles_permissions" ("role", "permission") WHERE "tenant_id" IS NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE "accounts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "member_id" uuid NOT NULL,
        "account_number" varchar(32) NOT NULL,
        "type" varchar(16) NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'active',
        "balance" numeric(18,2) NOT NULL DEFAULT 0,
        "held_amount" numeric(18,2) NOT NULL DEFAULT 0,
        "currency" char(3) NOT NULL DEFAULT 'ETB',
        "opened_at" date,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_accounts_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_accounts_member" FOREIGN KEY ("tenant_id", "member_id")
          REFERENCES "members" ("tenant_id", "id") ON DELETE RESTRICT,
        CONSTRAINT "chk_accounts_type" CHECK ("type" IN ('savings', 'share')),
        CONSTRAINT "chk_accounts_status" CHECK ("status" IN ('active', 'dormant', 'closed')),
        CONSTRAINT "chk_accounts_balance_non_negative" CHECK ("balance" >= 0),
        CONSTRAINT "chk_accounts_held_within_balance"
          CHECK ("held_amount" >= 0 AND "held_amount" <= "balance")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_accounts_tenant_id" ON "accounts" ("tenant_id")`);
    await queryRunner.query(
      `CREATE INDEX "idx_accounts_tenant_member" ON "accounts" ("tenant_id", "member_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_accounts_tenant_account_number" ON "accounts" ("tenant_id", "account_number")`,
    );

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_current_tenant_id() RETURNS uuid
        LANGUAGE sql
        STABLE
      AS $fn$
        SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid
      $fn$
    `);

    // tenants is platform-global: its own id is the scope key. Listing every tenant
    // (Super Admin console, Task 19) needs a role that bypasses RLS.
    await queryRunner.query(`ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "tenants" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY "tenants_tenant_isolation" ON "tenants"
        USING ("id" = app_current_tenant_id() OR app_current_tenant_id() IS NULL)
        WITH CHECK ("id" = app_current_tenant_id() OR app_current_tenant_id() IS NULL)
    `);

    for (const table of ['members', 'staff_accounts', 'roles_permissions', 'accounts']) {
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      await queryRunner.query(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);
      await queryRunner.query(`
        CREATE POLICY "${table}_tenant_isolation" ON "${table}"
          USING ("tenant_id" = app_current_tenant_id())
          WITH CHECK ("tenant_id" = app_current_tenant_id())
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['accounts', 'roles_permissions', 'staff_accounts', 'members']) {
      await queryRunner.query(`DROP POLICY IF EXISTS "${table}_tenant_isolation" ON "${table}"`);
    }
    await queryRunner.query(`DROP POLICY IF EXISTS "tenants_tenant_isolation" ON "tenants"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS app_current_tenant_id()`);

    await queryRunner.query(`DROP TABLE IF EXISTS "accounts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "staff_accounts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenants"`);
  }
}
