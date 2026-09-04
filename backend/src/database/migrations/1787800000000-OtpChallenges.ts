import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Email OTP challenges for password reset/change and high-value withdrawals
 * or loan disbursements. Written by hand so RLS matches `audit_logs`.
 */
export class OtpChallenges1787800000000 implements MigrationInterface {
  name = 'OtpChallenges1787800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "otp_challenges" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid,
        "staff_id" uuid NOT NULL,
        "email" varchar(180) NOT NULL,
        "purpose" varchar(32) NOT NULL,
        "code_hash" varchar(255) NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "consumed_at" timestamptz,
        "attempts" integer NOT NULL DEFAULT 0,
        "context" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_otp_challenges_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_otp_challenges_staff" FOREIGN KEY ("staff_id")
          REFERENCES "staff_accounts" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_otp_challenges_tenant_id" ON "otp_challenges" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_otp_challenges_staff_purpose" ON "otp_challenges" ("staff_id", "purpose")`,
    );

    await queryRunner.query(`ALTER TABLE "otp_challenges" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "otp_challenges" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY "otp_challenges_tenant_isolation" ON "otp_challenges"
        USING ("tenant_id" IS NOT DISTINCT FROM app_current_tenant_id())
        WITH CHECK ("tenant_id" IS NOT DISTINCT FROM app_current_tenant_id())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS "otp_challenges_tenant_isolation" ON "otp_challenges"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "otp_challenges"`);
  }
}
