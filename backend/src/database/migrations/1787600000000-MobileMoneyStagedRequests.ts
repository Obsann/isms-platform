import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Task 24/26: staged mobile-money C2B/B2C payloads for the member portal mock UI.
 * Rows stay PENDING — they never post to the ledger or call a live gateway.
 */
export class MobileMoneyStagedRequests1787600000000 implements MigrationInterface {
  name = 'MobileMoneyStagedRequests1787600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "mobile_money_staged_requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "member_id" uuid NOT NULL,
        "direction" varchar(8) NOT NULL,
        "provider" varchar(16) NOT NULL,
        "provider_reference" varchar(64) NOT NULL,
        "account_number" varchar(32),
        "loan_id" varchar(64),
        "msisdn" varchar(20) NOT NULL,
        "amount" numeric(18, 2) NOT NULL,
        "currency" char(3) NOT NULL DEFAULT 'ETB',
        "status" varchar(16) NOT NULL DEFAULT 'PENDING',
        "failure_reason" varchar(255),
        "occurred_at" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chk_momo_staged_direction" CHECK ("direction" IN ('c2b', 'b2c')),
        CONSTRAINT "chk_momo_staged_status" CHECK ("status" = 'PENDING'),
        CONSTRAINT "fk_momo_staged_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_momo_staged_member" FOREIGN KEY ("tenant_id", "member_id")
          REFERENCES "members" ("tenant_id", "id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_momo_staged_tenant_id" ON "mobile_money_staged_requests" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_momo_staged_tenant_member" ON "mobile_money_staged_requests" ("tenant_id", "member_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_momo_staged_tenant_provider_ref" ON "mobile_money_staged_requests" ("tenant_id", "provider_reference")`,
    );

    await queryRunner.query(`ALTER TABLE "mobile_money_staged_requests" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "mobile_money_staged_requests" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY "momo_staged_tenant_isolation" ON "mobile_money_staged_requests"
        USING ("tenant_id" = app_current_tenant_id())
        WITH CHECK ("tenant_id" = app_current_tenant_id())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP POLICY IF EXISTS "momo_staged_tenant_isolation" ON "mobile_money_staged_requests"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "mobile_money_staged_requests"`);
  }
}
