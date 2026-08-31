import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Task 15 — anchor teller `reference` as an idempotency key per tenant.
 * Offline replay with the same reference + payload returns the original row;
 * the same reference with a different payload is rejected as SyncConflict.
 */
export class TransactionReferenceIdempotency1787400000000 implements MigrationInterface {
  name = 'TransactionReferenceIdempotency1787400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_savings_transactions_tenant_reference"
        ON "savings_transactions" ("tenant_id", "reference")
        WHERE "reference" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_loan_repayments_tenant_reference"
        ON "loan_repayments" ("tenant_id", "reference")
        WHERE "reference" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_loan_repayments_tenant_reference"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_savings_transactions_tenant_reference"`);
  }
}
