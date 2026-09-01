import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Task 22: append-only `audit_logs`. Written by hand — TypeORM's generator
 * cannot emit RLS policies.
 *
 * `tenant_id` is nullable (platform super-admin). The policy uses
 * `IS NOT DISTINCT FROM` so NULL = NULL matches, which ordinary `=` does not.
 */
export class AuditLogs1787200000000 implements MigrationInterface {
  name = 'AuditLogs1787200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid,
        "actor_staff_id" uuid,
        "action" varchar(160) NOT NULL,
        "entity" varchar(64) NOT NULL,
        "entity_id" varchar(128) NOT NULL,
        "before" jsonb,
        "after" jsonb,
        "occurred_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_audit_logs_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_audit_logs_actor" FOREIGN KEY ("actor_staff_id")
          REFERENCES "staff_accounts" ("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_audit_logs_tenant_id" ON "audit_logs" ("tenant_id")`);
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_tenant_occurred" ON "audit_logs" ("tenant_id", "occurred_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_tenant_actor" ON "audit_logs" ("tenant_id", "actor_staff_id")`,
    );

    await queryRunner.query(`ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY "audit_logs_tenant_isolation" ON "audit_logs"
        USING ("tenant_id" IS NOT DISTINCT FROM app_current_tenant_id())
        WITH CHECK ("tenant_id" IS NOT DISTINCT FROM app_current_tenant_id())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS "audit_logs_tenant_isolation" ON "audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
  }
}
