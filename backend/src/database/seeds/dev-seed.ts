import { config as loadDotenv } from 'dotenv';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { buildAdminDataSourceOptions } from '../data-source';
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
  initialSavingsBalance?: string;
  accountNumber?: string;
}

const DEV_PASSWORD = 'DevPassword!123';

const SEED_TENANTS: SeedTenant[] = [
  { code: 'tenant-a', name: 'Tsehay Sacco' },
  { code: 'tenant-b', name: 'Chereka Sacco' },
];

const BASE_MEMBERS: SeedMember[] = [
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
    initialSavingsBalance: '45230.00',
    accountNumber: 'SAV-10001',
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
    initialSavingsBalance: '128500.00',
    accountNumber: 'SAV-10002',
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
    initialSavingsBalance: '35000.00',
    accountNumber: 'SAV-10003',
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
    initialSavingsBalance: '892100.00',
    accountNumber: 'SAV-20001',
  },
];

/**
 * Temporarily drop FORCE RLS so a non-superuser table owner (Render) can seed.
 * `ENABLE ROW LEVEL SECURITY` stays on, so `isms_app` is still isolated.
 * Local `postgres` is a superuser and would bypass anyway; restoring FORCE is still required.
 */
async function relaxForceRls(dataSource: DataSource, names: string[]): Promise<void> {
  const tables: Array<{ relname: string }> = await dataSource.query(`
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity
      AND c.relforcerowsecurity
  `);
  for (const { relname } of tables) {
    await dataSource.query(`ALTER TABLE "${relname}" NO FORCE ROW LEVEL SECURITY`);
    names.push(relname);
  }
}

async function canForceRls(dataSource: DataSource): Promise<boolean> {
  const rows: Array<{ allowed: boolean }> = await dataSource.query(`
    SELECT (rolsuper OR rolbypassrls) AS allowed
    FROM pg_roles
    WHERE rolname = current_user
  `);
  return Boolean(rows[0]?.allowed);
}

async function restoreForceRls(dataSource: DataSource, names: string[]): Promise<void> {
  if (!(await canForceRls(dataSource))) {
    console.warn(
      'seed: current role cannot BYPASSRLS — leaving FORCE RLS off so the managed-Postgres owner can seed and serve. ENABLE RLS remains.',
    );
    return;
  }
  for (const name of names) {
    await dataSource.query(`ALTER TABLE "${name}" FORCE ROW LEVEL SECURITY`);
  }
}

/**
 * Dev seed for Task 3 isolation checks, Task 4 portal routing, Task 8 Member directory,
 * Task 18 Loans, and Task 23 Self-Service API. Same password for every staff account.
 *
 * Runs as the database owner / `postgres` role, not `isms_app`, since seeding
 * writes across tenants and RLS would block that. Idempotent.
 */
