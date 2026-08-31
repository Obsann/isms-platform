/**
 * Task 28 RLS isolation check — also the Task 33 restore verify step.
 *
 * Runs inside Docker as `isms_app` (not the postgres superuser, who bypasses RLS).
 * With tenant-a in session, overlapping tenant-b members must be invisible,
 * and the reverse. Four sessions run at once so isolation holds under concurrent load.
 *
 * Usage (from backend/):
 *   npm run rls:check
 *   npm run rls:check -- --database=isms_restore_check
 */
import { execFile } from 'node:child_process';

const CONTAINER = process.env.POSTGRES_CONTAINER ?? 'isms-postgres';
const ADMIN_USER = process.env.DB_USERNAME ?? 'postgres';
const APP_USER = process.env.DB_APP_USERNAME ?? 'isms_app';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function argValue(flag: string): string | undefined {
  const match = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  return match?.slice(flag.length + 1);
}

const DATABASE = argValue('--database') ?? process.env.DB_NAME ?? 'isms_dev';

function psql(user: string, sql: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      'docker',
      ['exec', '-i', CONTAINER, 'psql', '-U', user, '-d', DATABASE, '-v', 'ON_ERROR_STOP=1', '-t', '-A', '-q'],
      { encoding: 'utf8' },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr.trim() || error.message));
          return;
        }
        resolve(stdout.trim());
      },
    );
    child.stdin?.end(sql);
  });
}

function memberNumbers(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('MEM-'));
}

async function membersVisible(tenantId: string): Promise<string[]> {
  if (!UUID.test(tenantId)) {
    throw new Error(`Invalid tenant id: ${tenantId}`);
  }
  const raw = await psql(
    APP_USER,
    `BEGIN;
     SELECT set_config('app.tenant_id', '${tenantId}', true);
     SELECT member_number FROM members ORDER BY member_number;
     COMMIT;`,
  );
  return memberNumbers(raw);
}

async function main(): Promise<void> {
  const catalog = await psql(
    ADMIN_USER,
    `SELECT t.code || ' ' || m.member_number
       FROM members m
       JOIN tenants t ON t.id = m.tenant_id
      WHERE t.code IN ('tenant-a', 'tenant-b')
      ORDER BY t.code, m.member_number;`,
  );
  const byTenant: Record<string, string[]> = { 'tenant-a': [], 'tenant-b': [] };
  for (const line of catalog.split(/\r?\n/).map((row) => row.trim()).filter(Boolean)) {
    const space = line.indexOf(' ');
    const code = line.slice(0, space);
    const number = line.slice(space + 1);
    if (byTenant[code]) byTenant[code].push(number);
  }
  const expectedA = byTenant['tenant-a'];
  const expectedB = byTenant['tenant-b'];
  if (!expectedA.includes('MEM-10001') || !expectedB.includes('MEM-20001')) {
    throw new Error(
      `Need seed tenants tenant-a and tenant-b in ${DATABASE}. Run \`npm run seed\` first.`,
    );
  }

  const tenantLines = await psql(
    ADMIN_USER,
    `SELECT id || ' ' || code FROM tenants WHERE code IN ('tenant-a', 'tenant-b') ORDER BY code;`,
  );
  const tenants = tenantLines
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const space = line.indexOf(' ');
      return { id: line.slice(0, space), code: line.slice(space + 1) };
    });
  const tenantA = tenants.find((row) => row.code === 'tenant-a');
  const tenantB = tenants.find((row) => row.code === 'tenant-b');
  if (!tenantA?.id || !tenantB?.id) {
    throw new Error(
      `Need seed tenants tenant-a and tenant-b in ${DATABASE}. Run \`npm run seed\` first.`,
    );
  }

  const unscoped = memberNumbers(await psql(APP_USER, `SELECT member_number FROM members;`));
  if (unscoped.length > 0) {
    throw new Error('Fail-closed RLS failed: isms_app saw members with no app.tenant_id set');
  }

  const [seenA, seenB, seenAAgain, seenBAgain] = await Promise.all([
    membersVisible(tenantA.id),
    membersVisible(tenantB.id),
    membersVisible(tenantA.id),
    membersVisible(tenantB.id),
  ]);

  const leaksToA = seenA.filter((number) => expectedB.includes(number));
  const leaksToB = seenB.filter((number) => expectedA.includes(number));
  if (leaksToA.length > 0) {
    throw new Error(`tenant-a session saw tenant-b members: ${leaksToA.join(', ')}`);
  }
  if (leaksToB.length > 0) {
    throw new Error(`tenant-b session saw tenant-a members: ${leaksToB.join(', ')}`);
  }
  const missingA = expectedA.filter((number) => !seenA.includes(number));
  const extraA = seenA.filter((number) => !expectedA.includes(number));
  const missingB = expectedB.filter((number) => !seenB.includes(number));
  const extraB = seenB.filter((number) => !expectedB.includes(number));
  if (missingA.length > 0 || extraA.length > 0) {
    throw new Error(
      `tenant-a visibility mismatch. missing=${missingA.join(',') || 'none'} extra=${extraA.join(',') || 'none'}`,
    );
  }
  if (missingB.length > 0 || extraB.length > 0) {
    throw new Error(
      `tenant-b visibility mismatch. missing=${missingB.join(',') || 'none'} extra=${extraB.join(',') || 'none'}`,
    );
  }
  if (seenA.join(',') !== seenAAgain.join(',') || seenB.join(',') !== seenBAgain.join(',')) {
    throw new Error('Concurrent RLS reads disagreed — isolation is not stable under load');
  }

  console.log(`RLS check passed on ${DATABASE}.`);
  console.log(`  tenant-a members: ${seenA.join(', ')}`);
  console.log(`  tenant-b members: ${seenB.join(', ')}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`RLS check failed: ${message}`);
  process.exit(1);
});
