import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntity } from './tenant.entity';

/**
 * Home of the platform-global `tenants` table.
 *
 * TODO(Task 19 — Biruk): add the tenant CRUD/provisioning service and controller here.
 * Those routes are platform-level and run outside per-tenant RLS, which the Super Admin
 * UI must flag on every action.
 */
@Module({
  imports: [TypeOrmModule.forFeature([TenantEntity])],
})
export class TenantsModule {}
