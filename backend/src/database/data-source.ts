import { join } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { DataSource, type DataSourceOptions } from 'typeorm';

// The TypeORM CLI runs outside the Nest lifecycle, so it loads .env itself.
loadDotenv({ quiet: true });

const toBoolean = (value: string | undefined, fallback = false): boolean =>
  value === undefined ? fallback : ['1', 'true', 'yes'].includes(value.toLowerCase());

const toInteger = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

type ParsedDatabaseUrl = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  hostname: string;
};

const parseDatabaseUrl = (urlString: string): ParsedDatabaseUrl => {
  const url = new URL(urlString);
  const database = decodeURIComponent(url.pathname.replace(/^\//, '').split('/')[0] ?? '');
  return {
    host: url.hostname,
    hostname: url.hostname,
    port: toInteger(url.port, 5432),
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
  };
};

const resolveSsl = (
  env: NodeJS.ProcessEnv,
  parsed: ParsedDatabaseUrl | undefined,
): boolean | { rejectUnauthorized: boolean } => {
  const host = parsed?.hostname ?? env.DB_HOST ?? '';
  const sslRequested =
    toBoolean(env.DB_SSL) ||
    host.includes('render.com') ||
    /\bsslmode=(require|verify-ca|verify-full)\b/i.test(env.DATABASE_URL ?? '');

  if (!sslRequested) {
    return false;
  }

  // Render's public hostname is not in Node's default trust store. Internal
  // Render URLs usually skip TLS entirely (no render.com in the host).
  const rejectUnauthorized =
    host.includes('render.com')
      ? env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
      : env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';
  return { rejectUnauthorized };
};

const stripAppRoleOverlay = (env: NodeJS.ProcessEnv): NodeJS.ProcessEnv => {
  const rest: NodeJS.ProcessEnv = { ...env };
  delete rest.DB_USERNAME;
  delete rest.DB_PASSWORD;
  return rest;
};

/**
 * Single definition of the database connection, shared by the TypeORM CLI (for
 * migrations) and by `TypeOrmModule`.
 *
 * Local docker: discrete `DB_*` vars. Render: `DATABASE_URL` for host/db, with
 * `DB_USERNAME` / `DB_PASSWORD` overlay so the API can run as `isms_app` while
 * migrations/seed keep the owner role from the URL.
 *
 * `SKIP_APP_ROLE=1` (or a missing `isms_app` role) drops that overlay so the
 * process uses the `DATABASE_URL` owner — required on managed Postgres that
 * cannot CREATE ROLE.
 */
export const buildDataSourceOptions = (
  env: NodeJS.ProcessEnv = process.env,
): DataSourceOptions => {
  const effective =
    toBoolean(env.SKIP_APP_ROLE) && env.DATABASE_URL ? stripAppRoleOverlay(env) : env;
  const parsed = effective.DATABASE_URL ? parseDatabaseUrl(effective.DATABASE_URL) : undefined;
  const username = effective.DB_USERNAME || parsed?.username || 'postgres';
  const password = effective.DB_PASSWORD || parsed?.password || '';

  return {
    type: 'postgres',
    host: effective.DB_HOST || parsed?.host || 'localhost',
    port: effective.DB_PORT ? toInteger(effective.DB_PORT, 5432) : (parsed?.port ?? 5432),
    username,
    password,
    database: effective.DB_NAME || parsed?.database || 'isms_dev',
    ssl: resolveSsl(effective, parsed),
    logging: toBoolean(effective.DB_LOGGING),
    entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
    migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
    migrationsTableName: 'migrations',
    // Schema changes only ever arrive through a reviewed migration — never by
    // letting TypeORM diff and alter the database on boot.
    synchronize: false,
    migrationsRun: false,
  };
};

/**
 * Privileged connection for migrations and seed. Uses `DATABASE_URL` as-is when
 * set (Render owner). Locally falls back to `postgres` (or `DB_ADMIN_USERNAME`).
 */
export const buildAdminDataSourceOptions = (
  env: NodeJS.ProcessEnv = process.env,
): DataSourceOptions => {
  if (env.DATABASE_URL) {
    const rest: NodeJS.ProcessEnv = { ...env };
    delete rest.DB_USERNAME;
    delete rest.DB_PASSWORD;
    return buildDataSourceOptions({ ...rest, DATABASE_URL: env.DATABASE_URL });
  }

  return buildDataSourceOptions({
    ...env,
    DB_USERNAME: env.DB_ADMIN_USERNAME ?? 'postgres',
  });
};

const databaseRoleExists = async (
  env: NodeJS.ProcessEnv,
  roleName: string,
): Promise<boolean> => {
  const probe = new DataSource({
    ...buildAdminDataSourceOptions(env),
    entities: [],
    migrations: [],
    logging: false,
  });
  try {
    await probe.initialize();
    const rows: unknown[] = await probe.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [
      roleName,
    ]);
    return rows.length > 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `data-source: could not check for role "${roleName}" (${message}); using DATABASE_URL owner.`,
    );
    return false;
  } finally {
    if (probe.isInitialized) {
      await probe.destroy().catch(() => undefined);
    }
  }
};

/**
 * API boot: overlay `DB_USERNAME=isms_app` only when that role actually exists.
 * Migrations/seed keep using `buildAdminDataSourceOptions` (DATABASE_URL owner).
 */
export const resolveRuntimeDataSourceOptions = async (
  env: NodeJS.ProcessEnv = process.env,
): Promise<DataSourceOptions> => {
  if (toBoolean(env.SKIP_APP_ROLE) || !env.DATABASE_URL || !env.DB_USERNAME) {
    return buildDataSourceOptions(env);
  }

  const parsed = parseDatabaseUrl(env.DATABASE_URL);
  if (env.DB_USERNAME === parsed.username) {
    return buildDataSourceOptions(env);
  }

  if (await databaseRoleExists(env, env.DB_USERNAME)) {
    return buildDataSourceOptions(env);
  }

  console.warn(
    `data-source: role "${env.DB_USERNAME}" does not exist — connecting as DATABASE_URL user "${parsed.username}".`,
  );
  return buildDataSourceOptions(stripAppRoleOverlay(env));
};

/**
 * The TypeORM CLI requires exactly one exported `DataSource` in this file — don't add
 * a second one, and don't re-export it as default alongside this.
 *
 * `TYPEORM_USE_ADMIN=1` selects the owner role so `migration:run` is not attempted
 * as `isms_app`.
 */
export const AppDataSource = new DataSource(
  toBoolean(process.env.TYPEORM_USE_ADMIN)
    ? buildAdminDataSourceOptions()
    : buildDataSourceOptions(),
);
