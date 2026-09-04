import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Opt-in Chapa C2B deposits for member savings. Tenant-scoped with RLS.
 * Balances still move only through the ledger posting function.
 */
export class ChapaPayments1787500000000 implements MigrationInterface {
  name = 'ChapaPayments1787500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "chapa_payments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "member_id" uuid NOT NULL,
        "account_id" uuid NOT NULL,
        "tx_ref" varchar(128) NOT NULL,
        "amount" numeric(18,2) NOT NULL,
        "currency" char(3) NOT NULL DEFAULT 'ETB',
        "status" varchar(16) NOT NULL DEFAULT 'pending',
        "phone" varchar(20),
        "email" varchar(180),
        "checkout_url" text,
        "chapa_reference" varchar(128),
        "mock_confirmed" boolean NOT NULL DEFAULT false,
        "ledger_transaction_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_chapa_payments_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_chapa_payments_member" FOREIGN KEY ("tenant_id", "member_id")
          REFERENCES "members" ("tenant_id", "id") ON DELETE RESTRICT,
        CONSTRAINT "fk_chapa_payments_account" FOREIGN KEY ("account_id")
          REFERENCES "accounts" ("id") ON DELETE RESTRICT,
        CONSTRAINT "chk_chapa_payments_status"
          CHECK ("status" IN ('pending', 'paid', 'failed')),
        CONSTRAINT "chk_chapa_payments_amount_positive"
          CHECK ("amount" > 0)
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_chapa_payments_tenant_id" ON "chapa_payments" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_chapa_payments_tenant_member" ON "chapa_payments" ("tenant_id", "member_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_chapa_payments_tx_ref" ON "chapa_payments" ("tx_ref")`,
    );

    await queryRunner.query(`ALTER TABLE "chapa_payments" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "chapa_payments" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY "chapa_payments_tenant_isolation" ON "chapa_payments"
        USING ("tenant_id" = app_current_tenant_id())
        WITH CHECK ("tenant_id" = app_current_tenant_id())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS "chapa_payments_tenant_isolation" ON "chapa_payments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chapa_payments"`);
  }
}
