import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MVP scope change (DECISIONS.md D1): drop Fayda verification columns; add manual
 * `id_type` for teller-entered ID classification.
 */
export class ManualMemberIdFields1786200000000 implements MigrationInterface {
  name = 'ManualMemberIdFields1786200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "members"
        ADD COLUMN "id_type" varchar(32),
        DROP COLUMN "national_id_verified",
        DROP COLUMN "national_id_verified_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "members"
        ADD CONSTRAINT "chk_members_id_type"
          CHECK ("id_type" IS NULL OR "id_type" IN ('national_id', 'passport', 'other'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "members" DROP CONSTRAINT "chk_members_id_type"
    `);
    await queryRunner.query(`
      ALTER TABLE "members"
        DROP COLUMN "id_type",
        ADD COLUMN "national_id_verified" boolean NOT NULL DEFAULT false,
        ADD COLUMN "national_id_verified_at" timestamptz
    `);
  }
}
