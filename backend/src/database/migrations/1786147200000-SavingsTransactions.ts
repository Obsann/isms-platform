import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Task 12: Adds `savings_transactions` and `funds_holds` tables with Postgres RLS policies.
 */
export class SavingsTransactions1786147200000 implements MigrationInterface {
  name = 'SavingsTransactions1786147200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "savings_transactions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "account_id" uuid NOT NULL,
        "type" varchar(32) NOT NULL,
        "amount" numeric(18,2) NOT NULL,
        "balance_after" numeric(18,2) NOT NULL,
        "currency" char(3) NOT NULL DEFAULT 'ETB',
        "reference" varchar(128),
        "narration" varchar(255),
        "posted_by_staff_id" uuid,
        "posted_at" timestamptz NOT NULL DEFAULT now(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_savings_transactions_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_savings_transactions_account" FOREIGN KEY ("account_id")
          REFERENCES "accounts" ("id") ON DELETE RESTRICT,
        CONSTRAINT "chk_savings_transactions_type"
          CHECK ("type" IN ('deposit', 'withdrawal', 'transfer', 'fee', 'share-purchase', 'loan-disbursement', 'loan-repayment')),
        CONSTRAINT "chk_savings_transactions_amount_positive"
          CHECK ("amount" > 0)
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_savings_transactions_tenant_id" ON "savings_transactions" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_savings_transactions_tenant_account" ON "savings_transactions" ("tenant_id", "account_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "funds_holds" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "account_id" uuid NOT NULL,
        "amount" numeric(18,2) NOT NULL,
        "reason" varchar(255) NOT NULL,
        "released_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_funds_holds_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_funds_holds_account" FOREIGN KEY ("account_id")
          REFERENCES "accounts" ("id") ON DELETE RESTRICT,
        CONSTRAINT "chk_funds_holds_amount_positive"
          CHECK ("amount" > 0)
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_funds_holds_tenant_id" ON "funds_holds" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_funds_holds_tenant_account" ON "funds_holds" ("tenant_id", "account_id")`,
    );

    for (const table of ['savings_transactions', 'funds_holds']) {
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
    for (const table of ['funds_holds', 'savings_transactions']) {
      await queryRunner.query(`DROP POLICY IF EXISTS "${table}_tenant_isolation" ON "${table}"`);
    }
    await queryRunner.query(`DROP TABLE IF EXISTS "funds_holds"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "savings_transactions"`);
  }
}
