/**
 * Create the RLS-enforced `isms_app` role on a managed Postgres (Render).
 *
 * Docker does this in docker/postgres/init/01-app-role.sql as a superuser.
 * Render's default user is the table owner (not a superuser) but can usually
 * CREATE ROLE. Migrations GRANT EXECUTE to `isms_app`, so this must run first.
 *
 * Env:
 *   DATABASE_URL      owner connection (Render injects this)
 *   DB_APP_USERNAME   default isms_app
 *   DB_APP_PASSWORD   or DB_PASSWORD — login password for the app role
 *
 * Exits 0 if the role cannot be created so the API can still boot as the owner
 * (FORCE ROW LEVEL SECURITY still applies to a non-superuser owner).
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

const sslForUrl = (urlString) => {
  try {
    const host = new URL(urlString).hostname;
    if (host.includes('render.com')) {
      return { rejectUnauthorized: false };
    }
  } catch {
    // ignore
  }
  if (['1', 'true', 'yes'].includes(String(process.env.DB_SSL ?? '').toLowerCase())) {
    return { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' };
  }
  return undefined;
};

const main = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log('provision-app-role: DATABASE_URL not set — skipping (local docker uses init SQL).');
    return;
  }

  const appUser = process.env.DB_APP_USERNAME || process.env.DB_USERNAME || 'isms_app';
  const appPassword = process.env.DB_APP_PASSWORD || process.env.DB_PASSWORD;
  const ownerUser = decodeURIComponent(new URL(connectionString).username);

  if (!appPassword) {
    console.warn(
      'provision-app-role: no DB_APP_PASSWORD / DB_PASSWORD — skipping isms_app. API will use DATABASE_URL owner.',
    );
    return;
  }

  if (appUser === ownerUser) {
    console.log('provision-app-role: app user is the database owner; nothing to create.');
    return;
  }

  const client = new Client({
    connectionString,
    ssl: sslForUrl(connectionString),
  });
  await client.connect();

  try {
    const {
      rows: [{ database }],
    } = await client.query('SELECT current_database() AS database');
    const roleIdent = quoteIdent(appUser);
    const dbIdent = quoteIdent(database);
    const passwordSql = quoteLiteral(appPassword);

    const existing = await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [appUser]);
    if (existing.rowCount === 0) {
      await client.query(
        `CREATE ROLE ${roleIdent} LOGIN PASSWORD ${passwordSql} NOSUPERUSER NOBYPASSRLS`,
      );
      console.log(`provision-app-role: created role ${appUser}`);
    } else {
      await client.query(`ALTER ROLE ${roleIdent} LOGIN PASSWORD ${passwordSql} NOBYPASSRLS`);
      console.log(`provision-app-role: updated password for ${appUser}`);
    }

    await client.query(`GRANT CONNECT ON DATABASE ${dbIdent} TO ${roleIdent}`);
    await client.query(`GRANT USAGE ON SCHEMA public TO ${roleIdent}`);
    await client.query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${roleIdent}`,
    );
    await client.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${roleIdent}`);
    await client.query(`GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO ${roleIdent}`);
    await client.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${roleIdent}`,
    );
    await client.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${roleIdent}`,
    );
    await client.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO ${roleIdent}`,
    );
    console.log(`provision-app-role: granted DML on ${database} to ${appUser}`);
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error('provision-app-role: failed to create isms_app.');
  console.error(error);
  console.error(
    'Migrations GRANT EXECUTE to isms_app, so this role must exist before migration:run. If Render rejects CREATE ROLE, create it in the Render Postgres shell and retry.',
  );
  process.exit(1);
});
