import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Task 17 (Abenezer): `loan_guarantors` table for guarantor pledge recording and hold management.
 */
export class LoanGuarantorSchema1787100000000 implements MigrationInterface {
  name = 'LoanGuarantorSchema1787100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "loan_guarantors" (
        "id"                      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"               uuid          NOT NULL,
        "loan_id"                 uuid          NOT NULL,
        "guarantor_member_id"     uuid          NOT NULL,
        "pledged_account_id"      uuid          NOT NULL,
        "pledged_amount"          numeric(18,2) NOT NULL,
        "hold_id"                 uuid          NOT NULL,
        "status"                  varchar(32)   NOT NULL DEFAULT 'active',
        "created_at"              timestamptz   NOT NULL DEFAULT now(),
        "updated_at"              timestamptz   NOT NULL DEFAULT now(),
        CONSTRAINT "fk_loan_guarantors_tenant"
          FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_loan_guarantors_loan"
          FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_loan_guarantors_guarantor_member"
          FOREIGN KEY ("tenant_id","guarantor_member_id") REFERENCES "members"("tenant_id","id") ON DELETE RESTRICT,
        CONSTRAINT "fk_loan_guarantors_pledged_account"
          FOREIGN KEY ("pledged_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_loan_guarantors_hold"
          FOREIGN KEY ("hold_id") REFERENCES "funds_holds"("id") ON DELETE RESTRICT,
        CONSTRAINT "chk_loan_guarantors_status"
          CHECK ("status" IN ('active','released')),
        CONSTRAINT "chk_loan_guarantors_pledged_amount_positive"
          CHECK ("pledged_amount" > 0)
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_loan_guarantors_tenant_id" ON "loan_guarantors" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_loan_guarantors_tenant_loan" ON "loan_guarantors" ("tenant_id", "loan_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_loan_guarantors_tenant_guarantor" ON "loan_guarantors" ("tenant_id", "guarantor_member_id")`,
    );

    await queryRunner.query(`ALTER TABLE "loan_guarantors" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "loan_guarantors" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY "loan_guarantors_tenant_isolation" ON "loan_guarantors"
        USING ("tenant_id" = app_current_tenant_id())
        WITH CHECK ("tenant_id" = app_current_tenant_id())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "loan_guarantors"`);
  }
}
