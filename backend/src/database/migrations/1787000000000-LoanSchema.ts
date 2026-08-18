import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Task 16 (Abenezer): `loans` and `loan_repayments` tables.
 *
 * Written by hand — TypeORM's generator can't emit RLS policies, and including
 * them here instead of a separate step keeps the schema consistent with Task 2's
 * approach (one migration per vertical, policy inline).
 *
 * Status is a varchar + CHECK, not a Postgres enum. Adding a new status later
 * is one migration (ALTER TABLE … ADD CONSTRAINT) instead of an ALTER TYPE dance.
 *
 * `loan_repayments.tenant_id` denormalises the tenant scope onto every repayment
 * row so the RLS policy works the same way as on every other table — a query
 * against repayments for a loan from another tenant produces zero rows, not an
 * error, before the join even resolves.
 *
 * Balances move only through the ledger service's posting function (Task 13).
 * Neither table stores a running balance — that lives on `accounts`.
 */
export class LoanSchema1787000000000 implements MigrationInterface {
  name = 'LoanSchema1787000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ------------------------------------------------------------------ loans
    await queryRunner.query(`
      CREATE TABLE "loans" (
        "id"                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"               uuid        NOT NULL,
        "member_id"               uuid        NOT NULL,
        "loan_number"             varchar(32) NOT NULL,
        "requested_amount"        numeric(18,2) NOT NULL,
        "approved_amount"         numeric(18,2),
        "disbursed_amount"        numeric(18,2),
        "term_months"             integer     NOT NULL,
        "purpose"                 text,
        "status"                  varchar(32) NOT NULL DEFAULT 'pending',
        "applied_by"              uuid,
        "approved_by"             uuid,
        "approval_note"           text,
        "disbursed_to_account_id" uuid,
        "applied_at"              timestamptz NOT NULL DEFAULT now(),
        "approved_at"             timestamptz,
        "disbursed_at"            timestamptz,
        "created_at"              timestamptz NOT NULL DEFAULT now(),
        "updated_at"              timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_loans_tenant"
          FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_loans_member"
          FOREIGN KEY ("tenant_id","member_id") REFERENCES "members"("tenant_id","id") ON DELETE RESTRICT,
        CONSTRAINT "chk_loans_status"
          CHECK ("status" IN ('pending','approved','rejected','disbursed','repaid','defaulted')),
        CONSTRAINT "chk_loans_requested_amount_positive"
          CHECK ("requested_amount" > 0),
        CONSTRAINT "chk_loans_term_months_positive"
          CHECK ("term_months" > 0)
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_loans_tenant_id" ON "loans" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_loans_tenant_member" ON "loans" ("tenant_id","member_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_loans_status" ON "loans" ("tenant_id","status")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_loans_tenant_loan_number" ON "loans" ("tenant_id","loan_number")`,
    );

    await queryRunner.query(`ALTER TABLE "loans" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "loans" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY "loans_tenant_isolation" ON "loans"
        USING ("tenant_id" = app_current_tenant_id())
        WITH CHECK ("tenant_id" = app_current_tenant_id())
    `);

    // -------------------------------------------------------- loan_repayments
    await queryRunner.query(`
      CREATE TABLE "loan_repayments" (
        "id"          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"   uuid          NOT NULL,
        "loan_id"     uuid          NOT NULL,
        "amount"      numeric(18,2) NOT NULL,
        "reference"   varchar(120),
        "paid_at"     timestamptz   NOT NULL DEFAULT now(),
        "created_at"  timestamptz   NOT NULL DEFAULT now(),
        "updated_at"  timestamptz   NOT NULL DEFAULT now(),
        CONSTRAINT "fk_loan_repayments_tenant"
          FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_loan_repayments_loan"
          FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE RESTRICT,
        CONSTRAINT "chk_loan_repayments_amount_positive"
          CHECK ("amount" > 0)
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_loan_repayments_tenant_id" ON "loan_repayments" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_loan_repayments_loan_id" ON "loan_repayments" ("loan_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "loan_repayments" ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan_repayments" FORCE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(`
      CREATE POLICY "loan_repayments_tenant_isolation" ON "loan_repayments"
        USING ("tenant_id" = app_current_tenant_id())
        WITH CHECK ("tenant_id" = app_current_tenant_id())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP POLICY IF EXISTS "loan_repayments_tenant_isolation" ON "loan_repayments"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "loan_repayments"`);

    await queryRunner.query(
      `DROP POLICY IF EXISTS "loans_tenant_isolation" ON "loans"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "loans"`);
  }
}
