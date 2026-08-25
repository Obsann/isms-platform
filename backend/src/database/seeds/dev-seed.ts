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
  tenantCode: string;
  memberNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  nationalId?: string;
  idType?: 'national_id' | 'passport' | 'other';
  phone?: string;
  email?: string;
  status: 'active' | 'pending' | 'inactive';
}

const DEV_PASSWORD = 'DevPassword!123';

const SEED_TENANTS: SeedTenant[] = [
  { code: 'tenant-a', name: 'Tenant A SACCO (dev seed)' },
  { code: 'tenant-b', name: 'Tenant B SACCO (dev seed)' },
];

const SEED_MEMBERS: SeedMember[] = [
  {
    tenantCode: 'tenant-a',
    memberNumber: 'MEM-10001',
    firstName: 'Abebe',
    middleName: 'Kebede',
    lastName: 'Bikila',
    nationalId: 'FIN-1001-2002-3003',
    idType: 'national_id',
    phone: '+251911123456',
    email: 'abebe.bikila@tenant-a.dev',
    status: 'active',
  },
  {
    tenantCode: 'tenant-a',
    memberNumber: 'MEM-10002',
    firstName: 'Tigist',
    middleName: 'Worku',
    lastName: 'Hailu',
    nationalId: 'EP-8822991',
    idType: 'passport',
    phone: '+251922234567',
    email: 'tigist.worku@tenant-a.dev',
    status: 'active',
  },
  {
    tenantCode: 'tenant-a',
    memberNumber: 'MEM-10003',
    firstName: 'Dawit',
    middleName: 'Solomon',
    lastName: 'Tadesse',
    nationalId: 'FIN-3003-4004-5005',
    idType: 'national_id',
    phone: '+251933345678',
    email: 'dawit.solomon@tenant-a.dev',
    status: 'pending',
  },
  {
    tenantCode: 'tenant-b',
    memberNumber: 'MEM-20001',
    firstName: 'Almaz',
    middleName: 'Desta',
    lastName: 'Tesfaye',
    nationalId: 'FIN-5005-6006-7007',
    idType: 'national_id',
    phone: '+251944456789',
    email: 'almaz.desta@tenant-b.dev',
    status: 'active',
  },
];

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

    // Seed Staff Accounts
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

    // Seed Members
    console.log('\nSeeding Members...');
    for (const member of SEED_MEMBERS) {
      const tenantId = tenantIds.get(member.tenantCode)!;
      const [{ id: memberId }] = await dataSource.query<[{ id: string }]>(
        `
          INSERT INTO "members"
            ("tenant_id", "member_number", "first_name", "middle_name", "last_name", "national_id", "id_type", "phone", "email", "status", "joined_at")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE)
          ON CONFLICT ("tenant_id", "member_number")
            DO UPDATE SET
              "first_name" = EXCLUDED."first_name",
              "last_name" = EXCLUDED."last_name",
              "email" = EXCLUDED."email",
              "phone" = EXCLUDED."phone"
          RETURNING "id"
        `,
        [
          tenantId,
          member.memberNumber,
          member.firstName,
          member.middleName || null,
          member.lastName,
          member.nationalId || null,
          member.idType || null,
          member.phone || null,
          member.email || null,
          member.status,
        ],
      );
      console.log(`  member ${member.memberNumber}: id="${memberId}", name="${member.firstName} ${member.lastName}", tenant="${member.tenantCode}"`);
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
