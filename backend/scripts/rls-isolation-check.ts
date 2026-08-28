/**
 * Task 28 RLS isolation check — also the Task 33 restore verify step.
 *
 * Connects as `isms_app` (not the postgres superuser, who bypasses RLS).
 * With tenant-a in session, overlapping tenant-b members must be invisible,
 * and the reverse. Two connections run at the same time so isolation holds
 * under concurrent load, not only on a quiet sequential pass.
 *
 * Usage (from backend/):
 *   npm run rls:check
 *   npm run rls:check -- --database=isms_restore_check
 */
import { config as loadDotenv } from 'dotenv';
import { Client } from 'pg';

loadDotenv({ quiet: true });

const HOST = process.env.DB_HOST ?? 'localhost';
const PORT = Number.parseInt(process.env.DB_PORT ?? '5432', 10);
const ADMIN_USER = process.env.DB_USERNAME ?? 'postgres';
const APP_USER = process.env.DB_APP_USERNAME ?? 'isms_app';
const PASSWORD = process.env.DB_PASSWORD ?? 'abebebesobela';

function argValue(flag: string): string | undefined {
  const match = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  return match?.slice(flag.length + 1);
}

const DATABASE = argValue('--database') ?? process.env.DB_NAME ?? 'isms_dev';

interface TenantRow {
  id: string;
  code: string;
}

async function withClient(user: string, work: (client: Client) => Promise<void>): Promise<void> {
  const client = new Client({
    host: HOST,
    port: PORT,
    user,
    password: PASSWORD,
    database: DATABASE,
  });
  await client.connect();
  try {
    await work(client);
  } finally {
    await client.end();
  }
}

async function membersVisible(tenantId: string): Promise<string[]> {
  const client = new Client({
    host: HOST,
    port: PORT,
    user: APP_USER,
    password: PASSWORD,
    database: DATABASE,
  });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SELECT set_config('app.tenant_id', $1, true)`, [tenantId]);
    const result = await client.query<{ member_number: string }>(
      `SELECT member_number FROM members ORDER BY member_number`,
    );
    await client.query('COMMIT');
    return result.rows.map((row) => row.member_number);
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw error;
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  let tenants: TenantRow[] = [];
  await withClient(ADMIN_USER, async (admin) => {
    const result = await admin.query<TenantRow>(
      `SELECT id, code FROM tenants WHERE code IN ('tenant-a', 'tenant-b') ORDER BY code`,
    );
    tenants = result.rows;
  });

  const tenantA = tenants.find((row) => row.code === 'tenant-a');
  const tenantB = tenants.find((row) => row.code === 'tenant-b');
  if (!tenantA || !tenantB) {
    throw new Error(
      `Need seed tenants tenant-a and tenant-b in ${DATABASE}. Run \`npm run seed\` first.`,
    );
  }

  await withClient(APP_USER, async (app) => {
    const empty = await app.query(`SELECT member_number FROM members`);
    if (empty.rows.length !== 0) {
      throw new Error('Fail-closed RLS failed: isms_app saw members with no app.tenant_id set');
    }
  });

  const [seenA, seenB, seenAAgain, seenBAgain] = await Promise.all([
    membersVisible(tenantA.id),
    membersVisible(tenantB.id),
    membersVisible(tenantA.id),
    membersVisible(tenantB.id),
  ]);

  const leaksToA = seenA.filter((number) => number.startsWith('MEM-2'));
  const leaksToB = seenB.filter((number) => number.startsWith('MEM-1'));
  if (leaksToA.length > 0) {
    throw new Error(`tenant-a session saw tenant-b members: ${leaksToA.join(', ')}`);
  }
  if (leaksToB.length > 0) {
    throw new Error(`tenant-b session saw tenant-a members: ${leaksToB.join(', ')}`);
  }
  if (!seenA.includes('MEM-10001')) {
    throw new Error('tenant-a session did not see seeded member MEM-10001');
  }
  if (!seenB.includes('MEM-20001')) {
    throw new Error('tenant-b session did not see seeded member MEM-20001');
  }
  if (seenA.join(',') !== seenAAgain.join(',') || seenB.join(',') !== seenBAgain.join(',')) {
    throw new Error('Concurrent RLS reads disagreed — isolation is not stable under load');
  }

  console.log(`RLS check passed on ${DATABASE} (concurrent tenant-a / tenant-b).`);
  console.log(`  tenant-a members: ${seenA.join(', ')}`);
  console.log(`  tenant-b members: ${seenB.join(', ')}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`RLS check failed: ${message}`);
  process.exit(1);
});
