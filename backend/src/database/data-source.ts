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

/**
 * Single definition of the database connection, shared by the TypeORM CLI (for
 * migrations) and by `TypeOrmModule` once Task 2 registers it.
 */
export const buildDataSourceOptions = (
  env: NodeJS.ProcessEnv = process.env,
): DataSourceOptions => ({
  type: 'postgres',
  host: env.DB_HOST ?? 'localhost',
  port: toInteger(env.DB_PORT, 5432),
  username: env.DB_USERNAME ?? 'postgres',
  password: env.DB_PASSWORD ?? '',
  database: env.DB_NAME ?? 'isms_dev',
  ssl: toBoolean(env.DB_SSL),
  logging: toBoolean(env.DB_LOGGING),
  entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
  migrationsTableName: 'migrations',
  // Schema changes only ever arrive through a reviewed migration — never by
  // letting TypeORM diff and alter the database on boot.
  synchronize: false,
  migrationsRun: false,
});

/**
 * The TypeORM CLI requires exactly one exported `DataSource` in this file — don't add
 * a second one, and don't re-export it as default alongside this.
 */
export const AppDataSource = new DataSource(buildDataSourceOptions());
