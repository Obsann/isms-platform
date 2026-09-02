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

/**
 * Single definition of the database connection, shared by the TypeORM CLI (for
 * migrations) and by `TypeOrmModule`.
 *
 * Local docker: discrete `DB_*` vars. Render: `DATABASE_URL` for host/db, with
 * `DB_USERNAME` / `DB_PASSWORD` overlay so the API can run as `isms_app` while
 * migrations/seed keep the owner role from the URL.
 */
export const buildDataSourceOptions = (
  env: NodeJS.ProcessEnv = process.env,
): DataSourceOptions => {
  const parsed = env.DATABASE_URL ? parseDatabaseUrl(env.DATABASE_URL) : undefined;
  const username = env.DB_USERNAME || parsed?.username || 'postgres';
  const password = env.DB_PASSWORD || parsed?.password || '';

  return {
    type: 'postgres',
    host: env.DB_HOST || parsed?.host || 'localhost',
    port: env.DB_PORT ? toInteger(env.DB_PORT, 5432) : (parsed?.port ?? 5432),
    username,
    password,
    database: env.DB_NAME || parsed?.database || 'isms_dev',
    ssl: resolveSsl(env, parsed),
    logging: toBoolean(env.DB_LOGGING),
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
