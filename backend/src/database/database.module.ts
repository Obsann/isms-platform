import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { resolveRuntimeDataSourceOptions } from './data-source';

/**
 * Owns the database connection for the whole app.
 *
 * From Task 2 on, the API requires Postgres to be reachable at boot — an API that
 * starts up healthy without its database is worse than one that refuses to start.
 * Schema changes arrive only through migrations (`synchronize` stays false).
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () => ({
        ...(await resolveRuntimeDataSourceOptions()),
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
