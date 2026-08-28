/**
 * Task 33 rehearsal: dump live DB → restore into spare DB → re-run Task 28 RLS check.
 * Usage (from backend/): npm run backup:rehearse
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const backendRoot = join(__dirname, '..');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(script: string, extraArgs: string[] = []): void {
  const result = spawnSync(npmCmd, ['run', script, '--', ...extraArgs], {
    cwd: backendRoot,
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('backup:now');
run('backup:restore');
run('rls:check', ['--database=isms_restore_check']);
console.log('Task 33 rehearsal passed: restored copy satisfies the Task 28 RLS check.');
