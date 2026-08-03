import { Module } from '@nestjs/common';

/**
 * Owns the database connection for the whole app.
 *
 * TODO(Task 2 — Obsan): register `TypeOrmModule.forRootAsync` here using
 * `buildDataSourceOptions()` from `./data-source`, with `autoLoadEntities: true`,
 * once `tenants`, `members`, `staff_accounts`, `roles_permissions`, and `accounts`
 * exist as entities.
 *
 * Task 1 intentionally opens no connection: the scaffold has no entities to map and
 * must start on a machine where Postgres isn't running yet. The migration CLI
 * already works off `data-source.ts`.
 */
@Module({})
export class DatabaseModule {}
