import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Task 13: double-entry journal. Named CoA table is post-MVP (DECISIONS.md D2) —
 * `gl_code` is a hard-coded label on each line, not a foreign key.
 */
export class LedgerEntries1786400000000 implements MigrationInterface {
  name = 'LedgerEntries1786400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ledger_entries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "posting_id" uuid NOT NULL,
        "account_id" uuid,
        "gl_code" varchar(64) NOT NULL,
        "side" varchar(8) NOT NULL,
        "amount" numeric(18,2) NOT NULL,
        "currency" char(3) NOT NULL DEFAULT 'ETB',
        "type" varchar(32) NOT NULL,
        "reference" varchar(128),
        "narration" varchar(255),
        "posted_by_staff_id" uuid,
        "posted_at" timestamptz NOT NULL DEFAULT now(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_ledger_entries_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_ledger_entries_account" FOREIGN KEY ("account_id")
          REFERENCES "accounts" ("id") ON DELETE RESTRICT,
        CONSTRAINT "chk_ledger_entries_side" CHECK ("side" IN ('debit', 'credit')),
        CONSTRAINT "chk_ledger_entries_amount_positive" CHECK ("amount" > 0),
        CONSTRAINT "chk_ledger_entries_type" CHECK ("type" IN (
          'deposit', 'withdrawal', 'transfer', 'fee',
          'share-purchase', 'loan-disbursement', 'loan-repayment'
        )),
        CONSTRAINT "chk_ledger_entries_gl_code" CHECK ("gl_code" IN (
          'CASH', 'MEMBER_SAVINGS', 'SHARE_CAPITAL', 'LOANS_RECEIVABLE'
        ))
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_ledger_entries_tenant_id" ON "ledger_entries" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ledger_entries_tenant_posting" ON "ledger_entries" ("tenant_id", "posting_id")`,
    );

    await queryRunner.query(`ALTER TABLE "ledger_entries" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "ledger_entries" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY "ledger_entries_tenant_isolation" ON "ledger_entries"
        USING ("tenant_id" = app_current_tenant_id())
        WITH CHECK ("tenant_id" = app_current_tenant_id())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS "ledger_entries_tenant_isolation" ON "ledger_entries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ledger_entries"`);
  }
}
