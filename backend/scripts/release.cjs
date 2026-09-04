/**
 * Render pre-deploy: try to provision isms_app, run migrations as the DB owner, seed demo data.
 *
 * Managed Postgres owners are not superusers and cannot set BYPASSRLS. Provision
 * therefore must not fail the release: if CREATE ROLE is denied, migrate/seed/API
 * continue as the DATABASE_URL user. Set SKIP_APP_ROLE=1 to skip provision.
 * Seed is idempotent. Set SKIP_SEED=1 to skip it.
 */
'use strict';

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.join(__dirname, '..');

const run = (args, extraEnv = {}, { optional = false } = {}) => {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });
  if (result.status !== 0) {
    if (optional) {
      console.warn(
        `release: ${path.basename(args[0])} exited ${result.status ?? 1}; continuing as DATABASE_URL owner.`,
      );
      return;
    }
    process.exit(result.status ?? 1);
  }
};

run([path.join(__dirname, 'provision-app-role.cjs')], {}, { optional: true });

run(
  [
    path.join(root, 'node_modules', 'typeorm', 'cli.js'),
    'migration:run',
    '-d',
    path.join(root, 'dist', 'database', 'data-source.js'),
  ],
  { TYPEORM_USE_ADMIN: '1' },
);

run([path.join(__dirname, 'provision-app-role.cjs')], {}, { optional: true });

if (process.env.SKIP_SEED !== '1') {
  run([path.join(root, 'dist', 'database', 'seeds', 'dev-seed.js')]);
}
