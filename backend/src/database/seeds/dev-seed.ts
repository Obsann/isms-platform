import { config as loadDotenv } from 'dotenv';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { buildDataSourceOptions } from '../data-source';
import type { RoleName } from '../../types';

loadDotenv({ quiet: true });

interface SeedTenant {
  code: string;
  name: string;
}

interface SeedStaff {
  email: string;
  fullName: string;
  role: RoleName;
  /** null = platform-level super-admin */
  tenantCode: string | null;
}

const DEV_PASSWORD = 'DevPassword!123';

const SEED_TENANTS: SeedTenant[] = [
  { code: 'tenant-a', name: 'Tenant A SACCO (dev seed)' },
  { code: 'tenant-b', name: 'Tenant B SACCO (dev seed)' },
];

/**
 * Dev seed for Task 3 isolation checks, Task 4 portal routing, and Task 28 load
 * checks (DECISIONS.md D5). Same publicly-known password for every account.
 *
 * Runs as the `postgres` role regardless of `.env`'s `DB_USERNAME`, since seeding
 * writes across tenants and RLS would block that. Idempotent.
 */
async function seed(): Promise<void> {
  const dataSource = new DataSource(
    buildDataSourceOptions({ ...process.env, DB_USERNAME: 'postgres' }),
  );
  await dataSource.initialize();

  try {
    const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);
    const tenantIds = new Map<string, string>();

    for (const tenant of SEED_TENANTS) {
      const [{ id: tenantId }] = await dataSource.query<[{ id: string }]>(
        `
          INSERT INTO "tenants" ("name", "code", "status")
          VALUES ($1, $2, 'active')
          ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name"
          RETURNING "id"
        `,
        [tenant.name, tenant.code],
      );
      tenantIds.set(tenant.code, tenantId);
      console.log(`Seeded tenant "${tenant.code}" (${tenantId})`);
    }

    const staff: SeedStaff[] = [
      {
        email: 'superadmin@platform.dev',
        fullName: 'Dev Super Admin',
        role: 'super-admin',
        tenantCode: null,
      },
    ];

    for (const tenant of SEED_TENANTS) {
      staff.push(
        {
          email: `admin@${tenant.code}.dev`,
          fullName: `Dev Tenant Admin (${tenant.code})`,
          role: 'tenant-admin',
          tenantCode: tenant.code,
        },
        {
          email: `teller@${tenant.code}.dev`,
          fullName: `Dev Teller (${tenant.code})`,
          role: 'teller',
          tenantCode: tenant.code,
        },
        {
          email: `loan-officer@${tenant.code}.dev`,
          fullName: `Dev Loan Officer (${tenant.code})`,
          role: 'loan-officer',
          tenantCode: tenant.code,
        },
      );
    }

    for (const account of staff) {
      const tenantId = account.tenantCode ? tenantIds.get(account.tenantCode)! : null;

      if (tenantId === null) {
        // Unique (tenant_id, email) treats NULLs as distinct in Postgres — delete by
        // email+role so re-seeds stay idempotent for the platform super-admin.
        await dataSource.query(
          `DELETE FROM "staff_accounts" WHERE "tenant_id" IS NULL AND "email" = $1`,
          [account.email],
        );
        await dataSource.query(
          `
            INSERT INTO "staff_accounts"
              ("tenant_id", "email", "password_hash", "full_name", "role", "is_active")
            VALUES (NULL, $1, $2, $3, $4, true)
          `,
          [account.email, passwordHash, account.fullName, account.role],
        );
      } else {
        await dataSource.query(
          `
            INSERT INTO "staff_accounts"
              ("tenant_id", "email", "password_hash", "full_name", "role", "is_active")
            VALUES ($1, $2, $3, $4, $5, true)
            ON CONFLICT ("tenant_id", "email")
              DO UPDATE SET
                "password_hash" = EXCLUDED."password_hash",
                "full_name" = EXCLUDED."full_name",
                "role" = EXCLUDED."role",
                "is_active" = true
          `,
          [tenantId, account.email, passwordHash, account.fullName, account.role],
        );
      }

      const loginHint =
        account.tenantCode === null
          ? `tenantCode="platform", email="${account.email}"`
          : `tenantCode="${account.tenantCode}", email="${account.email}"`;
      console.log(`  staff ${account.role}: ${loginHint}, password="${DEV_PASSWORD}"`);
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
