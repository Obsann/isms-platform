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

interface SeedMember {
  memberNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId: string;
  idType: string;
  status: string;
  tenantCode: string;
  initialSavingsBalance: string;
  accountNumber: string;
}

const DEV_PASSWORD = 'DevPassword!123';

const SEED_TENANTS: SeedTenant[] = [
  { code: 'tenant-a', name: 'Tenant A SACCO (dev seed)' },
  { code: 'tenant-b', name: 'Tenant B SACCO (dev seed)' },
];

const SEED_MEMBERS: SeedMember[] = [
  {
    memberNumber: 'MEM-10001',
    firstName: 'Abebe',
    lastName: 'Bikila',
    email: 'abebe.bikila@tenant-a.dev',
    phone: '+251911100001',
    nationalId: 'ETH-10001',
    idType: 'national_id',
    status: 'active',
    tenantCode: 'tenant-a',
    initialSavingsBalance: '45230.00',
    accountNumber: 'SAV-10001',
  },
  {
    memberNumber: 'MEM-10002',
    firstName: 'Tigist',
    lastName: 'Hailu',
    email: 'tigist.hailu@tenant-a.dev',
    phone: '+251911100002',
    nationalId: 'ETH-10002',
    idType: 'national_id',
    status: 'active',
    tenantCode: 'tenant-a',
    initialSavingsBalance: '128500.00',
    accountNumber: 'SAV-10002',
  },
  {
    memberNumber: 'MEM-10003',
    firstName: 'Dawit',
    lastName: 'Tadesse',
    email: 'dawit.tadesse@tenant-a.dev',
    phone: '+251911100003',
    nationalId: 'ETH-10003',
    idType: 'national_id',
    status: 'pending',
    tenantCode: 'tenant-a',
    initialSavingsBalance: '35000.00',
    accountNumber: 'SAV-10003',
  },
  {
    memberNumber: 'MEM-20001',
    firstName: 'Almaz',
    lastName: 'Tesfaye',
    email: 'almaz.tesfaye@tenant-b.dev',
    phone: '+251911200001',
    nationalId: 'ETH-20001',
    idType: 'national_id',
    status: 'active',
    tenantCode: 'tenant-b',
    initialSavingsBalance: '892100.00',
    accountNumber: 'SAV-20001',
  },
];

/**
 * Dev seed for Task 3 isolation checks, Task 4 portal routing, Task 8 Member directory,
 * and Task 23 Self-Service API. Same publicly-known password for every staff account.
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

    // 1. Seed Tenants
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

    // 2. Seed Staff Accounts
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

    // 3. Seed Members & Savings Accounts
    for (const member of SEED_MEMBERS) {
      const tenantId = tenantIds.get(member.tenantCode)!;

      const [{ id: memberId }] = await dataSource.query<[{ id: string }]>(
        `
          INSERT INTO "members"
            ("tenant_id", "member_number", "first_name", "last_name", "email", "phone", "national_id", "id_type", "status", "created_at", "updated_at")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          ON CONFLICT ("tenant_id", "member_number")
            DO UPDATE SET
              "first_name" = EXCLUDED."first_name",
              "last_name" = EXCLUDED."last_name",
              "email" = EXCLUDED."email",
              "phone" = EXCLUDED."phone",
              "national_id" = EXCLUDED."national_id",
              "status" = EXCLUDED."status",
              "updated_at" = NOW()
          RETURNING "id"
        `,
        [
          tenantId,
          member.memberNumber,
          member.firstName,
          member.lastName,
          member.email,
          member.phone,
          member.nationalId,
          member.idType,
          member.status,
        ],
      );

      await dataSource.query(
        `
          INSERT INTO "accounts"
            ("tenant_id", "member_id", "account_number", "type", "status", "balance", "held_amount", "currency", "created_at", "updated_at")
          VALUES ($1, $2, $3, 'savings', 'active', $4, 0, 'ETB', NOW(), NOW())
          ON CONFLICT ("tenant_id", "account_number")
            DO UPDATE SET
              "balance" = EXCLUDED."balance",
              "updated_at" = NOW()
        `,
        [tenantId, memberId, member.accountNumber, member.initialSavingsBalance],
      );

      console.log(`  member ${member.memberNumber}: ${member.firstName} ${member.lastName} (${member.tenantCode}, balance: ${member.initialSavingsBalance} ETB)`);
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
