/**
 * Render pre-deploy: provision isms_app, run migrations as the DB owner, seed demo data.
 * Seed is idempotent. Set SKIP_SEED=1 to skip it.
 */
'use strict';

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.join(__dirname, '..');

const run = (args, extraEnv = {}) => {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run([path.join(__dirname, 'provision-app-role.cjs')]);

run(
  [
    path.join(root, 'node_modules', 'typeorm', 'cli.js'),
    'migration:run',
    '-d',
    path.join(root, 'dist', 'database', 'data-source.js'),
  ],
  { TYPEORM_USE_ADMIN: '1' },
);

run([path.join(__dirname, 'provision-app-role.cjs')]);

if (process.env.SKIP_SEED !== '1') {
  run([path.join(root, 'dist', 'database', 'seeds', 'dev-seed.js')]);
}
