/**
 * Task 33 rehearsal: dump live DB → restore into spare DB → re-run Task 28 RLS check.
 * Usage (from backend/): npm run backup:rehearse
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const backendRoot = join(__dirname, '..');

function run(script: string, extraArgs: string[] = []): void {
  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['ts-node', '-O', '{"module":"commonjs"}', script, ...extraArgs],
    { cwd: backendRoot, stdio: 'inherit', shell: process.platform === 'win32' },
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('scripts/backup-database.ts');
run('scripts/restore-database.ts');
run('scripts/rls-isolation-check.ts', ['--database=isms_restore_check']);
console.log('Task 33 rehearsal passed: restored copy satisfies the Task 28 RLS check.');
