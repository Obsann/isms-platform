import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Opt-in Chapa B2C withdrawals on the existing tenant-scoped payments table.
 * Funds are held until Chapa transfer verify succeeds; the ledger still posts
 * the withdrawal through SavingsSharesService, never a direct balance write.
 */
export class ChapaWithdrawals1787700000000 implements MigrationInterface {
  name = 'ChapaWithdrawals1787700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "chapa_payments"
        ADD COLUMN "kind" varchar(16) NOT NULL DEFAULT 'deposit',
        ADD COLUMN "payout_channel" varchar(16),
        ADD COLUMN "bank_code" varchar(16),
        ADD COLUMN "hold_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "chapa_payments"
        ADD CONSTRAINT "chk_chapa_payments_kind"
        CHECK ("kind" IN ('deposit', 'withdrawal'))
    `);
    await queryRunner.query(`
      ALTER TABLE "chapa_payments"
        ADD CONSTRAINT "chk_chapa_payments_payout_channel"
        CHECK ("payout_channel" IS NULL OR "payout_channel" IN ('telebirr', 'mpesa'))
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_chapa_payments_tenant_kind" ON "chapa_payments" ("tenant_id", "kind")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_chapa_payments_tenant_kind"`);
    await queryRunner.query(
      `ALTER TABLE "chapa_payments" DROP CONSTRAINT IF EXISTS "chk_chapa_payments_payout_channel"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chapa_payments" DROP CONSTRAINT IF EXISTS "chk_chapa_payments_kind"`,
    );
    await queryRunner.query(`
      ALTER TABLE "chapa_payments"
        DROP COLUMN IF EXISTS "hold_id",
        DROP COLUMN IF EXISTS "bank_code",
        DROP COLUMN IF EXISTS "payout_channel",
        DROP COLUMN IF EXISTS "kind"
    `);
  }
}
