/**
 * Task 33 — restore a dump into a spare database (default `isms_restore_check`)
 * so rehearsal does not wipe the live `isms_dev` volume.
 *
 * Then grant `isms_app` access so `npm run rls:check -- --database=isms_restore_check`
 * can verify RLS on the restored copy.
 *
 * Usage (from backend/):
 *   npm run backup:restore
 *   npm run backup:restore -- --file=../backups/isms_dev_....dump
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const CONTAINER = process.env.POSTGRES_CONTAINER ?? 'isms-postgres';
const ADMIN_USER = process.env.DB_USERNAME ?? 'postgres';
const APP_USER = process.env.DB_APP_USERNAME ?? 'isms_app';
const SOURCE_DB = process.env.DB_NAME ?? 'isms_dev';
const REPO_ROOT = join(__dirname, '..', '..');
const BACKUPS_DIR = join(REPO_ROOT, 'backups');

function argValue(flag: string): string | undefined {
  const match = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  return match?.slice(flag.length + 1);
}

const TARGET_DB = argValue('--database') ?? process.env.RESTORE_DATABASE ?? 'isms_restore_check';

if (!/^[a-z][a-z0-9_]*$/i.test(TARGET_DB) || !/^[a-z][a-z0-9_]*$/i.test(SOURCE_DB)) {
  throw new Error('Database names must be letters, numbers, and underscore only.');
}

function docker(args: string[], stdin?: string): string {
  return execFileSync('docker', args, {
    encoding: 'utf8',
    input: stdin,
    stdio: stdin === undefined ? ['ignore', 'pipe', 'pipe'] : ['pipe', 'pipe', 'pipe'],
  }).trim();
}

function latestDump(): string {
  const named = argValue('--file');
  if (named) {
    const resolved = named.startsWith('/') || /^[A-Za-z]:/.test(named) ? named : join(process.cwd(), named);
    if (!existsSync(resolved)) {
      throw new Error(`Dump not found: ${resolved}`);
    }
    return resolved;
  }
  const dumps = readdirSync(BACKUPS_DIR)
    .filter((name) => name.startsWith(`${SOURCE_DB}_`) && name.endsWith('.dump'))
    .sort();
  const newest = dumps[dumps.length - 1];
  if (!newest) {
    throw new Error(`No ${SOURCE_DB}_*.dump files in backups/. Run npm run backup:now first.`);
  }
  return join(BACKUPS_DIR, newest);
}

function main(): void {
  if (TARGET_DB === SOURCE_DB) {
    throw new Error(`Refusing to restore over live database ${SOURCE_DB}. Pass a spare --database= name.`);
  }

  const dump = latestDump();
  const remote = `/tmp/restore.dump`;
  docker(['cp', dump, `${CONTAINER}:${remote}`]);

  const recreate = `
    SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${TARGET_DB}' AND pid <> pg_backend_pid();
    DROP DATABASE IF EXISTS ${TARGET_DB};
    CREATE DATABASE ${TARGET_DB} TEMPLATE template0;
    GRANT CONNECT ON DATABASE ${TARGET_DB} TO ${APP_USER};
  `;
  docker(['exec', '-i', CONTAINER, 'psql', '-U', ADMIN_USER, '-d', 'postgres', '-v', 'ON_ERROR_STOP=1'], recreate);

  const restore = spawnSync(
    'docker',
    [
      'exec',
      CONTAINER,
      'pg_restore',
      '-U',
      ADMIN_USER,
      '-d',
      TARGET_DB,
      '--clean',
      '--if-exists',
      '--no-owner',
      remote,
    ],
    { encoding: 'utf8' },
  );
  if (restore.status !== null && restore.status >= 2) {
    throw new Error(restore.stderr || restore.stdout || 'pg_restore failed');
  }
  if (restore.stderr) {
    console.warn(restore.stderr.trim());
  }

  const grants = `
    GRANT USAGE ON SCHEMA public TO ${APP_USER};
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${APP_USER};
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${APP_USER};
  `;
  docker(['exec', '-i', CONTAINER, 'psql', '-U', ADMIN_USER, '-d', TARGET_DB, '-v', 'ON_ERROR_STOP=1'], grants);
  docker(['exec', CONTAINER, 'rm', '-f', remote]);

  console.log(`Restored ${dump} into ${TARGET_DB}`);
}

main();
