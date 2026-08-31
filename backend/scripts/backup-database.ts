/**
 * Task 33 — take a custom-format pg_dump of the live Docker Postgres.
 * Dumps stay in repo-root /backups (gitignored). Keeps the 7 newest files.
 *
 * Usage (from backend/): npm run backup:now
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const CONTAINER = process.env.POSTGRES_CONTAINER ?? 'isms-postgres';
const DATABASE = process.env.DB_NAME ?? 'isms_dev';
const ADMIN_USER = process.env.DB_USERNAME ?? 'postgres';
const KEEP = 7;
const REPO_ROOT = join(__dirname, '..', '..');
const BACKUPS_DIR = join(REPO_ROOT, 'backups');

function stamp(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function docker(args: string[]): string {
  return execFileSync('docker', args, { encoding: 'utf8' }).trim();
}

function prune(): void {
  const dumps = readdirSync(BACKUPS_DIR)
    .filter((name) => name.startsWith(`${DATABASE}_`) && name.endsWith('.dump'))
    .sort()
    .reverse();
  for (const extra of dumps.slice(KEEP)) {
    unlinkSync(join(BACKUPS_DIR, extra));
  }
}

function main(): void {
  mkdirSync(BACKUPS_DIR, { recursive: true });
  const fileName = `${DATABASE}_${stamp()}.dump`;
  const remote = `/tmp/${fileName}`;
  const local = join(BACKUPS_DIR, fileName);

  docker([
    'exec',
    CONTAINER,
    'pg_dump',
    '-U',
    ADMIN_USER,
    '-d',
    DATABASE,
    '-Fc',
    '-f',
    remote,
  ]);
  docker(['cp', `${CONTAINER}:${remote}`, local]);
  docker(['exec', CONTAINER, 'rm', '-f', remote]);
  prune();
  console.log(`Backup written: ${local}`);
}

main();
