/**
 * Task 33 — confirm the backup sidecar is running and has written a dump.
 * Usage (from backend/): npm run backup:status
 */
import { execFileSync } from 'node:child_process';

const CONTAINER = process.env.BACKUP_CONTAINER ?? 'isms-postgres-backup';

function docker(args: string[]): string {
  return execFileSync('docker', args, { encoding: 'utf8' }).trim();
}

function main(): void {
  const running = docker([
    'ps',
    '--filter',
    `name=${CONTAINER}`,
    '--filter',
    'status=running',
    '--format',
    '{{.Names}} {{.Status}}',
  ]);
  if (!running.includes(CONTAINER)) {
    throw new Error(
      `${CONTAINER} is not running. From the repo root: docker compose up -d`,
    );
  }
  console.log(running);

  const logs = docker(['logs', CONTAINER, '--tail', '20']);
  console.log(logs);
  if (!logs.includes('Backup written:')) {
    throw new Error(
      `${CONTAINER} is up but has not written a dump yet. Check docker logs ${CONTAINER}.`,
    );
  }
  console.log('Backup schedule is running.');
}

main();
