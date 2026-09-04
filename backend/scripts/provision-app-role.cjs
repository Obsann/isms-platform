/**
 * Create the RLS-enforced `isms_app` role when the connecting user is allowed to.
 *
 * Docker does this in docker/postgres/init/01-app-role.sql as a superuser.
 * Render's database owner is not a superuser and does not have BYPASSRLS, so
 * `CREATE ROLE ... NOBYPASSRLS` / `ALTER ROLE ... NOBYPASSRLS` is illegal
 * (Postgres 42501). This script never touches the BYPASSRLS attribute.
 *
 * If CREATE ROLE is denied, log a warning and exit 0 so release can migrate,
 * seed, and run the API as the DATABASE_URL owner.
 *
 * Env:
 *   DATABASE_URL      owner connection (Render injects this)
 *   DB_APP_USERNAME   default isms_app
 *   DB_APP_PASSWORD   or DB_PASSWORD — login password for the app role
 *   SKIP_APP_ROLE=1   skip CREATE/ALTER ROLE entirely (still relaxes FORCE RLS)
 */
'use strict';

const { Client } = require('pg');

const quoteIdent = (name) => {
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) {
    throw new Error(`Refusing to use unsafe role name: ${name}`);
  }
  return `"${name}"`;
};

const quoteLiteral = (value) => `'${String(value).replace(/'/g, "''")}'`;

const isTruthy = (value) => ['1', 'true', 'yes'].includes(String(value ?? '').toLowerCase());

const sslForUrl = (urlString) => {
  try {
    const host = new URL(urlString).hostname;
    if (host.includes('render.com')) {
      return { rejectUnauthorized: false };
    }
  } catch {
    // ignore
  }
  if (isTruthy(process.env.DB_SSL)) {
    return { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' };
  }
  return undefined;
};

const isRolePrivilegeError = (error) => {
  const code = String(error?.code ?? '');
  const message = String(error?.message ?? '');
  return (
    code === '42501' ||
    /permission denied/i.test(message) ||
    /must be able to SET ROLE/i.test(message) ||
    /check_can_set_role/i.test(message) ||
    /BYPASSRLS/i.test(message)
  );
};

const tryQuery = async (client, sql, label) => {
  try {
    await client.query(sql);
    return true;
  } catch (error) {
    if (isRolePrivilegeError(error)) {
      console.warn(`provision-app-role: ${label}: ${error.message}`);
      return false;
    }
    throw error;
  }
};

const roleExists = async (client, appUser) => {
  const existing = await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [appUser]);
  return existing.rowCount > 0;
};

/**
 * FORCE RLS applies to the table owner. On managed Postgres the owner cannot
 * BYPASSRLS, so SECURITY DEFINER bootstrap functions owned by that owner would
 * still be blocked. ENABLE RLS stays on, which is enough to isolate `isms_app`.
 */
const relaxForceRlsIfUnmanaged = async (client) => {
  const {
    rows: [priv],
  } = await client.query(
    `SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user`,
  );
  if (priv?.rolsuper || priv?.rolbypassrls) {
    return;
  }

  const tables = await client.query(`
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relforcerowsecurity
  `);
  for (const { relname } of tables.rows) {
    await client.query(`ALTER TABLE ${quoteIdent(relname)} NO FORCE ROW LEVEL SECURITY`);
  }
  if (tables.rowCount > 0) {
    console.warn(
      `provision-app-role: cleared FORCE RLS on ${tables.rowCount} table(s) (owner cannot BYPASSRLS). ENABLE RLS remains.`,
    );
  }
};

const provisionRole = async (client, { appUser, appPassword, ownerUser }) => {
  const {
    rows: [{ database }],
  } = await client.query('SELECT current_database() AS database');
  const roleIdent = quoteIdent(appUser);
  const dbIdent = quoteIdent(database);
  const passwordSql = quoteLiteral(appPassword);

  const existed = await roleExists(client, appUser);
  if (!existed) {
    const created = await tryQuery(
      client,
      `CREATE ROLE ${roleIdent} LOGIN PASSWORD ${passwordSql} NOSUPERUSER`,
      'CREATE ROLE',
    );
    if (created) {
      console.log(`provision-app-role: created role ${appUser}`);
    }
  } else {
    const updated = await tryQuery(
      client,
      `ALTER ROLE ${roleIdent} LOGIN PASSWORD ${passwordSql}`,
      'ALTER ROLE',
    );
    if (updated) {
      console.log(`provision-app-role: updated password for ${appUser}`);
    }
  }

  if (!(await roleExists(client, appUser))) {
    console.warn(
      `provision-app-role: ${appUser} does not exist (connecting user ${ownerUser} cannot CREATE ROLE).`,
    );
    console.warn(
      'provision-app-role: continuing as DATABASE_URL owner. Overlay DB_USERNAME only if this role exists. Set SKIP_APP_ROLE=1 to skip this step.',
    );
    return false;
  }

  const grants = [
    [`GRANT CONNECT ON DATABASE ${dbIdent} TO ${roleIdent}`, 'GRANT CONNECT'],
    [`GRANT USAGE ON SCHEMA public TO ${roleIdent}`, 'GRANT USAGE'],
    [
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${roleIdent}`,
      'GRANT TABLES',
    ],
    [`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${roleIdent}`, 'GRANT SEQUENCES'],
    [`GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO ${roleIdent}`, 'GRANT FUNCTIONS'],
    [
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${roleIdent}`,
      'DEFAULT TABLES',
    ],
    [
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${roleIdent}`,
      'DEFAULT SEQUENCES',
    ],
    [
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO ${roleIdent}`,
      'DEFAULT FUNCTIONS',
    ],
  ];

  let granted = true;
  for (const [sql, label] of grants) {
    if (!(await tryQuery(client, sql, label))) {
      granted = false;
    }
  }
  if (granted) {
    console.log(`provision-app-role: granted DML on ${database} to ${appUser}`);
  }
  return true;
};

const main = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log('provision-app-role: DATABASE_URL not set — skipping (local docker uses init SQL).');
    return;
  }

  const skipCreate = isTruthy(process.env.SKIP_APP_ROLE);
  const appUser = process.env.DB_APP_USERNAME || process.env.DB_USERNAME || 'isms_app';
  const appPassword = process.env.DB_APP_PASSWORD || process.env.DB_PASSWORD;
  const ownerUser = decodeURIComponent(new URL(connectionString).username);

  const client = new Client({
    connectionString,
    ssl: sslForUrl(connectionString),
  });
  await client.connect();

  try {
    if (skipCreate) {
      console.log(
        'provision-app-role: SKIP_APP_ROLE is set — not creating isms_app; API/migrations use DATABASE_URL owner.',
      );
    } else if (!appPassword) {
      console.warn(
        'provision-app-role: no DB_APP_PASSWORD / DB_PASSWORD — skipping isms_app. API will use DATABASE_URL owner.',
      );
    } else if (appUser === ownerUser) {
      console.log('provision-app-role: app user is the database owner; nothing to create.');
    } else {
      await provisionRole(client, { appUser, appPassword, ownerUser });
    }

    await relaxForceRlsIfUnmanaged(client);
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  if (isRolePrivilegeError(error)) {
    console.warn('provision-app-role: permission denied while provisioning isms_app.');
    console.warn(error.message);
    console.warn(
      'provision-app-role: continuing so migrations/seed/API can run as the DATABASE_URL owner. Set SKIP_APP_ROLE=1 to skip this step.',
    );
    process.exit(0);
  }
  console.error('provision-app-role: unexpected error.');
  console.error(error);
  process.exit(1);
});
