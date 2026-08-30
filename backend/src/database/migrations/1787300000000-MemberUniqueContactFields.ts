import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Task 10: unique national ID / passport / other ID, phone, and email per tenant.
 * Names may repeat. NULLs stay allowed (partial unique indexes).
 */
export class MemberUniqueContactFields1787300000000 implements MigrationInterface {
  name = 'MemberUniqueContactFields1787300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "members" AS m
      SET "phone" = NULL
      WHERE m."id" IN (
        SELECT "id" FROM (
          SELECT "id",
            ROW_NUMBER() OVER (PARTITION BY "tenant_id", "phone" ORDER BY "created_at" ASC) AS rn
          FROM "members"
          WHERE "phone" IS NOT NULL
        ) d
        WHERE d.rn > 1
      )
    `);
    await queryRunner.query(`
      UPDATE "members" AS m
      SET "email" = NULL
      WHERE m."id" IN (
        SELECT "id" FROM (
          SELECT "id",
            ROW_NUMBER() OVER (PARTITION BY "tenant_id", "email" ORDER BY "created_at" ASC) AS rn
          FROM "members"
          WHERE "email" IS NOT NULL
        ) d
        WHERE d.rn > 1
      )
    `);
    await queryRunner.query(`
      UPDATE "members" AS m
      SET "national_id" = NULL
      WHERE m."id" IN (
        SELECT "id" FROM (
          SELECT "id",
            ROW_NUMBER() OVER (PARTITION BY "tenant_id", "national_id" ORDER BY "created_at" ASC) AS rn
          FROM "members"
          WHERE "national_id" IS NOT NULL
        ) d
        WHERE d.rn > 1
      )
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_members_tenant_national_id"`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_members_tenant_national_id"
        ON "members" ("tenant_id", "national_id")
        WHERE "national_id" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_members_tenant_phone"
        ON "members" ("tenant_id", "phone")
        WHERE "phone" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_members_tenant_email"
        ON "members" ("tenant_id", "email")
        WHERE "email" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_members_tenant_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_members_tenant_phone"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_members_tenant_national_id"`);
    await queryRunner.query(`
      CREATE INDEX "idx_members_tenant_national_id"
        ON "members" ("tenant_id", "national_id")
    `);
  }
}