async function seed(): Promise<void> {
  const dataSource = new DataSource(buildAdminDataSourceOptions());
  await dataSource.initialize();

  const forcedTables: string[] = [];
  try {
    await relaxForceRls(dataSource, forcedTables);
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
      console.log(`Seeded tenant "${tenant.name}" code="${tenant.code}" (${tenantId})`);
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

    // One staff login per seeded member, same email, role member — portal lookup
    // matches staff_accounts.email to members.email. Derived from BASE_MEMBERS so
    // the two can never drift.
    const seedMemberLogins: SeedStaff[] = BASE_MEMBERS.filter(
      (member): member is SeedMember & { email: string } => Boolean(member.email),
    ).map((member) => ({
      email: member.email,
      fullName: [member.firstName, member.middleName, member.lastName]
        .filter((part): part is string => Boolean(part))
        .join(' '),
      role: 'member' as const,
      tenantCode: member.tenantCode,
    }));
    staff.push(...seedMemberLogins);

    for (const account of staff) {
      const tenantId = account.tenantCode ? tenantIds.get(account.tenantCode)! : null;

      // Never DELETE staff: audit_logs.actor_staff_id is ON DELETE RESTRICT and
      // audit rows are append-only. Upsert so re-runs keep the same staff id.
      if (tenantId === null) {
        await dataSource.query(
          `
            INSERT INTO "staff_accounts"
              ("tenant_id", "email", "password_hash", "full_name", "role", "is_active")
            VALUES (NULL, $1, $2, $3, $4, true)
            ON CONFLICT ("email") WHERE "tenant_id" IS NULL
              DO UPDATE SET
                "password_hash" = EXCLUDED."password_hash",
                "full_name" = EXCLUDED."full_name",
                "role" = EXCLUDED."role",
                "is_active" = true
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
    console.log('\nSeeding Members & Savings Accounts...');
    let firstMemberId: string | null = null;
    const tenantAId = tenantIds.get('tenant-a')!;
    const memberIdsByNumber = new Map<string, { memberId: string; tenantId: string }>();

    for (const member of BASE_MEMBERS) {
      const tenantId = tenantIds.get(member.tenantCode)!;
      const [{ id: memberId }] = await dataSource.query<[{ id: string }]>(
        `
          INSERT INTO "members"
            ("tenant_id", "member_number", "first_name", "middle_name", "last_name", "national_id", "id_type", "phone", "email", "status", "joined_at", "updated_at")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE, NOW())
          ON CONFLICT ("tenant_id", "member_number")
            DO UPDATE SET
              "first_name" = EXCLUDED."first_name",
              "middle_name" = EXCLUDED."middle_name",
              "last_name" = EXCLUDED."last_name",
              "national_id" = EXCLUDED."national_id",
              "id_type" = EXCLUDED."id_type",
              "phone" = EXCLUDED."phone",
              "email" = EXCLUDED."email",
              "status" = EXCLUDED."status",
              "updated_at" = NOW()
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

      if (!firstMemberId && member.tenantCode === 'tenant-a') {
        firstMemberId = memberId;
      }

      memberIdsByNumber.set(member.memberNumber, { memberId, tenantId });

      if (member.accountNumber && member.initialSavingsBalance) {
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
      }

      console.log(`  member ${member.memberNumber}: id="${memberId}", name="${member.firstName} ${member.lastName}", tenant="${member.tenantCode}"`);
    }

    // 4. Seed Sample Loan
    if (firstMemberId) {
      await dataSource.query(
        `
          INSERT INTO "loans"
            ("tenant_id", "member_id", "loan_number", "requested_amount", "approved_amount", "term_months", "purpose", "status")
          VALUES ($1, $2, 'LN-2026-000001', '50000.00', '50000.00', 12, 'Business Expansion', 'approved')
          ON CONFLICT ("tenant_id", "loan_number")
            DO UPDATE SET "requested_amount" = EXCLUDED."requested_amount"
        `,
        [tenantAId, firstMemberId],
      );
      console.log(`  loan LN-2026-000001: id="${firstMemberId}", amount="50000.00", status="approved"`);
    }

    const loanRows = await dataSource.query<{ id: string }[]>(
      `SELECT "id" FROM "loans" WHERE "tenant_id" = $1 AND "loan_number" = 'LN-2026-000001'`,
      [tenantAId],
    );
    const abebeLoanId = loanRows[0]?.id ?? null;

    // 5. Seed shared mobile-money pending mocks (Task 24 — member portal, database-backed)
    console.log('\nSeeding demo mobile-money pending mocks...');
    type DemoMomoSeed = {
      memberNumber: string;
      direction: 'c2b' | 'b2c';
      providerReference: string;
      provider: 'telebirr' | 'mpesa' | 'cbe_birr';
      amount: string;
      accountNumber?: string;
      loanId?: string | null;
      msisdn: string;
      occurredAt: string;
    };

    const DEMO_MOMO_STAGED: DemoMomoSeed[] = [
      {
        memberNumber: 'MEM-10001',
        direction: 'c2b',
        providerReference: 'MOCK-C2B-DEMO-ABEBE',
        provider: 'telebirr',
        amount: '500.00',
        accountNumber: 'SAV-10001',
        msisdn: '+251911123456',
        occurredAt: '2026-08-15T10:30:00.000Z',
      },
      {
        memberNumber: 'MEM-10001',
        direction: 'b2c',
        providerReference: 'MOCK-B2C-DEMO-ABEBE',
        provider: 'telebirr',
        amount: '10000.00',
        loanId: abebeLoanId,
        msisdn: '+251911123456',
        occurredAt: '2026-08-16T14:00:00.000Z',
      },
      {
        memberNumber: 'MEM-10002',
        direction: 'c2b',
        providerReference: 'MOCK-C2B-DEMO-TIGIST',
        provider: 'mpesa',
        amount: '750.00',
        accountNumber: 'SAV-10002',
        msisdn: '+251922234567',
        occurredAt: '2026-08-17T09:15:00.000Z',
      },
      {
        memberNumber: 'MEM-20001',
        direction: 'c2b',
        providerReference: 'MOCK-C2B-DEMO-ALMAZ',
        provider: 'cbe_birr',
        amount: '2500.00',
        accountNumber: 'SAV-20001',
        msisdn: '+251944456789',
        occurredAt: '2026-08-15T11:45:00.000Z',
      },
    ];

    for (const demo of DEMO_MOMO_STAGED) {
      const row = memberIdsByNumber.get(demo.memberNumber);
      if (!row) continue;
      await dataSource.query(
        `
          INSERT INTO "mobile_money_staged_requests"
            ("tenant_id", "member_id", "direction", "provider", "provider_reference", "account_number", "loan_id", "msisdn", "amount", "currency", "status", "failure_reason", "occurred_at")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ETB', 'PENDING', NULL, $10)
          ON CONFLICT ("tenant_id", "provider_reference")
            DO UPDATE SET
              "member_id" = EXCLUDED."member_id",
              "direction" = EXCLUDED."direction",
              "provider" = EXCLUDED."provider",
              "account_number" = EXCLUDED."account_number",
              "loan_id" = EXCLUDED."loan_id",
              "msisdn" = EXCLUDED."msisdn",
              "amount" = EXCLUDED."amount",
              "occurred_at" = EXCLUDED."occurred_at",
              "updated_at" = NOW()
        `,
        [
          row.tenantId,
          row.memberId,
          demo.direction,
          demo.provider,
          demo.providerReference,
          demo.direction === 'c2b' ? demo.accountNumber ?? null : null,
          demo.direction === 'b2c' ? demo.loanId ?? null : null,
          demo.msisdn,
          demo.amount,
          demo.occurredAt,
        ],
      );
      console.log(
        `  momo pending ${demo.providerReference}: member="${demo.memberNumber}", ${demo.direction}, amount="${demo.amount}"`,
      );
    }
  } finally {
    try {
      await restoreForceRls(dataSource, forcedTables);
    } catch (restoreError: unknown) {
      console.error('Failed to restore FORCE ROW LEVEL SECURITY after seed:', restoreError);
    }
    await dataSource.destroy();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
