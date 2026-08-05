import { config as loadDotenv } from 'dotenv';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { buildDataSourceOptions } from '../data-source';

loadDotenv({ quiet: true });

interface SeedTenant {
  code: string;
  name: string;
  email: string;
  password: string;
}

const DEV_PASSWORD = 'DevPassword!123';

const SEED_TENANTS: SeedTenant[] = [
  {
    code: 'tenant-a',
    name: 'Tenant A SACCO (dev seed)',
    email: 'admin@tenant-a.dev',
    password: DEV_PASSWORD,
  },
  {
    code: 'tenant-b',
    name: 'Tenant B SACCO (dev seed)',
    email: 'admin@tenant-b.dev',
    password: DEV_PASSWORD,
  },
];

/**
 * Dev-only seed for Task 3's isolation check, and reusable later for Task 28's
 * concurrent-tenant load check: two active tenants, one staff account each, both
 * passwords hashed with bcryptjs. Never a real credential — this is a fixed,
 * publicly-known dev password, same shape as the `devpassword` convention used for
 * the local Postgres user.
 *
 * Runs as the `postgres` role regardless of whatever `.env`'s `DB_USERNAME` is
 * currently set to, since seeding writes rows across two tenants in one process and
 * RLS would otherwise block exactly that. Idempotent — safe to run more than once.
 */
async function seed(): Promise<void> {
  // Override via env rather than spreading-and-overriding the resolved
  // `DataSourceOptions` object: that type is a union across every driver TypeORM
  // supports, and TypeScript can't tell an object literal built that way is still
  // the Postgres member of it.
  const dataSource = new DataSource(buildDataSourceOptions({ ...process.env, DB_USERNAME: 'postgres' }));
  await dataSource.initialize();

  try {
    for (const tenant of SEED_TENANTS) {
      const passwordHash = await bcrypt.hash(tenant.password, 10);

      const [{ id: tenantId }] = await dataSource.query<[{ id: string }]>(
        `
          INSERT INTO "tenants" ("name", "code", "status")
          VALUES ($1, $2, 'active')
          ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name"
          RETURNING "id"
        `,
        [tenant.name, tenant.code],
      );

      await dataSource.query(
        `
          INSERT INTO "staff_accounts"
            ("tenant_id", "email", "password_hash", "full_name", "role", "is_active")
          VALUES ($1, $2, $3, 'Dev Seed Admin', 'tenant-admin', true)
          ON CONFLICT ("tenant_id", "email")
            DO UPDATE SET "password_hash" = EXCLUDED."password_hash", "is_active" = true
        `,
        [tenantId, tenant.email, passwordHash],
      );

      console.log(
        `Seeded tenant "${tenant.code}" (${tenantId}) — ` +
          `login with tenantCode="${tenant.code}", email="${tenant.email}", password="${tenant.password}"`,
      );
    }
  } finally {
    await dataSource.destroy();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
